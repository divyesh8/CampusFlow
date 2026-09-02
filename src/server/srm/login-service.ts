import { AcademiaClient } from "./academia-client";
import { SRM_CONFIG, type SRMLoginResult } from "./academia-config";
import { decodeAcademiaPage } from "./decode-academia-page";

const MAX_TERMINATE_RETRIES = 2;
const OVERALL_TIMEOUT = 30_000;

export type AuthStage =
  | "AUTH_REQUEST_START"
  | "SIGNIN_POST_START"
  | "SIGNIN_POST_COMPLETE"
  | "CONCURRENT_SESSION_DETECTED"
  | "CONCURRENT_SESSION_TERMINATED"
  | "OAUTH_REDIRECT_START"
  | "OAUTH_REDIRECT_1"
  | "OAUTH_REDIRECT_2"
  | "OAUTH_REDIRECT_3"
  | "OAUTH_COMPLETE"
  | "SESSION_VERIFY_START"
  | "SESSION_VERIFY_COMPLETE"
  | "PROFILE_FETCH_START"
  | "PROFILE_FETCH_COMPLETE"
  | "PROFILE_PARSE_COMPLETE"
  | "AUTH_COMPLETE";

export interface AuthStageLog {
  stage: AuthStage;
  duration: number;
  httpStatus?: number;
  cookieNames?: string[];
  redirectHost?: string;
  error?: string;
}

export class SRMLoginService {
  private client: AcademiaClient;
  private stageLogs: AuthStageLog[] = [];
  private overallStart: number;

  constructor() {
    this.client = new AcademiaClient();
    this.overallStart = Date.now();
  }

  getStageLogs(): AuthStageLog[] {
    return [...this.stageLogs];
  }

  private logStage(
    stage: AuthStage,
    startMs: number,
    extra?: { httpStatus?: number; error?: string; redirectHost?: string }
  ) {
    const duration = Date.now() - startMs;
    const log: AuthStageLog = {
      stage,
      duration,
      httpStatus: extra?.httpStatus,
      cookieNames: this.client.getCookieNames(),
      redirectHost: extra?.redirectHost,
      error: extra?.error,
    };
    this.stageLogs.push(log);
    console.log(
      `[SRM Auth] ${stage} — ${duration}ms${extra?.httpStatus ? ` — ${extra.httpStatus}` : ""}${extra?.error ? ` — ${extra.error}` : ""}`
    );
  }

  async login(
    username: string,
    password: string,
    cdigest?: string,
    captcha?: string
  ): Promise<SRMLoginResult> {
    return this.loginWithRetry(username, password, cdigest, captcha, 0);
  }

  private async loginWithRetry(
    username: string,
    password: string,
    cdigest: string | undefined,
    captcha: string | undefined,
    retryCount: number
  ): Promise<SRMLoginResult> {
    const overallElapsed = Date.now() - this.overallStart;
    if (overallElapsed > OVERALL_TIMEOUT) {
      return {
        success: false,
        cookies: {},
        error: "SRM authentication timed out. Please try again.",
        status: 408,
      };
    }

    if (retryCount > MAX_TERMINATE_RETRIES) {
      return {
        success: false,
        cookies: {},
        error:
          "Unable to clear existing SRM session. Please log out of Academia and try again.",
        status: 409,
      };
    }

    const fullUsername = username.includes("@")
      ? username
      : `${username}@srmist.edu.in`;

    const formData: Record<string, string> = {
      username: fullUsername,
      password,
      client_portal: "true",
      portal: SRM_CONFIG.portalId,
      servicename: SRM_CONFIG.serviceName,
      serviceurl: `${SRM_CONFIG.baseUrl}/`,
      is_ajax: "true",
      grant_type: "password",
      service_language: "en",
    };

    if (cdigest) {
      formData.cdigest = cdigest;
    }
    if (captcha) {
      formData.captcha = captcha;
    }

    let stageStart = Date.now();
    this.logStage("AUTH_REQUEST_START", stageStart);

    stageStart = Date.now();
    this.logStage("SIGNIN_POST_START", stageStart);

    let response;
    try {
      response = await this.client.post(
        SRM_CONFIG.signInUrl,
        formData,
        {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": SRM_CONFIG.browserHeaders["User-Agent"],
          Origin: SRM_CONFIG.baseUrl,
          Referer: `${SRM_CONFIG.baseUrl}/`,
        },
        false
      );
    } catch (err) {
      this.logStage("SIGNIN_POST_COMPLETE", stageStart, {
        error: err instanceof Error ? err.message : "unknown",
      });
      return {
        success: false,
        cookies: {},
        error:
          err instanceof Error && err.message === "SRM_TIMEOUT"
            ? "SRM did not respond in time. Please try again."
            : "Failed to connect to SRM server.",
        status: 503,
      };
    }

    this.logStage("SIGNIN_POST_COMPLETE", stageStart, {
      httpStatus: response.status,
    });

    const body = response.text;
    const lowered = body.toLowerCase();

    if (lowered.includes("concurrent") || lowered.includes("terminate")) {
      this.logStage("CONCURRENT_SESSION_DETECTED", Date.now());

      if (retryCount >= MAX_TERMINATE_RETRIES) {
        return {
          success: false,
          cookies: {},
          error:
            "Unable to clear existing SRM session. Please log out of Academia and try again.",
          status: 409,
        };
      }

      const forceLogoutResult = await this.forceLogout(body);
      if (forceLogoutResult) {
        this.logStage("CONCURRENT_SESSION_TERMINATED", Date.now());
        return this.loginWithRetry(
          username,
          password,
          cdigest,
          captcha,
          retryCount + 1
        );
      }

      return {
        success: false,
        cookies: {},
        error: "Session conflict. Please try again.",
        status: 401,
      };
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return {
        success: false,
        cookies: {},
        error: "Unexpected response from SRM server",
        status: response.status,
      };
    }

    const error = payload.error as Record<string, string> | undefined;
    if (error) {
      return {
        success: false,
        cookies: {},
        error: error.msg || "Authentication failed",
        status: 401,
      };
    }

    if (
      payload.status === "fail" &&
      (payload.code === "HIP_REQUIRED" || payload.code === "HIP_FAILED")
    ) {
      const captchaUrl = payload.cdigest
        ? SRM_CONFIG.captchaUrl.replace(
            "{cdigest}",
            payload.cdigest as string
          )
        : undefined;

      return {
        success: false,
        cookies: {},
        requiresCaptcha: true,
        captchaImage: captchaUrl,
        captchaDigest: payload.cdigest as string,
        error: (payload.message as string) || "Verification required",
        status: 401,
      };
    }

    const inner = payload.data as Record<string, string> | undefined;
    if (!inner) {
      return {
        success: false,
        cookies: {},
        error: (payload.message as string) || "Invalid credentials",
        status: 401,
      };
    }

    const accessToken = inner.access_token;
    const redirectUrl = inner.oauthorize_uri;

    if (!accessToken || !redirectUrl) {
      return {
        success: false,
        cookies: {},
        error: "Missing tokens in SRM response",
        status: 401,
      };
    }

    stageStart = Date.now();
    this.logStage("OAUTH_REDIRECT_START", stageStart);

    try {
      const oauthUrl = `${redirectUrl}&access_token=${accessToken}`;
      const oauthResult = await this.client.followRedirectChain(oauthUrl, "GET");

      const finalHostname = new URL(oauthResult.finalUrl).hostname;
      this.logStage("OAUTH_COMPLETE", stageStart, {
        httpStatus: oauthResult.status,
        redirectHost: finalHostname,
      });
    } catch (err) {
      this.logStage("OAUTH_COMPLETE", stageStart, {
        error: err instanceof Error ? err.message : "unknown",
      });
      return {
        success: false,
        cookies: {},
        error:
          err instanceof Error && err.message === "SRM_TIMEOUT"
            ? "SRM OAuth timed out. Please try again."
            : "OAuth redirect failed. Please try again.",
        status: 502,
      };
    }

    stageStart = Date.now();
    this.logStage("SESSION_VERIFY_START", stageStart);

    const cookies = this.client.getCookies();
    const hasSessionCookie =
      cookies.JSESSIONID ||
      cookies._iamadt_client_10002227248 ||
      cookies._iambdt_client_10002227248;

    if (!hasSessionCookie) {
      this.logStage("SESSION_VERIFY_COMPLETE", stageStart, {
        error: "no_session_cookies",
      });
      return {
        success: false,
        cookies,
        error: "Session failed: no session cookies established",
        status: 401,
      };
    }

    try {
      const verifyClient = new AcademiaClient();
      verifyClient.setCookies(cookies);
      const verifyResponse = await verifyClient.get(SRM_CONFIG.coursePage, {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      });

      if (verifyResponse.status !== 200) {
        this.logStage("SESSION_VERIFY_COMPLETE", stageStart, {
          httpStatus: verifyResponse.status,
          error: "verification_failed",
        });
        return {
          success: false,
          cookies,
          error: "Session verification failed. Please try again.",
          status: 401,
        };
      }

      const decoded = decodeAcademiaPage(verifyResponse.text);
      if (decoded.error) {
        this.logStage("SESSION_VERIFY_COMPLETE", stageStart, {
          httpStatus: verifyResponse.status,
          error: decoded.error,
        });
        return {
          success: false,
          cookies,
          error:
            decoded.error === "SRM_SESSION_EXPIRED"
              ? "SRM session expired. Please try again."
              : "Could not verify SRM session.",
          status: 401,
        };
      }

      this.logStage("SESSION_VERIFY_COMPLETE", stageStart, {
        httpStatus: verifyResponse.status,
      });
    } catch (err) {
      this.logStage("SESSION_VERIFY_COMPLETE", stageStart, {
        error: err instanceof Error ? err.message : "unknown",
      });
      return {
        success: false,
        cookies,
        error: "Session verification failed. Please try again.",
        status: 401,
      };
    }

    this.logStage("AUTH_COMPLETE", Date.now());

    return {
      success: true,
      cookies,
      status: 200,
    };
  }

  private async forceLogout(html: string): Promise<boolean> {
    const formMatch = html.match(
      /<form[^>]*action="([^"]*)"[^>]*>([\s\S]*?)<\/form>/i
    );
    if (!formMatch) return false;

    const action = formMatch[1];
    const formHtml = formMatch[2];

    const formData: Record<string, string> = {};
    const inputMatches = formHtml.matchAll(
      /<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*>/gi
    );
    for (const match of inputMatches) {
      formData[match[1]] = match[2];
    }

    const url = action.startsWith("http")
      ? action
      : `${SRM_CONFIG.baseUrl}${action}`;

    try {
      const response = await this.client.post(url, formData, {
        "Content-Type": "application/x-www-form-urlencoded",
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async logout(cookies: Record<string, string>): Promise<boolean> {
    const client = new AcademiaClient();
    client.setCookies(cookies);
    try {
      const response = await client.get(SRM_CONFIG.logoutUrl);
      return response.status === 200 || response.status === 302;
    } catch {
      return false;
    }
  }

  getClient(): AcademiaClient {
    return this.client;
  }
}

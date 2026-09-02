import { AcademiaClient } from "./academia-client";
import { SRM_CONFIG, type SRMLoginResult } from "./academia-config";

export class SRMLoginService {
  private client: AcademiaClient;

  constructor() {
    this.client = new AcademiaClient();
  }

  async login(
    username: string,
    password: string,
    cdigest?: string,
    captcha?: string
  ): Promise<SRMLoginResult> {
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

    const response = await this.client.post(
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

    const body = response.text;
    const lowered = body.toLowerCase();

    if (
      lowered.includes("concurrent") ||
      lowered.includes("terminate")
    ) {
      const forceLogoutResult = await this.forceLogout(body);
      if (forceLogoutResult) {
        return this.login(username, password, cdigest, captcha);
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

    await this.client.get(
      `${redirectUrl}&access_token=${accessToken}`
    );

    const cookies = this.client.getCookies();

    if (!cookies.JSESSIONID) {
      return {
        success: false,
        cookies,
        error: "Session failed: JSESSIONID not established",
        status: 401,
      };
    }

    return {
      success: true,
      cookies,
      status: 200,
    };
  }

  private async forceLogout(html: string): Promise<boolean> {
    const formMatch = html.match(/<form[^>]*action="([^"]*)"[^>]*>([\s\S]*?)<\/form>/i);
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

    const response = await this.client.post(url, formData, {
      "Content-Type": "application/x-www-form-urlencoded",
    });

    return response.status === 200;
  }

  async logout(cookies: Record<string, string>): Promise<boolean> {
    const client = new AcademiaClient();
    client.setCookies(cookies);
    const response = await client.get(SRM_CONFIG.logoutUrl);
    return response.status === 200 || response.status === 302;
  }

  getClient(): AcademiaClient {
    return this.client;
  }
}

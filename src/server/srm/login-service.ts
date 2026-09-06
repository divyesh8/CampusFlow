import { randomUUID } from "crypto";
import * as cheerio from "cheerio";
import { AcademiaClient, trustedSRMUrl } from "./academia-client";
import { SRM_CONFIG, type SRMLoginResult, type SRMStudentProfile } from "./academia-config";
import { decodeAcademiaPage } from "./decode-academia-page";
import { parseStudentProfile } from "./parsers/profile-parser";
import { classifySRMError } from "./error-codes";

export interface AuthStageLog {
  stage: string;
  duration: number;
  httpStatus?: number;
  cookieNames?: string[];
  error?: string;
}

export class SRMLoginService {
  private client = new AcademiaClient();
  private stageLogs: AuthStageLog[] = [];
  private profile: SRMStudentProfile | null = null;
  constructor(private requestId: string = randomUUID()) {}

  getStageLogs() { return [...this.stageLogs]; }
  getClient() { return this.client; }
  getProfile() { return this.profile; }

  private log(stage: string, start = Date.now(), httpStatus?: number, error?: string) {
    const record = { stage, duration: Date.now() - start, httpStatus, error };
    this.stageLogs.push(record);
    console.log(JSON.stringify({ requestId: this.requestId, ...record }));
  }

  async inspectLoginPage() {
    const start = Date.now();
    const landing = await this.client.get(SRM_CONFIG.baseUrl);
    if (landing.status !== 200) throw new Error("SRM_SERVER_REJECTED");
    const $ = cheerio.load(landing.text);
    const iframe = $("iframe[src]").toArray().map((element) => $(element).attr("src"))
      .find((src) => src?.includes("/accounts/"));
    const page = iframe ? await this.client.get(trustedSRMUrl(iframe).href) : landing;
    if (page.status !== 200) throw new Error("SRM_SERVER_REJECTED");
    const form = cheerio.load(page.text);
    const inputNames = form("input").toArray().map((element) =>
      form(element).attr("name") || form(element).attr("id") || "").filter(Boolean);
    const loginFormDetected = form('input[type="password"]').length > 0;
    this.log("SRM_LOGIN_PAGE_FETCHED", start, page.status);
    if (!loginFormDetected) throw new Error("SRM_LOGIN_FORM_CHANGED");
    return {
      academiaReachable: true, loginPageReceived: true, loginFormDetected,
      initialCookiesReceived: this.client.getCookieNames().length > 0,
      cookieNames: this.client.getCookieNames(), inputNames,
      contentType: page.headers.get("content-type"),
      // Presence of a hidden CAPTCHA template does not mean CAPTCHA is required.
      captchaInputPresent: inputNames.some((name) => /captcha/i.test(name)),
    };
  }

  async login(username: string, password: string, cdigest?: string, captcha?: string): Promise<SRMLoginResult> {
    this.log("SRM_AUTH_START");
    try {
      if (!cdigest) await this.inspectLoginPage();
      return await this.submit(username, password, cdigest, captcha, 0);
    } catch (error) {
      const code = classifySRMError(error);
      this.log(code, Date.now(), undefined, code);
      return { success: false, cookies: this.client.getCookies(), error: code };
    }
  }

  private async submit(username: string, password: string, cdigest: string | undefined,
    captcha: string | undefined, retries: number): Promise<SRMLoginResult> {
    const formData = {
      username: username.includes("@") ? username : `${username}@srmist.edu.in`,
      password, client_portal: "true", portal: SRM_CONFIG.portalId,
      servicename: SRM_CONFIG.serviceName, serviceurl: `${SRM_CONFIG.baseUrl}/`,
      is_ajax: "true", grant_type: "password", service_language: "en",
      ...(cdigest ? { cdigest } : {}), ...(captcha ? { captcha } : {}),
    };
    const start = Date.now();
    const response = await this.client.post(SRM_CONFIG.signInUrl, formData, {
      Origin: SRM_CONFIG.baseUrl, "Content-Type": "application/x-www-form-urlencoded",
    }, false);
    this.log("SRM_CREDENTIALS_SUBMITTED", start, response.status);
    if (response.status >= 500 || response.status === 429 || response.status === 403) {
      throw new Error("SRM_SERVER_REJECTED");
    }
    if (response.status >= 300 && response.status < 400) throw new Error("SRM_REDIRECT_UNEXPECTED");

    let payload: Record<string, unknown>;
    try { payload = JSON.parse(response.text); }
    catch {
      // A termination template on the ordinary login page is not a conflict.
      const $ = cheerio.load(response.text);
      const form = $('form[action*="terminate"]').first();
      if (!form.length) throw new Error("SRM_LOGIN_FORM_CHANGED");
      this.log("SRM_SESSION_CONFLICT");
      if (retries >= 1) throw new Error("SRM_SESSION_CONFLICT");
      const values: Record<string, string> = {};
      form.find("input[name]").each((_, element) => {
        values[$(element).attr("name")!] = $(element).attr("value") ?? "";
      });
      const result = await this.client.post(trustedSRMUrl(form.attr("action")!).href, values);
      if (result.status !== 200) throw new Error("SRM_SESSION_CONFLICT");
      return this.submit(username, password, cdigest, captcha, retries + 1);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("SRM_LOGIN_FORM_CHANGED");
    if (payload.code === "HIP_REQUIRED" || payload.code === "HIP_FAILED") {
      if (typeof payload.cdigest !== "string" || !/^[a-zA-Z0-9_-]{1,512}$/.test(payload.cdigest)) {
        throw new Error("SRM_SCHEMA_CHANGED");
      }
      const code = payload.code === "HIP_FAILED" ? "SRM_CAPTCHA_FAILED" : "SRM_CAPTCHA_REQUIRED";
      this.log(code);
      return { success: false, cookies: this.client.getCookies(), requiresCaptcha: true,
        captchaDigest: payload.cdigest, captchaImage: SRM_CONFIG.captchaUrl.replace("{cdigest}", payload.cdigest),
        error: code, status: 401 };
    }
    if (payload.error || payload.status === "fail") throw new Error("SRM_INVALID_CREDENTIALS");
    const inner = payload.data as Record<string, unknown> | undefined;
    if (!inner || typeof inner.access_token !== "string" || typeof inner.oauthorize_uri !== "string") {
      throw new Error("SRM_LOGIN_FORM_CHANGED");
    }
    const oauth = trustedSRMUrl(inner.oauthorize_uri);
    oauth.searchParams.set("access_token", inner.access_token);
    const redirect = await this.client.followRedirectChain(oauth.href);
    this.log("SRM_REDIRECT_RECEIVED", start, redirect.status);
    if (redirect.status !== 200) throw new Error("SRM_SERVER_REJECTED");

    this.log("SRM_PROFILE_FETCH_START");
    const page = await this.client.get(SRM_CONFIG.sessionVerifyPage);
    if (page.status !== 200) throw new Error("SRM_SERVER_REJECTED");
    const decoded = decodeAcademiaPage(page.text);
    if (decoded.error) throw new Error(decoded.error);
    const profile = parseStudentProfile(decoded.html);
    // Both identity fields are required; a 200 page or session cookie is insufficient.
    if (!profile.name || !/^RA\d{13}$/.test(profile.regNumber)) throw new Error("SRM_PROFILE_PARSE_FAILED");
    this.profile = profile;
    this.log("SRM_AUTHENTICATED_PAGE_DETECTED");
    this.log("SRM_PROFILE_FETCH_SUCCESS");
    this.log("SRM_AUTH_SUCCESS", start);
    return { success: true, cookies: this.client.getCookies(), status: 200 };
  }
}


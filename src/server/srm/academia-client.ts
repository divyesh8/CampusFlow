import { SRM_CONFIG, type SRMCookieJar } from "./academia-config";

const MAX_REDIRECTS = 10;
const PER_REQUEST_TIMEOUT = 12_000;

export class AcademiaClient {
  private cookies: SRMCookieJar = {};
  private timeout: number;

  constructor(timeout = PER_REQUEST_TIMEOUT) {
    this.timeout = timeout;
  }

  updateCookies(setCookieHeaders: string[]): void {
    for (const header of setCookieHeaders) {
      const parts = header.split(";")[0].split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        if (value && value !== "delete" && value !== "null") {
          this.cookies[name] = value;
        }
      }
    }
  }

  cookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  getCookies(): SRMCookieJar {
    return { ...this.cookies };
  }

  getCookieNames(): string[] {
    return Object.keys(this.cookies);
  }

  setCookies(cookies: SRMCookieJar): void {
    this.cookies = { ...cookies };
  }

  private extractSetCookies(response: Response): string[] {
    const getSetCookie = response.headers.getSetCookie?.();
    if (getSetCookie && getSetCookie.length > 0) {
      return getSetCookie;
    }
    const single = response.headers.get("set-cookie");
    return single ? [single] : [];
  }

  private mergeCookies(setCookieHeaders: string[]): void {
    const newNames: string[] = [];
    for (const header of setCookieHeaders) {
      const parts = header.split(";")[0].split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        if (value && value !== "delete" && value !== "null") {
          if (!this.cookies[name]) {
            newNames.push(name);
          }
          this.cookies[name] = value;
        } else {
          delete this.cookies[name];
        }
      }
    }
    if (newNames.length > 0) {
      console.log(`[SRM Client] Cookies added: ${newNames.join(", ")}`);
    }
  }

  async followRedirectChain(
    startUrl: string,
    method: "GET" | "POST" = "GET",
    body?: string
  ): Promise<{ status: number; text: string; headers: Headers; finalUrl: string }> {
    let currentUrl = startUrl;
    let currentBody = body;
    let currentMethod = method;

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      const mergedHeaders: Record<string, string> = {
        ...SRM_CONFIG.browserHeaders,
        ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response: Response;
      try {
        const fetchOptions: RequestInit = {
          method: currentMethod,
          headers: mergedHeaders,
          signal: controller.signal,
          redirect: "manual",
        };
        if (currentBody && currentMethod === "POST") {
          fetchOptions.body = currentBody;
        }
        response = await fetch(currentUrl, fetchOptions);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("SRM_TIMEOUT");
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      const setCookies = this.extractSetCookies(response);
      this.mergeCookies(setCookies);

      const status = response.status;
      if (status < 300 || status >= 400) {
        const text = await response.text();
        return { status, text, headers: response.headers, finalUrl: currentUrl };
      }

      const location = response.headers.get("Location");
      if (!location) {
        const text = await response.text();
        return { status, text, headers: response.headers, finalUrl: currentUrl };
      }

      try {
        currentUrl = new URL(location, currentUrl).href;
      } catch {
        currentUrl = location;
      }

      currentMethod = "GET";
      currentBody = undefined;

      console.log(`[SRM Client] Redirect ${hop + 1}: ${status} → ${new URL(currentUrl).hostname}${new URL(currentUrl).pathname}`);
    }

    throw new Error("SRM_TOO_MANY_REDIRECTS");
  }

  async get(
    url: string,
    headers?: Record<string, string>
  ): Promise<{ status: number; text: string; headers: Headers }> {
    const mergedHeaders: Record<string, string> = {
      ...SRM_CONFIG.browserHeaders,
      ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      ...headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: mergedHeaders,
        signal: controller.signal,
        redirect: "manual",
      });

      const setCookies = this.extractSetCookies(response);
      this.mergeCookies(setCookies);

      const status = response.status;
      if (status >= 300 && status < 400) {
        const location = response.headers.get("Location");
        if (location) {
          let redirectUrl: string;
          try {
            redirectUrl = new URL(location, url).href;
          } catch {
            redirectUrl = location;
          }
          return this.followRedirectChain(redirectUrl, "GET");
        }
      }

      const text = await response.text();
      return { status, text, headers: response.headers };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("SRM_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async post(
    url: string,
    data: Record<string, string>,
    headers?: Record<string, string>,
    followRedirects = true
  ): Promise<{ status: number; text: string; headers: Headers }> {
    const mergedHeaders: Record<string, string> = {
      ...SRM_CONFIG.browserHeaders,
      ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      ...headers,
    };

    const body = new URLSearchParams(data).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: mergedHeaders,
        body,
        signal: controller.signal,
        redirect: "manual",
      });

      const setCookies = this.extractSetCookies(response);
      this.mergeCookies(setCookies);

      const status = response.status;

      if (followRedirects && status >= 300 && status < 400) {
        const location = response.headers.get("Location");
        if (location) {
          let redirectUrl: string;
          try {
            redirectUrl = new URL(location, url).href;
          } catch {
            redirectUrl = location;
          }
          return this.followRedirectChain(redirectUrl, "GET");
        }
      }

      const text = await response.text();
      return { status, text, headers: response.headers };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("SRM_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async delete(
    url: string,
    headers?: Record<string, string>
  ): Promise<{ status: number; text: string }> {
    const mergedHeaders: Record<string, string> = {
      ...SRM_CONFIG.browserHeaders,
      ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      ...headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: mergedHeaders,
        signal: controller.signal,
      });

      const setCookies = this.extractSetCookies(response);
      this.mergeCookies(setCookies);

      const text = await response.text();
      return { status: response.status, text };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("SRM_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

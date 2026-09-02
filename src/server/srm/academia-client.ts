import { SRM_CONFIG, type SRMCookieJar } from "./academia-config";

export class AcademiaClient {
  private cookies: SRMCookieJar = {};
  private timeout: number;

  constructor(timeout = 30000) {
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

  setCookies(cookies: SRMCookieJar): void {
    this.cookies = { ...cookies };
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
        redirect: "follow",
      });

      const setCookie = response.headers.getSetCookie?.() || [];
      this.updateCookies(setCookie);

      const text = await response.text();
      return { status: response.status, text, headers: response.headers };
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
        redirect: followRedirects ? "follow" : "manual",
      });

      const setCookie = response.headers.getSetCookie?.() || [];
      this.updateCookies(setCookie);

      const text = await response.text();
      return { status: response.status, text, headers: response.headers };
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

      const setCookie = response.headers.getSetCookie?.() || [];
      this.updateCookies(setCookie);

      const text = await response.text();
      return { status: response.status, text };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

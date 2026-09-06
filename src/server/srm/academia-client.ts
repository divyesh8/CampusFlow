import { CookieJar } from "tough-cookie";
import { SRM_CONFIG, type SRMCookieJar } from "./academia-config";

const SERIALIZED_JAR = "__campusflow_cookie_jar_v2";
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export function trustedSRMUrl(value: string, base: string = SRM_CONFIG.baseUrl): URL {
  const url = new URL(value, base);
  // Expand only after a real SRM response demonstrates another required origin.
  if (url.origin !== SRM_CONFIG.baseUrl || url.username || url.password) {
    throw new Error("SRM_REDIRECT_UNEXPECTED");
  }
  return url;
}

export class AcademiaClient {
  private jar = new CookieJar();
  private deadline: number;

  constructor(private timeout = 12_000, budget = 45_000) {
    this.deadline = Date.now() + budget;
  }

  updateCookies(headers: string[], url: string = SRM_CONFIG.baseUrl): void {
    for (const header of headers) this.jar.setCookieSync(header, url, { ignoreError: true });
  }

  cookieHeader(url: string = SRM_CONFIG.baseUrl): string {
    return this.jar.getCookieStringSync(url);
  }

  getCookies(): SRMCookieJar {
    return { [SERIALIZED_JAR]: JSON.stringify(this.jar.serializeSync()) };
  }

  getCookieNames(): string[] {
    return this.jar.getCookiesSync(SRM_CONFIG.baseUrl).map((cookie) => cookie.key);
  }

  setCookies(cookies: SRMCookieJar): void {
    if (cookies[SERIALIZED_JAR]) {
      this.jar = CookieJar.deserializeSync(cookies[SERIALIZED_JAR]);
      return;
    }
    // Legacy sessions lacked scope; restrict them to the Academia host.
    this.jar = new CookieJar();
    for (const [name, value] of Object.entries(cookies)) {
      this.updateCookies([`${name}=${value}; Path=/; Secure`]);
    }
  }

  private async request(url: string, method: string, body?: string,
    headers?: Record<string, string>, follow = true) {
    let current = trustedSRMUrl(url);
    for (let hop = 0; hop <= 10; hop++) {
      const remaining = Math.min(this.timeout, this.deadline - Date.now());
      if (remaining <= 0) throw new Error("SRM_TIMEOUT");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      try {
        const response = await fetch(current, {
          method, body, redirect: "manual", cache: "no-store", signal: controller.signal,
          headers: { ...SRM_CONFIG.browserHeaders, ...headers, Cookie: this.cookieHeader(current.href) },
        });
        this.updateCookies(response.headers.getSetCookie(), current.href);
        if (REDIRECTS.has(response.status) && follow) {
          const location = response.headers.get("location");
          if (!location || hop === 10) throw new Error("SRM_REDIRECT_UNEXPECTED");
          const next = trustedSRMUrl(location, current.href);
          await response.body?.cancel();
          if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === "POST")) {
            method = "GET";
            body = undefined;
          }
          current = next;
          continue;
        }
        // Keep the timeout active until the body has finished, too.
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        if (reader) {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            size += chunk.value.length;
            if (size > 3_000_000) { await reader.cancel(); throw new Error("SRM_SCHEMA_CHANGED"); }
            chunks.push(chunk.value);
          }
        }
        const bytes = Buffer.concat(chunks);
        return { status: response.status, text: bytes.toString("utf8"), bytes,
          headers: response.headers, finalUrl: current.href };
      } catch (error) {
        if (controller.signal.aborted) throw new Error("SRM_TIMEOUT");
        if (error instanceof Error && error.message.startsWith("SRM_")) throw error;
        throw new Error("SRM_NETWORK_ERROR");
      } finally { clearTimeout(timer); }
    }
    throw new Error("SRM_REDIRECT_UNEXPECTED");
  }

  followRedirectChain(url: string, method: "GET" | "POST" = "GET", body?: string) {
    return this.request(url, method, body);
  }
  get(url: string, headers?: Record<string, string>) { return this.request(url, "GET", undefined, headers); }
  post(url: string, data: Record<string, string>, headers?: Record<string, string>, follow = true) {
    return this.request(url, "POST", new URLSearchParams(data).toString(), headers, follow);
  }
  delete(url: string, headers?: Record<string, string>) { return this.request(url, "DELETE", undefined, headers); }
}


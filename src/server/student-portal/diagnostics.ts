import { randomUUID } from "node:crypto";
import { messages, PortalError, isPortalError, type ErrorCode } from "./errors";

type Stage = "PORTAL_REQUEST_START" | "PORTAL_BROWSER_START" | "PORTAL_BROWSER_READY" | "PORTAL_CHALLENGE_START" | "PORTAL_PAGE_LOADED" |
  "PORTAL_CAPTCHA_READY" | "PORTAL_LOGIN_START" | "PORTAL_LOGIN_SUBMITTED" |
  "PORTAL_LOGIN_REDIRECT" | "PORTAL_AUTHENTICATED" | "PORTAL_SYNC_UNIMPLEMENTED" | "PORTAL_REQUEST_FAILED" |
  "PORTAL_SESSION_CREATED" | "PORTAL_SESSION_DESTROYED";

export class PortalDiagnostics {
  readonly requestId = randomUUID();
  private readonly startedAt = Date.now();
  stage(stage: Stage, httpStatus?: number, errorCode?: ErrorCode) {
    // Deliberately build an allowlist record. Never pass requests, errors, URLs,
    // credentials, portal contents or arbitrary metadata to the logger.
    console.info(JSON.stringify({ requestId: this.requestId, stage,
      duration: Math.max(0, Date.now() - this.startedAt),
      ...(Number.isInteger(httpStatus) && httpStatus! >= 100 && httpStatus! <= 599 ? { httpStatus } : {}),
      ...(errorCode && Object.hasOwn(messages, errorCode) ? { errorCode } : {}),
    }));
  }
  failure(error: unknown) {
    const safe = isPortalError(error) ? error : new PortalError("INTERNAL_ERROR", 500);
    this.stage("PORTAL_REQUEST_FAILED", safe.status, safe.code);
  }
}

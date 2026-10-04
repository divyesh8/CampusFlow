export const messages = {
  INVALID_REQUEST: "Check the required fields and try again.",
  INVALID_CREDENTIALS: "Incorrect NetID or password. Load a new CAPTCHA and try again.",
  INVALID_CAPTCHA: "CAPTCHA was incorrect or expired. Load a new one.",
  PORTAL_UNAVAILABLE: "SRM Student Portal is currently unavailable. Please try again later.",
  PORTAL_CHANGED: "SRM's page format is not supported yet. Your connection was closed.",
  SESSION_EXPIRED: "Your SRM session expired. Connect again.",
  LOGIN_FAILED: "Could not verify your login. Check your details and load a new CAPTCHA.",
  RATE_LIMITED: "Too many requests. Please wait a few minutes.",
  SESSION_BUSY: "A connection request is already running. Please wait.",
  CAPACITY_REACHED: "All connection slots are busy. Please try again shortly.",
  ORIGIN_REJECTED: "This request is not allowed.",
  CONFIGURATION_ERROR: "CampusFlow's connection service is not configured.",
} as const;
export type ErrorCode = keyof typeof messages;
const PORTAL_ERROR = Symbol.for("campusflow.student-portal.error");
export class PortalError extends Error {
  readonly [PORTAL_ERROR] = true;
  constructor(readonly code: ErrorCode, readonly status = 502) { super(messages[code]); }
}

// Next may load route bundles (and development reloads) with different class
// identities while the global session store survives. instanceof alone loses
// SESSION_EXPIRED from another bundle and incorrectly becomes a portal outage.
export function isPortalError(error: unknown): error is PortalError {
  if (!error || typeof error !== "object") return false;
  const value = error as PortalError;
  return value[PORTAL_ERROR] === true && Object.hasOwn(messages, value.code) &&
    Number.isInteger(value.status) && value.status >= 400 && value.status <= 599;
}

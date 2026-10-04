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
export class PortalError extends Error {
  constructor(readonly code: ErrorCode, readonly status = 502) { super(messages[code]); }
}

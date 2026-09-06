const ERRORS = {
  SRM_INVALID_CREDENTIALS: [401, "SRM rejected the NetID or password."],
  SRM_TIMEOUT: [504, "SRM did not respond in time."],
  SRM_NETWORK_ERROR: [502, "Could not connect to SRM."],
  SRM_CAPTCHA_REQUIRED: [401, "SRM requires verification."],
  SRM_CAPTCHA_FAILED: [401, "Verification failed. Please try the new CAPTCHA."],
  SRM_SESSION_CONFLICT: [409, "Please sign out of Academia and reconnect."],
  SRM_OAUTH_FAILED: [502, "SRM authentication redirect failed."],
  SRM_REDIRECT_UNEXPECTED: [502, "SRM returned an unexpected redirect."],
  SRM_SESSION_VERIFY_FAILED: [502, "SRM session could not be verified."],
  SRM_SESSION_EXPIRED: [401, "SRM connection expired. Please reconnect."],
  SRM_PROFILE_PARSE_FAILED: [502, "CampusFlow could not read your SRM profile."],
  SRM_SCHEMA_CHANGED: [502, "The SRM page format is not recognized. The parser needs an update."],
  SRM_LOGIN_FORM_CHANGED: [502, "The SRM sign-in format is not recognized."],
  SRM_SERVER_REJECTED: [502, "SRM is temporarily unavailable or rejected this request."],
  SRM_IDENTITY_MISMATCH: [502, "SRM returned an inconsistent student identity."],
  SERVER_CONFIG_ERROR: [503, "CampusFlow's SRM connection is temporarily misconfigured."],
  SESSION_STORE_ERROR: [503, "CampusFlow could not save your session."],
  DATABASE_ERROR: [503, "CampusFlow could not read or save academic data."],
  UNKNOWN_SERVER_ERROR: [500, "An unexpected error occurred. Please try again."],
} as const;
export type SRMErrorCode = keyof typeof ERRORS;

export function classifySRMError(error: unknown): SRMErrorCode {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message in ERRORS) return message as SRMErrorCode;
  if (/timeout|timed out/i.test(message)) return "SRM_TIMEOUT";
  if (/fetch failed|network|econn|enotfound/i.test(message)) return "SRM_NETWORK_ERROR";
  if (/config|environment/i.test(message)) return "SERVER_CONFIG_ERROR";
  return "UNKNOWN_SERVER_ERROR";
}

export function createErrorResponse(code: SRMErrorCode, requestId: string) {
  console.error(JSON.stringify({ requestId, stage: code, status: "failed" }));
  return { response: { code, error: ERRORS[code][1], requestId }, status: ERRORS[code][0] };
}


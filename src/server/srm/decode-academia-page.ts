const LOGIN_PAGE_INDICATORS = [
  "signin.ac",
  "login",
  "Sign In",
  "username",
  "password",
  "HIP_REQUIRED",
];

const SESSION_EXPIRED_INDICATORS = [
  "session expired",
  "session_timeout",
  "logged out",
  "please login",
  "please sign in",
  "access denied",
];

export function extractSanitizedPayload(html: string): string | null {
  const sanitizeMatch = html.match(
    /\.sanitize\(\s*["'`](.*?)["'`]\s*\)/s
  );
  if (sanitizeMatch && sanitizeMatch[1]) {
    return sanitizeMatch[1];
  }

  const jsStringMatch = html.match(
    /ZC\.Loader\([\s\S]*?\.sanitize\(\s*["'`](.*?)["'`]\s*\)/s
  );
  if (jsStringMatch && jsStringMatch[1]) {
    return jsStringMatch[1];
  }

  return null;
}

export function decodeHexEscapes(input: string): string {
  let result = input.replace(/\\x([0-9A-Fa-f]{2})/g, (_match, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  result = result.replace(/\\u003C/g, "<");
  result = result.replace(/\\u003E/g, ">");
  result = result.replace(/\\u0026/g, "&");
  result = result.replace(/\\u0022/g, '"');
  result = result.replace(/\\u0027/g, "'");
  result = result.replace(/\\u003D/g, "=");
  result = result.replace(/\\u002F/g, "/");

  result = result.replace(/\\\\/g, "\\");
  result = result.replace(/\\"/g, '"');
  result = result.replace(/\\'/g, "'");

  return result;
}

export function validateDecodedHtml(html: string): {
  valid: boolean;
  error?: string;
} {
  if (!html || html.trim().length < 100) {
    return { valid: false, error: "SRM_SCHEMA_CHANGED" };
  }

  const lower = html.toLowerCase();

  for (const indicator of LOGIN_PAGE_INDICATORS) {
    if (
      lower.includes(indicator.toLowerCase()) &&
      lower.includes("password") &&
      lower.includes("username")
    ) {
      return { valid: false, error: "SRM_SESSION_EXPIRED" };
    }
  }

  for (const indicator of SESSION_EXPIRED_INDICATORS) {
    if (lower.includes(indicator)) {
      return { valid: false, error: "SRM_SESSION_EXPIRED" };
    }
  }

  const hasTable = lower.includes("<table");
  const hasForm = lower.includes("<form");
  const hasDiv = lower.includes("<div");
  if (!hasTable && !hasForm && !hasDiv) {
    return { valid: false, error: "SRM_SCHEMA_CHANGED" };
  }

  return { valid: true };
}

export function decodeAcademiaPage(rawHtml: string): {
  html: string;
  decoded: boolean;
  error?: string;
} {
  const payload = extractSanitizedPayload(rawHtml);

  if (payload) {
    const decoded = decodeHexEscapes(payload);
    const validation = validateDecodedHtml(decoded);
    if (!validation.valid) {
      return { html: "", decoded: true, error: validation.error };
    }
    return { html: decoded, decoded: true };
  }

  const validation = validateDecodedHtml(rawHtml);
  if (!validation.valid) {
    return { html: "", decoded: false, error: validation.error };
  }

  return { html: rawHtml, decoded: false };
}

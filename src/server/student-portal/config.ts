// Observed on the public Student Portal login page, 2026-10-04.
// These are NOT Academia/Zoho selectors. Never read the portal's CAPTCHA answer.
import { PortalError } from "./errors";
export const PORTAL_ORIGIN = "https://sp.srmist.edu.in";
export const LOGIN_URL = `${PORTAL_ORIGIN}/srmiststudentportal/students/loginManager/youLogin.jsp`;
export const selectors = {
  form: "#login_form", netId: "#username", password: "#password",
  captchaInput: "#captcha", captchaImage: "#secure_captcha", submit: "#btnLogin",
};
export function sessionTtl() {
  const minutes = Number(process.env.SESSION_TTL_MINUTES || 15);
  return (Number.isFinite(minutes) ? Math.min(15, Math.max(10, minutes)) : 15) * 60_000;
}
export function isPortalUrl(value: string) {
  try { return new URL(value).origin === PORTAL_ORIGIN; } catch { return false; }
}

export function frontendOrigin() {
  try {
    const configured = process.env.FRONTEND_ORIGIN?.trim() || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
    const url = new URL(configured);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash || url.hostname.includes("*") ||
        (process.env.NODE_ENV === "production" && url.protocol !== "https:")) throw new Error();
    return url.origin; // Normalize a harmless root trailing slash/default port.
  } catch { throw new PortalError("CONFIGURATION_ERROR", 503); }
}

export function deploymentStatus() {
  let configuration: "ready" | "invalid" = "ready";
  try { frontendOrigin(); } catch { configuration = "invalid"; }
  const revision = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  return { connector: "student-portal-v1", configuration,
    ...(/^[a-f0-9]{40}$/i.test(revision || "") ? { revision } : {}) };
}

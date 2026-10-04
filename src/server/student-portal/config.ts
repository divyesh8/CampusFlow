// Observed on the public Student Portal login page, 2026-10-04.
// These are NOT Academia/Zoho selectors. Never read the portal's CAPTCHA answer.
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

import { createContext } from "./browser";
import { LOGIN_URL, selectors, isPortalUrl } from "./config";
import { PortalError, isPortalError } from "./errors";
import { sessions } from "./session-manager";
import { syncAcademicData } from "./scraper";
import { PortalDiagnostics } from "./diagnostics";

// Classification only: portal text is never returned or logged. Unknown messages
// remain LOGIN_FAILED; a generic mention of "password" is not credential failure.
export function loginRejection(message: string) {
  const rejected = /invalid|incorrect|expired|wrong|does not match|not valid/i;
  const codes = new Set<"INVALID_CAPTCHA" | "INVALID_CREDENTIALS">();
  for (const line of message.split(/[\r\n]+/)) {
    if (!rejected.test(line)) continue;
    const mentionsCaptcha = /captcha/i.test(line);
    const mentionsCredentials = /password|credential|net\s?id|user\s?(?:name|id)/i.test(line);
    if (mentionsCaptcha && mentionsCredentials) return "LOGIN_FAILED" as const;
    if (mentionsCaptcha) codes.add("INVALID_CAPTCHA");
    if (mentionsCredentials) codes.add("INVALID_CREDENTIALS");
  }
  return codes.size === 1 ? [...codes][0] : "LOGIN_FAILED" as const;
}

export async function createChallenge(diagnostics = new PortalDiagnostics()) {
  diagnostics.stage("PORTAL_CHALLENGE_START");
  const id = await sessions.create(() => createContext(diagnostics), diagnostics);
  try {
    return await sessions.run(id, async ({ page }) => {
      const response = await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" })
        .catch(() => { throw new PortalError("PORTAL_UNAVAILABLE"); });
      diagnostics.stage("PORTAL_PAGE_LOADED", response?.status());
      if (!response?.ok() || !isPortalUrl(page.url())) throw new PortalError("PORTAL_UNAVAILABLE");
      await page.locator(selectors.form).waitFor({ state: "visible" })
        .catch(() => { throw new PortalError("PORTAL_CHANGED"); });
      try {
        await page.waitForFunction(selector => {
          const image = document.querySelector<HTMLImageElement>(selector);
          return !!image?.complete && image.naturalWidth > 0;
        }, selectors.captchaImage, { timeout: 15_000 });
        const bytes = await page.locator(selectors.captchaImage).screenshot({ type: "png" });
        diagnostics.stage("PORTAL_CAPTCHA_READY");
        return { sessionId: id, captcha: `data:image/png;base64,${bytes.toString("base64")}` };
      } catch { throw new PortalError("CAPTCHA_LOAD_FAILED"); }
    });
  } catch (error) { await sessions.destroy(id); throw error; }
}

export async function login(input: { sessionId: string; netId: string; password: string; captcha: string }, diagnostics = new PortalDiagnostics()) {
  diagnostics.stage("PORTAL_LOGIN_START");
  try {
    return await sessions.run(input.sessionId, async session => {
      if (session.authenticated) throw new PortalError("LOGIN_FAILED", 409);
      const { page } = session;
      if (!isPortalUrl(page.url()) || !await page.locator(selectors.form).isVisible()) throw new PortalError("SESSION_EXPIRED", 401);
      // Prevent a changed form from sending credentials via GET or to another host.
      const safeForm = await page.locator(selectors.form).evaluate(form => {
        const f = form as HTMLFormElement;
        return f.method.toLowerCase() === "post" && new URL(f.action).origin === location.origin;
      });
      if (!safeForm) throw new PortalError("PORTAL_CHANGED");
      let dialogCode: "INVALID_CAPTCHA" | "INVALID_CREDENTIALS" | "LOGIN_FAILED" = "LOGIN_FAILED";
      let rejectDialog: (error: PortalError) => void = () => {};
      const onDialog = async (dialog: import("playwright").Dialog) => {
        // Classify locally; never log or return the portal's message.
        dialogCode = loginRejection(dialog.message());
        await dialog.dismiss().catch(() => {});
        rejectDialog(new PortalError(dialogCode, 401));
      };
      page.on("dialog", onDialog);
      try {
        await page.locator(selectors.netId).fill(input.netId);
        await page.locator(selectors.password).fill(input.password);
        input.password = "";
        await page.locator(selectors.captchaInput).fill(input.captcha);
        input.captcha = "";
        // The observed official form submits to LoginServlet using its own scripts.
        // No challenge token manipulation, stealth patches, or CAPTCHA solving.
        const responsePromise = page.waitForResponse(r => r.request().method() === "POST" &&
          new URL(r.url()).pathname === "/srmiststudentportal/LoginServlet", { timeout: 30_000 }).then(response => {
            diagnostics.stage("PORTAL_LOGIN_SUBMITTED", response.status());
            if (response.status() >= 400) throw new PortalError("PORTAL_UNAVAILABLE");
            return response;
          });
        // A rejected login may navigate back to the SAME URL. Do not require a
        // different URL, or turn every network timeout into bad credentials.
        const navigationPromise = page.waitForEvent("framenavigated", {
          predicate: frame => frame === page.mainFrame(), timeout: 30_000,
        });
        const dialogFailure = new Promise<never>((_, reject) => { rejectDialog = reject; });
        await Promise.race([Promise.all([responsePromise, navigationPromise, page.locator(selectors.submit).click()]), dialogFailure])
          .catch(error => { throw isPortalError(error) ? error : new PortalError("PORTAL_UNAVAILABLE"); });
        await page.waitForLoadState("domcontentloaded");
        if (!isPortalUrl(page.url())) throw new PortalError("PORTAL_UNAVAILABLE");
        diagnostics.stage("PORTAL_LOGIN_REDIRECT");
        if (await page.locator(selectors.form).isVisible()) {
          const code = loginRejection(await page.locator(selectors.form).innerText());
          throw new PortalError(code === "LOGIN_FAILED" ? dialogCode : code, 401);
        }
        await syncAcademicData(session, diagnostics);
        // The verified adapter must populate both before authentication is granted.
        if (!session.profile || !session.data) throw new PortalError("PORTAL_CHANGED", 501);
        session.authenticated = true;
        diagnostics.stage("PORTAL_AUTHENTICATED");
        return { sessionId: sessions.rotate(input.sessionId), profile: session.profile, lastSyncAt: session.data.lastSync?.completed_at };
      } finally {
        page.off("dialog", onDialog);
        // Best effort clearing if SRM left the form on screen.
        await page.locator(selectors.password).fill("", { timeout: 500 }).catch(() => {});
      }
    });
  } catch (error) {
    if (!(isPortalError(error) && error.code === "SESSION_BUSY")) await sessions.destroy(input.sessionId);
    throw error;
  } finally { input.password = ""; input.captcha = ""; }
}

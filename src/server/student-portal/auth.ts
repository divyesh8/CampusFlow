import { createContext } from "./browser";
import { LOGIN_URL, selectors, isPortalUrl } from "./config";
import { PortalError } from "./errors";
import { sessions } from "./session-manager";
import { syncAcademicData } from "./scraper";

export async function createChallenge() {
  const id = await sessions.create(createContext);
  try {
    return await sessions.run(id, async ({ page }) => {
      const response = await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
      if (!response?.ok() || !isPortalUrl(page.url())) throw new PortalError("PORTAL_UNAVAILABLE");
      await page.locator(selectors.form).waitFor({ state: "visible" });
      await page.waitForFunction(selector => {
        const image = document.querySelector<HTMLImageElement>(selector);
        return !!image?.complete && image.naturalWidth > 0;
      }, selectors.captchaImage, { timeout: 15_000 });
      const bytes = await page.locator(selectors.captchaImage).screenshot({ type: "png" });
      return { sessionId: id, captcha: `data:image/png;base64,${bytes.toString("base64")}` };
    });
  } catch (error) { await sessions.destroy(id); throw error; }
}

export async function login(input: { sessionId: string; netId: string; password: string; captcha: string }) {
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
      const onDialog = async (dialog: import("playwright").Dialog) => {
        // Classify locally; never log or return the portal's message.
        const message = dialog.message();
        dialogCode = /captcha/i.test(message) ? "INVALID_CAPTCHA" : /invalid|incorrect|password|credential/i.test(message) ? "INVALID_CREDENTIALS" : "LOGIN_FAILED";
        await dialog.dismiss().catch(() => {});
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
          new URL(r.url()).pathname === "/srmiststudentportal/LoginServlet", { timeout: 30_000 });
        const navigationPromise = page.waitForURL(url => url.href !== LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
        const [response] = await Promise.all([responsePromise, navigationPromise, page.locator(selectors.submit).click()])
          .catch(() => { throw new PortalError(dialogCode, 401); });
        if (response.status() >= 400) throw new PortalError("PORTAL_UNAVAILABLE");
        await page.waitForLoadState("domcontentloaded");
        if (!isPortalUrl(page.url())) throw new PortalError("PORTAL_UNAVAILABLE");
        if (await page.locator(selectors.form).isVisible()) throw new PortalError(dialogCode, 401);
        await syncAcademicData(session);
        // The verified adapter must populate both before authentication is granted.
        if (!session.profile || !session.data) throw new PortalError("PORTAL_CHANGED", 501);
        session.authenticated = true;
        return { sessionId: sessions.rotate(input.sessionId), profile: session.profile, lastSyncAt: session.data.lastSync?.completed_at };
      } finally {
        page.off("dialog", onDialog);
        // Best effort clearing if SRM left the form on screen.
        await page.locator(selectors.password).fill("", { timeout: 500 }).catch(() => {});
      }
    });
  } catch (error) {
    if (!(error instanceof PortalError && error.code === "SESSION_BUSY")) await sessions.destroy(input.sessionId);
    throw error;
  } finally { input.password = ""; input.captcha = ""; }
}

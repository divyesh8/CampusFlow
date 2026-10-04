import { chromium, type Browser } from "playwright";
import { isPortalUrl } from "./config";
import { PortalError } from "./errors";
import { sessions } from "./session-manager";
import { existsSync } from "node:fs";
import type { PortalDiagnostics } from "./diagnostics";

const state = globalThis as typeof globalThis & { portalBrowser?: Promise<Browser>; portalShutdown?: boolean };
async function browser() {
  if (!state.portalBrowser) {
    if (!existsSync(chromium.executablePath())) throw new PortalError("CONFIGURATION_ERROR", 503);
    state.portalBrowser = chromium.launch({ headless: true, timeout: 30_000 }).then(instance => {
      instance.on("disconnected", () => { state.portalBrowser = undefined; void sessions.close(); });
      return instance;
    }).catch(() => { state.portalBrowser = undefined; throw new PortalError("PORTAL_UNAVAILABLE", 503); });
  }
  return state.portalBrowser;
}
export async function createContext(diagnostics?: PortalDiagnostics) {
  diagnostics?.stage("PORTAL_BROWSER_START");
  const context = await (await browser()).newContext({ acceptDownloads: false, serviceWorkers: "block" });
  try {
    // SRM credentials and authenticated traffic may only reach this official origin.
    // No tracing, HAR, video, console forwarding, storageState, or persistent profile.
    await context.route("**/*", route => isPortalUrl(route.request().url()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    context.on("page", popup => { if (popup !== page) void popup.close(); });
    diagnostics?.stage("PORTAL_BROWSER_READY");
    return { context, page };
  } catch {
    await context.close().catch(() => {});
    throw new PortalError("PORTAL_UNAVAILABLE");
  }
}
if (!state.portalShutdown) {
  state.portalShutdown = true;
  const shutdown = () => { void sessions.close().finally(async () => { await (await state.portalBrowser?.catch(() => undefined))?.close(); }); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

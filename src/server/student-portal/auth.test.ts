import { afterEach, describe, expect, it, vi } from "vitest";
import type { BrowserContext, Page } from "playwright";
import { createChallenge, login } from "./auth";
import { createContext } from "./browser";
import { sessions } from "./session-manager";
import { LOGIN_URL, selectors } from "./config";

vi.mock("./browser", () => ({ createContext: vi.fn() }));
afterEach(async () => { await sessions.close(); vi.clearAllMocks(); });

function fakePortal() {
  let visible = true;
  const fill = vi.fn().mockResolvedValue(undefined);
  const screenshot = vi.fn().mockResolvedValue(Buffer.from("synthetic-image"));
  const locator = vi.fn((selector: string) => ({
    fill, screenshot,
    waitFor: vi.fn().mockResolvedValue(undefined),
    isVisible: async () => visible,
    evaluate: async () => true,
    click: async () => { expect(selector).toBe(selectors.submit); visible = false; },
  }));
  const page = {
    locator, goto: async () => ({ ok: () => true }), url: () => LOGIN_URL,
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    waitForResponse: async () => ({ status: () => 302 }),
    waitForURL: async () => {}, waitForLoadState: async () => {}, on: vi.fn(), off: vi.fn(),
  };
  const close = vi.fn().mockResolvedValue(undefined);
  return { context: { close } as unknown as BrowserContext, page: page as unknown as Page, close, locator, fill, screenshot };
}
describe("Student Portal authentication boundaries (synthetic browser, no real login)", () => {
  it("captures only the CAPTCHA and closes a failed challenge context", async () => {
    const portal = fakePortal();
    vi.mocked(createContext).mockResolvedValue(portal);
    const challenge = await createChallenge();
    expect(challenge.captcha).toMatch(/^data:image\/png;base64,/);
    expect(portal.locator).toHaveBeenCalledWith(selectors.captchaImage);
    expect(portal.screenshot).toHaveBeenCalledOnce();
    await sessions.destroy(challenge.sessionId);
    const failed = fakePortal();
    vi.spyOn(failed.page, "goto").mockRejectedValue(new Error("unavailable"));
    vi.mocked(createContext).mockResolvedValue(failed);
    await expect(createChallenge()).rejects.toThrow("unavailable");
    expect(failed.close).toHaveBeenCalledOnce();
  });
  it("uses the challenge context and fails closed at the unverified academic adapter", async () => {
    const portal = fakePortal();
    const id = await sessions.create(async () => portal);
    const input = { sessionId: id, netId: "test01", password: "synthetic-only", captcha: "dummy" };
    await expect(login(input)).rejects.toMatchObject({ code: "PORTAL_CHANGED", status: 501 });
    expect(portal.fill).toHaveBeenCalledWith("synthetic-only");
    expect(input.password).toBe(""); expect(input.captcha).toBe("");
    expect(portal.close).toHaveBeenCalledOnce();
    expect(sessions.sessions.has(id)).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
  });
  it("does not destroy an in-progress login when a second request arrives", async () => {
    const portal = fakePortal();
    const id = await sessions.create(async () => portal);
    (await sessions.get(id)).busy = true;
    const input = { sessionId: id, netId: "test01", password: "synthetic-only", captcha: "dummy" };
    await expect(login(input)).rejects.toMatchObject({ code: "SESSION_BUSY" });
    expect(portal.close).not.toHaveBeenCalled();
    expect(input.password).toBe("");
  });
});

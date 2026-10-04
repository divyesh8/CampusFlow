import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { BrowserContext, Page } from "playwright";
import { SessionStore } from "./session-manager";
import { maxActiveSessions, sessionTtl } from "./config";

beforeEach(() => { vi.spyOn(console, "info").mockImplementation(() => {}); vi.stubEnv("MAX_ACTIVE_SESSIONS", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

function resources() {
  const close = vi.fn().mockResolvedValue(undefined);
  return { context: { close } as unknown as BrowserContext, page: {} as Page, close };
}
describe("temporary Student Portal sessions", () => {
  it("isolates students and closes only the expired context", async () => {
    let now = 0;
    const store = new SessionStore(100, 8, () => now);
    const a = resources(), b = resources();
    const first = await store.create(async () => a);
    now = 50;
    const second = await store.create(async () => b);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
    now = 100;
    await store.cleanup();
    expect(a.close).toHaveBeenCalledOnce();
    expect(b.close).not.toHaveBeenCalled();
    await expect(store.get(first)).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect((await store.get(second)).context).toBe(b.context);
    await store.close();
    expect(b.close).toHaveBeenCalledOnce();
  });
  it("extends idle expiry on activity and rotates bearer identity", async () => {
    let now = 0;
    const store = new SessionStore(100, 8, () => now);
    const resource = resources();
    const id = await store.create(async () => resource);
    now = 90; await store.get(id);
    now = 110; await store.cleanup();
    expect(resource.close).not.toHaveBeenCalled();
    const rotated = store.rotate(id);
    await expect(store.get(id)).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect((await store.get(rotated)).context).toBe(resource.context);
    now = 211; await store.cleanup();
    expect(resource.close).toHaveBeenCalledOnce();
  });
  it("rejects concurrent operations and releases the lock after errors", async () => {
    const store = new SessionStore();
    const id = await store.create(async () => resources());
    let release!: () => void;
    const barrier = new Promise<void>(resolve => { release = resolve; });
    const first = store.run(id, async () => { await barrier; throw new Error("test"); });
    await Promise.resolve();
    await expect(store.run(id, async () => {})).rejects.toMatchObject({ code: "SESSION_BUSY" });
    release();
    await expect(first).rejects.toThrow("test");
    await expect(store.run(id, async () => 1)).resolves.toBe(1);
    await store.close();
  });
  it("reserves capacity during concurrent context creation", async () => {
    const store = new SessionStore(100, 1);
    let release!: (value: ReturnType<typeof resources>) => void;
    const first = store.create(() => new Promise(resolve => { release = resolve; }));
    await Promise.resolve();
    await expect(store.create(async () => resources())).rejects.toMatchObject({ code: "SERVER_BUSY" });
    release(resources()); await first;
    await store.close();
  });
  it("defaults to two sessions and ten minutes, releasing slots on failure and logout", async () => {
    vi.stubEnv("SESSION_TTL_MINUTES", "");
    expect(sessionTtl()).toBe(600_000);
    expect(maxActiveSessions()).toBe(2);
    const store = new SessionStore();
    await expect(store.create(async () => { throw new Error("failed factory"); })).rejects.toThrow();
    const first = await store.create(async () => resources());
    await store.create(async () => resources());
    const factory = vi.fn(async () => resources());
    await expect(store.create(factory)).rejects.toMatchObject({ code: "SERVER_BUSY", status: 503 });
    expect(factory).not.toHaveBeenCalled();
    await store.destroy(first);
    await store.create(factory);
    expect(factory).toHaveBeenCalledOnce();
    await store.close();
  });
  it("honors MAX_ACTIVE_SESSIONS and safely rejects invalid settings", async () => {
    vi.stubEnv("MAX_ACTIVE_SESSIONS", "1");
    const store = new SessionStore();
    await store.create(async () => resources());
    await expect(store.create(async () => resources())).rejects.toMatchObject({ code: "SERVER_BUSY" });
    await store.close();
    for (const value of ["0", "-1", "NaN", "Infinity", "2.5", "999"]) {
      vi.stubEnv("MAX_ACTIVE_SESSIONS", value);
      await expect(store.create(async () => resources())).rejects.toMatchObject({ code: "CONFIGURATION_ERROR" });
    }
  });
  it("treats a cookie from before a restart as expired", async () => {
    const before = new SessionStore();
    const id = await before.create(async () => resources());
    await before.close();
    const after = new SessionStore();
    await expect(after.get(id)).rejects.toMatchObject({ code: "SESSION_EXPIRED", status: 401 });
  });
});

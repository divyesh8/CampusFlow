import { describe, it, expect, vi } from "vitest";
import type { BrowserContext, Page } from "playwright";
import { SessionStore } from "./session-manager";

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
    await expect(store.create(async () => resources())).rejects.toMatchObject({ code: "CAPACITY_REACHED" });
    release(resources()); await first;
    await store.close();
  });
});

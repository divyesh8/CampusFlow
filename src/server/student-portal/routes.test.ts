import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/srm/login/route";
import { POST as challenge } from "@/app/api/srm/session/route";
import { login, createChallenge } from "./auth";
import { PortalError } from "./errors";
const cookie = vi.hoisted(() => ({ value: "a".repeat(64) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: cookie.value }), set: vi.fn(), delete: vi.fn() }) }));
vi.mock("./auth", () => ({ login: vi.fn(), createChallenge: vi.fn() }));
const request = (body: unknown, origin = "https://example.test") => new Request("https://example.test/api/srm/login", {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const valid = () => ({ sessionId: "a".repeat(64), netId: "test01", password: "synthetic-only", captcha: "dummy" });
beforeEach(() => {
  cookie.value = "a".repeat(64);
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FRONTEND_ORIGIN", "https://example.test");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.mocked(login).mockRejectedValue(new PortalError("SESSION_EXPIRED", 401));
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); vi.restoreAllMocks(); });
describe("current login routes", () => {
  it("fails configuration before launching a browser", async () => {
    vi.stubEnv("FRONTEND_ORIGIN", "");
    const r = await challenge(request({}));
    expect(r.status).toBe(503); expect((await r.json()).code).toBe("CONFIGURATION_ERROR");
    expect(createChallenge).not.toHaveBeenCalled();
  });
  it("rejects mismatched body/cookie session IDs before login", async () => {
    const r = await POST(request({ ...valid(), sessionId: "b".repeat(64) }));
    expect(r.status).toBe(401); expect((await r.json()).code).toBe("SESSION_EXPIRED");
    expect(login).not.toHaveBeenCalled();
  });
  it("rejects a missing cookie before submitting credentials", async () => {
    cookie.value = "";
    const r = await POST(request(valid()));
    expect(r.status).toBe(401); expect((await r.json()).code).toBe("SESSION_EXPIRED");
    expect(login).not.toHaveBeenCalled();
  });
  it("rejects malformed input and foreign origins", async () => {
    expect((await POST(request({ password: "synthetic-only" }))).status).toBe(400);
    expect((await POST(request(valid(), "https://other.test"))).status).toBe(403);
    expect(login).not.toHaveBeenCalled();
  });
  it("preserves expiry and safe correlation without leaking private fields", async () => {
    const r = await POST(request(valid())); const body = await r.json();
    expect(r.status).toBe(401); expect(body.code).toBe("SESSION_EXPIRED");
    expect(r.headers.get("x-request-id")).toBe(body.requestId);
    const logs = vi.mocked(console.info).mock.calls.map(([record]) => JSON.parse(record));
    for (const record of logs) expect(Object.keys(record).every(k => ["stage", "requestId", "duration", "httpStatus", "errorCode"].includes(k))).toBe(true);
    expect(JSON.stringify({ body, logs })).not.toMatch(/synthetic-only|dummy|test01|aaaaaaaa/);
    expect(vi.mocked(login).mock.calls[0][0].password).toBe("");
  });
  it("applies the account limit before further authentication attempts", async () => {
    for (let i = 0; i < 6; i++) await POST(request({ ...valid(), netId: "limit1" }));
    const r = await POST(request({ ...valid(), netId: "limit1" }));
    expect(r.status).toBe(429); expect((await r.json()).code).toBe("RATE_LIMITED");
    expect(login).toHaveBeenCalledTimes(6);
  });
});

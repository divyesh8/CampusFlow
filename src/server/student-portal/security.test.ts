import { describe, expect, it, vi, afterEach } from "vitest";
import { checkOrigin, failure, loginSchema, rateLimit, readJson } from "./security";
import { frontendOrigin, deploymentStatus } from "./config";

afterEach(() => vi.unstubAllEnvs());
describe("Student Portal request security", () => {
  it.each([undefined, "", "not a URL", "http://example.test", "https://user:pass@example.test", "https://example.test/login", "https://example.test?secret=x", "https://example.test#x", "https://*.example.test", "*"])("rejects missing or malformed production origins safely: %s", async value => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FRONTEND_ORIGIN", value);
    let error: unknown;
    try { frontendOrigin(); } catch (caught) { error = caught; }
    const response = failure(error);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "CONFIGURATION_ERROR", error: "CampusFlow's connection service is not configured." });
    expect(deploymentStatus().configuration).toBe("invalid");
  });
  it("accepts production HTTPS origin with harmless trailing slash and ignores legacy env", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FRONTEND_ORIGIN", " https://example.test/ ");
    vi.stubEnv("SRM_SESSION_KEY", ""); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(frontendOrigin()).toBe("https://example.test");
    expect(deploymentStatus().configuration).toBe("ready");
  });
  it("requires the exact configured origin and HTTPS configuration in production", () => {
    vi.stubEnv("FRONTEND_ORIGIN", "https://campus.example");
    expect(() => checkOrigin(new Request("https://campus.example/api", { headers: { origin: "https://evil.example" } }))).toThrow();
    expect(() => checkOrigin(new Request("https://campus.example/api", { headers: { origin: "https://campus.example" } }))).not.toThrow();
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FRONTEND_ORIGIN", "http://campus.example");
    expect(() => checkOrigin(new Request("https://campus.example"))).toThrow();
  });
  it("rejects malformed, extra and oversized fields without echoing secrets", async () => {
    const request = (body: string) => new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    await expect(readJson(request("{bad"), loginSchema)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    await expect(readJson(request(JSON.stringify({ password: "private-value", extra: true })), loginSchema)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    await expect(readJson(request("x".repeat(4097)), loginSchema)).rejects.toMatchObject({ status: 413 });
    const body = await failure(new Error("private-value")).text();
    expect(body).not.toContain("private-value");
    expect(body).not.toContain("stack");
  });
  it("limits attempts and resets expired buckets", () => {
    rateLimit("test-bucket", 1, 1);
    expect(() => rateLimit("test-bucket", 1, 2)).toThrow();
    expect(() => rateLimit("test-bucket", 1, 300_002)).not.toThrow();
  });
  it("preserves safe error identity across Next route bundles", async () => {
    const otherBundleError = { [Symbol.for("campusflow.student-portal.error")]: true,
      code: "SESSION_EXPIRED", status: 401, message: "never echo this message" };
    const response = failure(otherBundleError);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "SESSION_EXPIRED", error: "Your SRM session expired. Connect again." });
    expect(failure({ code: "SESSION_EXPIRED", status: 401 }).status).toBe(502);
  });
});

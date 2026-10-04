import { describe, expect, it, vi, afterEach } from "vitest";
import { checkOrigin, failure, loginSchema, rateLimit, readJson } from "./security";

afterEach(() => vi.unstubAllEnvs());
describe("Student Portal request security", () => {
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
});

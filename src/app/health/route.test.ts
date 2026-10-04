import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("playwright", () => { throw new Error("Health must not import a browser"); });
vi.mock("@/server/student-portal/config", () => { throw new Error("Health must not import connector config"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("returns cheap liveness even without valid connector configuration", async () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FRONTEND_ORIGIN", "");
  vi.stubEnv("MAX_ACTIVE_SESSIONS", "invalid");
  const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No external requests"));
  const response = GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ok", service: "campusflow" });
  expect(fetch).not.toHaveBeenCalled();
});

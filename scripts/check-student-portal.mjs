// Public-page smoke test only. Never supplies, solves, or logs credentials/CAPTCHA.
const base = process.env.CAMPUSFLOW_TEST_ORIGIN || "http://localhost:3000";
const headers = { Origin: base };
let cookie;
function check(condition, name) {
  if (!condition) throw new Error(name);
  console.log(`PASS ${name}`);
}
try {
  check((await fetch(`${base}/health`)).status === 200, "health");
  check((await fetch(`${base}/api/srm/session`, { method: "POST", headers: { Origin: "https://invalid.example" } })).status === 403, "foreign origin rejected");
  check((await fetch(`${base}/api/srm/login`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}" })).status === 400, "invalid payload rejected");
  const response = await fetch(`${base}/api/srm/session`, { method: "POST", headers, signal: AbortSignal.timeout(60_000) });
  const challenge = await response.json();
  const setCookie = response.headers.get("set-cookie");
  cookie = setCookie?.split(";")[0];
  check(response.ok, "real CAPTCHA session created");
  check(typeof challenge.captcha === "string" && challenge.captcha.startsWith("data:image/png;base64,"), "CAPTCHA image returned");
  check(Buffer.from(challenge.captcha.split(",")[1], "base64").length > 100, "CAPTCHA is nonempty");
  check(setCookie?.includes("HttpOnly") && setCookie.includes("SameSite=strict"), "protected session cookie");
  check(response.headers.get("cache-control")?.includes("no-store"), "private responses not cached");
  const pending = await fetch(`${base}/api/srm/session`, { headers: { Cookie: cookie } });
  check(pending.status === 401, "pending session is not authenticated");
  check((await fetch(`${base}/api/srm/data`, { headers: { Cookie: cookie } })).status === 401, "academic data requires authentication");
  check((await fetch(`${base}/api/srm/session`, { method: "DELETE", headers: { ...headers, Cookie: cookie } })).ok, "disconnect");
  check((await fetch(`${base}/api/srm/session`, { headers: { Cookie: cookie } })).status === 401, "deleted session rejected");
} catch (error) {
  // Only fixed check names or a generic network failure, never a raw response.
  console.error("Student Portal smoke check failed. Check the local server and portal availability.");
  void error;
  process.exitCode = 1;
} finally {
  if (cookie) await fetch(`${base}/api/srm/session`, { method: "DELETE", headers: { ...headers, Cookie: cookie } }).catch(() => {});
}

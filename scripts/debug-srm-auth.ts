/**
 * SRM Authentication Diagnostic Script
 *
 * LOCAL DEVELOPMENT ONLY
 *
 * Usage:
 *   SRM_TEST_NETID=your_netid SRM_TEST_PASSWORD=your_password npx tsx scripts/debug-srm-auth.ts
 *
 * This script tests the SRM authentication flow and reports safe diagnostic information.
 * It does NOT log passwords, session cookies, or personal data.
 */

import { SRMLoginService } from "../src/server/srm/login-service";
import { AcademiaClient } from "../src/server/srm/academia-client";
import { SRM_CONFIG } from "../src/server/srm/academia-config";
import { decodeAcademiaPage } from "../src/server/srm/decode-academia-page";
import { parseStudentProfile } from "../src/server/srm/parsers/profile-parser";

const NETID = process.env.SRM_TEST_NETID;
const PASSWORD = process.env.SRM_TEST_PASSWORD;

function pad(label: string, width = 30): string {
  return label.padEnd(width, ".");
}

async function main() {
  console.log("=== SRM Authentication Diagnostic ===\n");

  if (!NETID || !PASSWORD) {
    console.error(
      "Error: SRM_TEST_NETID and SRM_TEST_PASSWORD environment variables required."
    );
    console.error("\nUsage:");
    console.error(
      "  SRM_TEST_NETID=your_netid SRM_TEST_PASSWORD=your_password npx tsx scripts/debug-srm-auth.ts"
    );
    process.exit(1);
  }

  console.log(`NetID: ${NETID.replace(/(.{2}).*/, "$1***")}`);
  console.log(`Password: ***`);
  console.log("");

  const overallStart = Date.now();

  // Step 1: Login
  console.log("--- Authentication ---");
  const loginStart = Date.now();
  const loginService = new SRMLoginService();

  let loginResult;
  try {
    loginResult = await loginService.login(NETID, PASSWORD);
  } catch (err) {
    console.log(`${pad("SIGNIN POST")} ERROR — ${err instanceof Error ? err.message : "unknown"}`);
    console.log("\n=== Diagnostic Complete ===");
    return;
  }
  const loginDuration = Date.now() - loginStart;

  console.log(`${pad("SIGNIN POST")} ${loginResult.success ? "200" : loginResult.status || "ERR"} — ${loginDuration}ms`);
  console.log(`${pad("Response type")} JSON`);

  if (loginResult.requiresCaptcha) {
    console.log(`${pad("CAPTCHA required")} yes`);
    console.log(`${pad("CAPTCHA digest present")} ${!!loginResult.captchaDigest}`);
    console.log(`\nAuthentication: CAPTCHA_REQUIRED`);
    console.log("=== Diagnostic Complete ===");
    return;
  }

  if (!loginResult.success) {
    console.log(`${pad("CAPTCHA required")} no`);
    console.log(`${pad("Error")} ${loginResult.error}`);
    console.log(`\nAuthentication: FAILED`);
    console.log("=== Diagnostic Complete ===");
    return;
  }

  console.log(`${pad("CAPTCHA required")} no`);

  const cookieNames = Object.keys(loginResult.cookies);
  console.log(`${pad("Cookies established")} ${cookieNames.length} (${cookieNames.join(", ")})`);

  // Print stage logs
  const stageLogs = loginService.getStageLogs();
  if (stageLogs.length > 0) {
    console.log("\n--- Stage Timing ---");
    for (const log of stageLogs) {
      const parts = [pad(log.stage, 35), `${log.duration}ms`];
      if (log.httpStatus) parts.push(`HTTP ${log.httpStatus}`);
      if (log.error) parts.push(`ERR: ${log.error}`);
      console.log(parts.join(" | "));
    }
  }

  // Step 2: Profile page fetch
  console.log("\n--- Profile Fetch ---");
  const profileStart = Date.now();
  const client = new AcademiaClient();
  client.setCookies(loginResult.cookies);

  let profileResponse;
  try {
    profileResponse = await client.get(SRM_CONFIG.coursePage, {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });
  } catch (err) {
    console.log(`${pad("Profile fetch")} ERROR — ${err instanceof Error ? err.message : "unknown"}`);
    console.log("\n=== Diagnostic Complete ===");
    return;
  }
  const profileDuration = Date.now() - profileStart;

  console.log(`${pad("Profile fetch")} ${profileResponse.status} — ${profileDuration}ms`);
  console.log(`${pad("Response size")} ${profileResponse.text.length} bytes`);

  if (profileResponse.status !== 200) {
    console.log(`\nProfile: FAILED (HTTP ${profileResponse.status})`);
    console.log("=== Diagnostic Complete ===");
    return;
  }

  // Step 3: Decode page
  console.log("\n--- Page Decode ---");
  const decodeStart = Date.now();
  const decoded = decodeAcademiaPage(profileResponse.text);
  const decodeDuration = Date.now() - decodeStart;

  console.log(`${pad("Sanitize payload")} ${decoded.decoded ? "found" : "not found"}`);
  console.log(`${pad("Decode time")} ${decodeDuration}ms`);

  if (decoded.error) {
    console.log(`${pad("Decode error")} ${decoded.error}`);
    console.log(`\nProfile: FAILED (${decoded.error})`);
    console.log("=== Diagnostic Complete ===");
    return;
  }

  console.log(`${pad("Decoded HTML")} ${decoded.html.length} bytes`);

  // Step 4: Parse profile
  console.log("\n--- Profile Parse ---");
  const parseStart = Date.now();
  const profile = parseStudentProfile(decoded.html);
  const parseDuration = Date.now() - parseStart;

  console.log(`${pad("Parse time")} ${parseDuration}ms`);
  console.log(`${pad("Name found")} ${!!profile.name} ${profile.name ? "(yes)" : "(no)"}`);
  console.log(`${pad("Register parsed")} ${!!profile.regNumber} ${profile.regNumber ? "(yes)" : "(no)"}`);
  console.log(`${pad("Program found")} ${!!profile.program}`);
  console.log(`${pad("Department found")} ${!!profile.department}`);
  console.log(`${pad("Semester found")} ${profile.semester > 0} (${profile.semester})`);
  console.log(`${pad("Section found")} ${!!profile.section}`);

  const hasIdentity = profile.name || profile.regNumber;
  console.log(`\nProfile parse: ${hasIdentity ? "SUCCESS" : "FAILED"}`);

  // Step 5: Attendance page (optional)
  console.log("\n--- Attendance Page ---");
  const attendanceStart = Date.now();
  let attendanceResponse;
  try {
    attendanceResponse = await client.get(SRM_CONFIG.attendancePage, {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });
  } catch (err) {
    console.log(`${pad("Attendance fetch")} ERROR — ${err instanceof Error ? err.message : "unknown"}`);
    console.log("\n=== Diagnostic Complete ===");
    return;
  }
  const attendanceDuration = Date.now() - attendanceStart;

  console.log(`${pad("Attendance fetch")} ${attendanceResponse.status} — ${attendanceDuration}ms`);
  console.log(`${pad("Response size")} ${attendanceResponse.text.length} bytes`);

  // Summary
  const overallDuration = Date.now() - overallStart;
  console.log("\n--- Summary ---");
  console.log(`${pad("Total time")} ${overallDuration}ms`);
  console.log(`\nAuthentication: ${loginResult.success ? "SUCCESS" : "FAILED"}`);
  if (loginResult.success) {
    console.log(`Profile: ${hasIdentity ? "SUCCESS" : "FAILED"}`);
  }

  console.log("\n=== Diagnostic Complete ===");
}

main().catch(console.error);

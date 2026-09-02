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
import { parseStudentProfile } from "../src/server/srm/parsers/profile-parser";

const NETID = process.env.SRM_TEST_NETID;
const PASSWORD = process.env.SRM_TEST_PASSWORD;

async function main() {
  console.log("=== SRM Authentication Diagnostic ===\n");

  if (!NETID || !PASSWORD) {
    console.error("Error: SRM_TEST_NETID and SRM_TEST_PASSWORD environment variables required.");
    console.error("\nUsage:");
    console.error("  SRM_TEST_NETID=your_netid SRM_TEST_PASSWORD=your_password npx tsx scripts/debug-srm-auth.ts");
    process.exit(1);
  }

  console.log(`NetID: ${NETID.replace(/(.{2}).*/, "$1***")}`);
  console.log(`Password: ***`);
  console.log("");

  // Step 1: Test login endpoint
  console.log("Step 1: Testing SRM login endpoint...");
  const loginService = new SRMLoginService();

  try {
    const loginResult = await loginService.login(NETID, PASSWORD);

    if (loginResult.success) {
      console.log("  Status: SUCCESS");
      console.log(`  JSESSIONID present: ${!!loginResult.cookies.JSESSIONID}`);
      console.log(`  Total cookies: ${Object.keys(loginResult.cookies).length}`);
    } else if (loginResult.requiresCaptcha) {
      console.log("  Status: CAPTCHA_REQUIRED");
      console.log(`  CAPTCHA digest present: ${!!loginResult.captchaDigest}`);
      console.log(`  CAPTCHA image URL present: ${!!loginResult.captchaImage}`);
    } else {
      console.log("  Status: FAILED");
      console.log(`  Error: ${loginResult.error}`);
      console.log(`  HTTP Status: ${loginResult.status}`);
    }
    console.log("");

    if (!loginResult.success) {
      console.log("=== Diagnostic Complete ===");
      return;
    }

    // Step 2: Test profile page fetch
    console.log("Step 2: Fetching student profile page...");
    const client = new AcademiaClient();
    client.setCookies(loginResult.cookies);

    const profileResponse = await client.get(SRM_CONFIG.coursePage, {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log(`  HTTP Status: ${profileResponse.status}`);
    console.log(`  Response length: ${profileResponse.text.length} bytes`);

    if (profileResponse.status === 200) {
      // Step 3: Parse profile
      console.log("\nStep 3: Parsing student profile...");
      const profile = parseStudentProfile(profileResponse.text);

      console.log(`  Name found: ${!!profile.name} ${profile.name ? `(${profile.name})` : ""}`);
      console.log(`  Register number found: ${!!profile.regNumber} ${profile.regNumber ? `(${profile.regNumber})` : ""}`);
      console.log(`  Program found: ${!!profile.program}`);
      console.log(`  Department found: ${!!profile.department}`);
      console.log(`  Semester found: ${profile.semester > 0} (${profile.semester})`);
      console.log(`  Section found: ${!!profile.section}`);

      const hasIdentity = profile.name || profile.regNumber;
      console.log(`\n  Profile parse: ${hasIdentity ? "SUCCESS" : "FAILED"}`);
    } else {
      console.log("  Could not fetch profile page");
    }

    // Step 4: Test attendance page
    console.log("\nStep 4: Fetching attendance page...");
    const attendanceResponse = await client.get(SRM_CONFIG.attendancePage, {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log(`  HTTP Status: ${attendanceResponse.status}`);
    console.log(`  Response length: ${attendanceResponse.text.length} bytes`);

  } catch (error) {
    console.error("\nError during diagnostic:", error);
  }

  console.log("\n=== Diagnostic Complete ===");
}

main().catch(console.error);

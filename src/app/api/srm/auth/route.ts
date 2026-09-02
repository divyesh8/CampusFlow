import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/server/srm/session-manager";
import { authenticateWithSRM } from "@/server/srm/academia-service";
import { createChallenge } from "@/server/srm/captcha-store";
import type { StudentProfile } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const AuthSchema = z.object({
  netId: z.string().min(1, "NetID is required"),
  password: z.string().min(1, "Password is required"),
  captchaDigest: z.string().optional(),
  captchaAnswer: z.string().optional(),
  existingCookies: z.record(z.string(), z.string()).optional(),
});

function createStudentProfile(
  netId: string,
  srmProfile: {
    name: string;
    regNumber: string;
    program: string;
    department: string;
    semester: number;
    section: string;
    batch: string;
    mobile: string;
  } | null
): StudentProfile {
  const email = `${netId}@srmist.edu.in`;

  return {
    id: `cf-${netId}`,
    userId: `user-${netId}`,
    universityId: "srm",
    campusId: "srm-main",
    studentId: netId,
    netId,
    name: srmProfile?.name || "",
    email,
    program: srmProfile?.program || "",
    department: srmProfile?.department || "",
    year: 0,
    semester: srmProfile?.semester || 0,
    section: srmProfile?.section || "",
    attendanceThreshold: 75,
    onboarded: !!(srmProfile?.name && srmProfile?.regNumber),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "NetID and password are required." },
        { status: 400 }
      );
    }

    const { netId, password, captchaDigest, captchaAnswer, existingCookies } =
      parsed.data;

    console.log(
      `[SRM Auth] Attempting authentication for: ${netId.replace(/(.{2}).*/, "$1***")}`
    );

    const result = await authenticateWithSRM(
      netId,
      password,
      existingCookies as Record<string, string> | undefined,
      captchaDigest,
      captchaAnswer
    );

    if (result.stageLogs) {
      for (const log of result.stageLogs) {
        const parts = [log.stage, `${log.duration}ms`];
        if (log.httpStatus) parts.push(`HTTP ${log.httpStatus}`);
        if (log.error) parts.push(`ERR: ${log.error}`);
        if (log.cookieNames?.length)
          parts.push(`cookies: ${log.cookieNames.length}`);
        console.log(`[SRM Auth Stage] ${parts.join(" | ")}`);
      }
    }

    if (!result.success) {
      if (result.requiresCaptcha) {
        const challenge = createChallenge(
          netId,
          password,
          {} as Record<string, string>,
          result.captchaDigest || "",
          result.captchaImage || ""
        );

        const captchaProxyUrl = `/api/srm/auth/captcha/${challenge.challengeId}`;

        return NextResponse.json(
          {
            status: "verification_required",
            error: result.error,
            challengeType: "captcha",
            challengeId: challenge.challengeId,
            captchaImage: captchaProxyUrl,
            captchaDigest: result.captchaDigest,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    console.log(
      `[SRM Auth] Authentication successful for: ${netId.replace(/(.{2}).*/, "$1***")}`
    );
    console.log(`[SRM Auth] Profile name: ${result.profile.name ? "found" : "missing"}`);

    const studentProfile = createStudentProfile(netId, result.profile);

    await createSession(studentProfile, result.cookies);

    return NextResponse.json({
      success: true,
      profile: studentProfile,
    });
  } catch (error) {
    console.error("[SRM Auth] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

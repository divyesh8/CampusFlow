import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChallenge, deleteChallenge } from "@/server/srm/captcha-store";
import { authenticateWithSRM } from "@/server/srm/academia-service";
import { createSession } from "@/server/srm/session-manager";
import type { StudentProfile } from "@/types";

export const runtime = "nodejs";

const VerifySchema = z.object({
  challengeId: z.string().min(1),
  captchaAnswer: z.string().min(1),
  password: z.string().min(1),
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
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "challengeId, captchaAnswer, and password are required." },
        { status: 400 }
      );
    }

    const { challengeId, captchaAnswer, password } = parsed.data;

    const challenge = getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge expired or not found. Please try again." },
        { status: 404 }
      );
    }

    const netId = challenge.netId;
    const srmCookies = challenge.srmCookies;
    const captchaDigest = challenge.captchaDigest;

    deleteChallenge(challengeId);

    const result = await authenticateWithSRM(
      netId,
      password,
      srmCookies,
      captchaDigest,
      captchaAnswer
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const studentProfile = createStudentProfile(netId, result.profile);
    await createSession(studentProfile, result.cookies);

    console.log(`[SRM Auth Verify] Authentication successful for ${netId}`);

    return NextResponse.json({
      success: true,
      profile: studentProfile,
    });
  } catch (error) {
    console.error("[SRM Auth Verify] Error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

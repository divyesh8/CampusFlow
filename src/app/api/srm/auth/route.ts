import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/server/srm/session-manager";
import { authenticateWithSRM } from "@/server/srm/academia-service";
import type { StudentProfile } from "@/types";

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

    console.log("[SRM Auth] Attempting authentication for:", netId);

    const result = await authenticateWithSRM(
      netId,
      password,
      existingCookies as Record<string, string> | undefined,
      captchaDigest,
      captchaAnswer
    );

    if (!result.success) {
      console.log("[SRM Auth] Authentication failed:", result.error);

      if (result.requiresCaptcha) {
        return NextResponse.json(
          {
            status: "verification_required",
            error: result.error,
            challengeType: "captcha",
            captchaImage: result.captchaImage,
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

    console.log("[SRM Auth] Authentication successful for:", netId);
    console.log("[SRM Auth] Profile name:", result.profile.name);

    const studentProfile = createStudentProfile(netId, result.profile);

    const sessionId = await createSession(studentProfile, result.cookies);

    console.log("[SRM Auth] Session created:", sessionId);

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

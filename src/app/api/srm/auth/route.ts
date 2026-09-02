import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, type SessionData } from "@/server/srm/session-manager";

const AuthSchema = z.object({
  netId: z.string().min(1, "NetID is required"),
  password: z.string().min(1, "Password is required"),
});

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

    // SRM authentication will be implemented here.
    // For now, validate that credentials are non-empty and create a session
    // that represents a "pending verification" state.
    //
    // When real SRM integration is built:
    // 1. POST to SRM Academia login endpoint with credentials
    // 2. Handle CAPTCHA/MFA challenges
    // 3. On success, fetch student profile from SRM
    // 4. Normalize and store the profile
    // 5. Create session with real student data

    const { netId } = parsed.data;
    const email = `${netId}@srmist.edu.in`;

    // Placeholder: In production, this would be the real SRM profile
    // fetched after successful authentication.
    const studentProfile = {
      id: `cf-${netId}`,
      userId: `user-${netId}`,
      universityId: "srm",
      campusId: "srm-main",
      studentId: netId,
      name: "", // Will be filled from SRM after real auth
      email,
      program: "",
      department: "",
      year: 0,
      semester: 0,
      attendanceThreshold: 75,
      onboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessionData: SessionData = {
      userId: `user-${netId}`,
      netId,
      email,
      studentProfile,
      createdAt: new Date().toISOString(),
    };

    await createSession(sessionData);

    return NextResponse.json({
      success: true,
      requiresVerification: false,
      message: "Authentication successful. SRM integration pending.",
      profile: studentProfile,
    });
  } catch (error) {
    console.error("[SRM Auth]", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

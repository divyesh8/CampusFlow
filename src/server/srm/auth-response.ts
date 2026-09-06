import "server-only";
import { NextResponse } from "next/server";
import { createChallenge } from "./captcha-store";
import { createSession } from "./session-manager";
import { ensureStudentProfile } from "./profile-service";
import { authenticateWithSRM } from "./academia-service";
import { routeError } from "./request-security";

export async function authResponse(netId: string, result: Awaited<ReturnType<typeof authenticateWithSRM>>, requestId: string) {
  if (!result.success) {
    if (result.requiresCaptcha && result.captchaDigest && result.captchaImage) {
      const challenge = await createChallenge(netId, result.cookies, result.captchaDigest, result.captchaImage);
      return NextResponse.json({ status: "verification_required", code: result.error,
        error: result.error === "SRM_CAPTCHA_FAILED" ? "Incorrect CAPTCHA. Try the new image." : "SRM requires verification.",
        challengeId: challenge.challengeId, captchaImage: `/api/srm/auth/captcha/${challenge.challengeId}`,
        captchaDigest: result.captchaDigest,
        requestId }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return routeError(result.error, requestId);
  }
  const profile = await ensureStudentProfile(netId, result.profile);
  await createSession(profile, result.cookies);
  return NextResponse.json({ success: true, profile, profileSynced: true, requestId },
    { headers: { "Cache-Control": "no-store" } });
}


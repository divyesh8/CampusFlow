import { NextResponse } from "next/server";
import { getChallenge, updateChallengeCookies } from "@/server/srm/captcha-store";
import { AcademiaClient } from "@/server/srm/academia-client";
import { rateLimit, routeError, RequestError } from "@/server/srm/request-security";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ challengeId: string }> }) {
  try {
    const { challengeId } = await params;
    const challenge = await getChallenge(challengeId);
    if (!challenge) throw new RequestError(404, "CHALLENGE_EXPIRED", "Verification expired. Please reconnect.");
    await rateLimit(`captcha-image:${challengeId}`, 10);
    const client = new AcademiaClient();
    client.setCookies(challenge.srmCookies);
    const response = await client.get(challenge.captchaImage);
    const type = response.headers.get("content-type")?.split(";")[0];
    if (response.status !== 200 || !type || !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(type)) {
      throw new Error("SRM_SERVER_REJECTED");
    }
    await updateChallengeCookies(challengeId, client.getCookies());
    return new NextResponse(new Uint8Array(response.bytes), { headers: {
      "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return routeError(error); }
}


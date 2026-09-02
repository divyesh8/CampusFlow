import { NextRequest, NextResponse } from "next/server";
import { getChallenge } from "@/server/srm/captcha-store";
import { SRM_CONFIG } from "@/server/srm/academia-config";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;

  const challenge = getChallenge(challengeId);
  if (!challenge) {
    return NextResponse.json(
      { error: "Challenge expired or not found" },
      { status: 404 }
    );
  }

  try {
    const cookieHeader = Object.entries(challenge.srmCookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(challenge.captchaImage, {
      method: "GET",
      headers: {
        ...SRM_CONFIG.browserHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    if (response.status !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch CAPTCHA image" },
        { status: 502 }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "image/png";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch CAPTCHA" },
      { status: 500 }
    );
  }
}

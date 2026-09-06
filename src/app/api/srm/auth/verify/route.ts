import { z } from "zod";
import { randomUUID } from "crypto";
import { getChallenge } from "@/server/srm/captcha-store";
import { authenticateWithSRM } from "@/server/srm/academia-service";
import { authResponse } from "@/server/srm/auth-response";
import { guardAuth, readJson, passwordSchema, rateLimit, routeError, RequestError } from "@/server/srm/request-security";
export const runtime = "nodejs";
export const maxDuration = 60;
const schema = z.object({ challengeId: z.string().regex(/^[a-f0-9]{32}$/),
  captchaAnswer: z.string().trim().regex(/^[a-zA-Z0-9]{1,16}$/), password: passwordSchema }).strict();
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    await guardAuth(request);
    const input = await readJson(request, schema);
    const challenge = await getChallenge(input.challengeId, true);
    if (!challenge) throw new RequestError(410, "CHALLENGE_EXPIRED", "Verification expired. Please reconnect.");
    await rateLimit(`auth-account:${challenge.netId}`);
    const result = await authenticateWithSRM(challenge.netId, input.password, challenge.srmCookies,
      challenge.captchaDigest, input.captchaAnswer, requestId);
    return await authResponse(challenge.netId, result, requestId);
  } catch (error) { return routeError(error, requestId); }
}


import { z } from "zod";
import { randomUUID } from "crypto";
import { authenticateWithSRM } from "@/server/srm/academia-service";
import { authResponse } from "@/server/srm/auth-response";
import { guardAuth, readJson, netIdSchema, passwordSchema, rateLimit, routeError } from "@/server/srm/request-security";
export const runtime = "nodejs";
export const maxDuration = 60;
const schema = z.object({ netId: netIdSchema, password: passwordSchema }).strict();
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    await guardAuth(request);
    const { netId, password } = await readJson(request, schema);
    await rateLimit(`auth-account:${netId}`);
    const result = await authenticateWithSRM(netId, password, undefined, undefined, undefined, requestId);
    return await authResponse(netId, result, requestId);
  } catch (error) { return routeError(error, requestId); }
}


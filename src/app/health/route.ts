import { deploymentStatus } from "@/server/student-portal/config";
export const dynamic = "force-dynamic";
export function GET() {
  // Liveness stays 200 so a bad origin does not create a Railway restart loop.
  // This is configuration visibility, not proof of portal/browser readiness.
  return Response.json({ status: "ok", ...deploymentStatus() }, { headers: { "Cache-Control": "no-store" } });
}

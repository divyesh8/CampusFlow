export const dynamic = "force-dynamic";
export function GET() {
  // Liveness only: no environment, browser, portal, or database dependencies.
  return Response.json({ status: "ok", service: "campusflow" }, { headers: { "Cache-Control": "no-store" } });
}

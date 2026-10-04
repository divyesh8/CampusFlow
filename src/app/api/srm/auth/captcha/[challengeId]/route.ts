export function GET() { return Response.json({ error: "Endpoint retired" }, { status: 410, headers: { "Cache-Control": "no-store" } }); }

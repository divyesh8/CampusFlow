// Retired Academia routes must not accept credentials or create database sessions.
export function POST() { return Response.json({ code: "ENDPOINT_RETIRED", error: "Reload CampusFlow and load a new Student Portal CAPTCHA." }, { status: 410, headers: { "Cache-Control": "no-store" } }); }

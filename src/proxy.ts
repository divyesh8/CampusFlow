import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Presence is only a navigation hint. Every API verifies the in-memory session.
  const publicRoutes = ["/", "/login", "/landing", "/health"];
  if (!publicRoutes.includes(request.nextUrl.pathname) && !request.cookies.has("cf_portal_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };

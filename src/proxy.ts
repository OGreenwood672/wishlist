import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

// First line of defence: bounce visitors without a valid session back to the
// password screen. Pages and server actions re-check access against the DB.
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  const allowed = pathname.startsWith("/admin") ? session?.role === "admin" : session !== null;
  if (allowed) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/", request.url));
  if (request.cookies.has(SESSION_COOKIE) && !session) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ["/w/:path*", "/admin/:path*"],
};

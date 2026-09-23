import { NextResponse, type NextRequest } from "next/server";
import { VOTER_COOKIE } from "@/lib/constants";

const MAX_AGE = 60 * 60 * 24 * 365 * 5;

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(VOTER_COOKIE)?.value;
  if (existing) return NextResponse.next();

  const voterId = crypto.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const response = NextResponse.next();
  response.cookies.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS } from "@/lib/constants";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
const ADMIN_UID = "admin";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is not set.");
}

export async function createSession(): Promise<string> {
  return await new SignJWT({ role: "admin", uid: ADMIN_UID })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySession(token);
}

export async function setSessionCookie() {
  const token = await createSession();
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  cookies().set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session";
import { getAdminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({}));

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured on the server." }, { status: 500 });
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await setSessionCookie();

  let customToken: string | null = null;
  try {
    customToken = await getAdminAuth().createCustomToken("admin", { admin: true });
  } catch (error) {
    console.error("Could not mint admin custom token:", error);
  }

  return NextResponse.json({ ok: true, customToken });
}
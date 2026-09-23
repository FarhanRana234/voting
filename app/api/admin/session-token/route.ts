import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const customToken = await getAdminAuth().createCustomToken("admin", { admin: true });
  return NextResponse.json({ customToken });
}
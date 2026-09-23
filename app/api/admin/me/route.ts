import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ authed: false }, { status: 401 });
  return NextResponse.json({ authed: true });
}
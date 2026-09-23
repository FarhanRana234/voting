import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VOTER_COOKIE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const voterId = cookies().get(VOTER_COOKIE)?.value ?? crypto.randomUUID();
  return NextResponse.json({ voterId });
}
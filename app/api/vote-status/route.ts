import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase/admin";
import { VOTER_COOKIE, VOTE_COLLECTION } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const voterId = cookies().get(VOTER_COOKIE)?.value;
  if (!voterId) return NextResponse.json({ voted: [] });

  const snap = await getAdminDb()
    .collection(VOTE_COLLECTION)
    .where("voterId", "==", voterId)
    .limit(20)
    .get();

  const voted = snap.docs
    .map((d) => d.data())
    .filter((d) => d.participantId && d.categoryId)
    .map((d) => ({ categoryId: d.categoryId as string, participantId: d.participantId as string }));

  return NextResponse.json({ voted });
}
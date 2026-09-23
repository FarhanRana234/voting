import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { PARTICIPANT_VOTES_COLLECTION } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { participantId, delta } = await request.json().catch(() => ({}));
  const amount = Number(delta);
  if (!participantId || !Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "participantId and a non-zero delta are required." }, { status: 400 });
  }

  const db = getAdminDb();
  const pvRef = db.doc(`${PARTICIPANT_VOTES_COLLECTION}/${participantId}`);
  const partSnap = await db.collection("participants").doc(participantId).get();
  if (!partSnap.exists) return NextResponse.json({ error: "Participant not found." }, { status: 404 });

  const categoryId = partSnap.get("categoryId") as string;

  await db.runTransaction(async (t) => {
    const snap = await t.get(pvRef);
    const current = snap.exists ? Number(snap.get("voteCount") ?? 0) : 0;
    const next = Math.max(0, current + amount);
    t.set(pvRef, { categoryId, voteCount: next }, { merge: true });
  });

  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { PARTICIPANT_VOTES_COLLECTION } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const db = getAdminDb();
  const ref = db.collection("participants").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Participant not found." }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if ("photoUrl" in body) update.photoUrl = body.photoUrl ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await ref.update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getAdminDb();
  const ref = db.collection("participants").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Participant not found." }, { status: 404 });

  await db.runTransaction(async (t) => {
    t.delete(ref);
    t.delete(db.doc(`${PARTICIPANT_VOTES_COLLECTION}/${params.id}`));
  });

  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const db = getAdminDb();
  const ref = db.collection("categories").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if ("imageUrl" in body) update.imageUrl = body.imageUrl ?? null;

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
  const catRef = db.collection("categories").doc(params.id);
  if (!(await catRef.get()).exists) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const members = await db.collection("participants").where("categoryId", "==", params.id).get();
  const batch = db.batch();
  for (const doc of members.docs) {
    batch.delete(db.doc(`participantVotes/${doc.id}`));
    batch.delete(doc.ref);
  }
  batch.delete(catRef);
  await batch.commit();

  return NextResponse.json({ ok: true });
}
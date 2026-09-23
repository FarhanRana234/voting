import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { PARTICIPANT_VOTES_COLLECTION } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [catSnap, partSnap] = await Promise.all([
    getAdminDb().collection("categories").orderBy("order", "asc").get(),
    getAdminDb().collection("participants").orderBy("order", "asc").get(),
  ]);

  const participants = partSnap.docs.map((d) => ({
    id: d.id,
    categoryId: d.get("categoryId"),
    name: d.get("name"),
    photoUrl: d.get("photoUrl") ?? null,
    order: d.get("order") ?? 0,
  }));

  return NextResponse.json({
    categories: catSnap.docs.map((d) => ({
      id: d.id,
      name: d.get("name"),
      imageUrl: d.get("imageUrl") ?? null,
      order: d.get("order") ?? 0,
    })),
    participants,
  });
}

export async function POST(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { categoryId, name, photoUrl } = await request.json().catch(() => ({}));
  if (!categoryId || !name || typeof name !== "string") {
    return NextResponse.json({ error: "categoryId and name are required." }, { status: 400 });
  }

  const db = getAdminDb();
  const catSnap = await db.collection("categories").doc(categoryId).get();
  if (!catSnap.exists) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const members = await db.collection("participants").where("categoryId", "==", categoryId).get();

  const ref = db.collection("participants").doc();
  await db.runTransaction(async (t) => {
    t.set(ref, {
      categoryId,
      name: name.trim(),
      photoUrl: photoUrl ?? null,
      order: members.size,
    });
    t.set(db.doc(`${PARTICIPANT_VOTES_COLLECTION}/${ref.id}`), {
      categoryId,
      voteCount: 0,
    });
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
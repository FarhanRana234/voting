import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const snap = await getAdminDb().collection("categories").orderBy("order", "asc").get();
  const categories = snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name"),
    imageUrl: d.get("imageUrl") ?? null,
    order: d.get("order") ?? 0,
  }));
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { name, imageUrl } = await request.json().catch(() => ({}));
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const db = getAdminDb();
  const countSnap = await db.collection("categories").get();
  const ref = db.collection("categories").doc();
  await ref.set({
    name: name.trim(),
    imageUrl: imageUrl ?? null,
    order: countSnap.size,
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
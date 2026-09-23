import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDb, Timestamp } from "@/lib/firebase/admin";
import { SETTINGS_DOC } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const snap = await getAdminDb().doc(SETTINGS_DOC).get();
  const raw = snap.get("votingEndsAt");
  const votingEndsAt = raw instanceof Timestamp ? raw.toMillis() : raw ?? null;
  return NextResponse.json({ votingEndsAt });
}

export async function PATCH(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const incoming = body.votingEndsAt;
  let ends: Timestamp | null = null;

  if (incoming == null) {
    ends = null;
  } else if (incoming instanceof Date || typeof incoming === "number" || typeof incoming === "string") {
    const ms = incoming instanceof Date ? incoming.getTime() : new Date(incoming).getTime();
    if (Number.isNaN(ms)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    ends = Timestamp.fromMillis(ms);
  } else {
    return NextResponse.json({ error: "votingEndsAt must be an ISO string, number or null." }, { status: 400 });
  }

  if (ends) {
    await getAdminDb().doc(SETTINGS_DOC).set({ votingEndsAt: ends }, { merge: true });
  } else {
    await getAdminDb().doc(SETTINGS_DOC).set({ votingEndsAt: null }, { merge: true });
  }

  return NextResponse.json({ ok: true });
}
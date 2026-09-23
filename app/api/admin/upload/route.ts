import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Firestore documents have a 1MB total limit; keep the stored data URL well below it.
const MAX_DATA_URL_CHARS = 900_000;
const MAX_DECODED_BYTES = 550 * 1024;

export async function POST(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const raw = typeof body?.dataUrl === "string" ? body.dataUrl : "";

  if (!raw || raw.length > MAX_DATA_URL_CHARS) {
    return NextResponse.json({ error: "Invalid or oversized image." }, { status: 400 });
  }

  const match = raw.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Only base64 PNG, JPEG or WebP images are allowed." }, { status: 400 });
  }

  const decodedBytes = Math.floor((match[2].length * 3) / 4);
  if (decodedBytes > MAX_DECODED_BYTES) {
    return NextResponse.json({ error: "Image too large after encoding. Use a smaller photo." }, { status: 400 });
  }

  return NextResponse.json({ url: raw });
}
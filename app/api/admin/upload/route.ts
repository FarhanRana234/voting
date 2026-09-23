import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/session";
import { getAdminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const safeKind = kind === "category" ? "categories" : "participants";
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const path = `uploads/${safeKind}/${fileName}`;

  const bucket = getAdminStorage().bucket();
  const buffer = Buffer.from(await file.arrayBuffer());

  const blob = bucket.file(path);
  await blob.save(buffer, {
    metadata: { contentType: file.type },
    resumable: file.size > 4 * 1024 * 1024,
  });
  await blob.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(path)}`;
  return NextResponse.json({ url });
}
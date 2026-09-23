/**
 * Client-side image processing: reads a File, downscales it on a canvas so the
 * resulting data URL stays small enough to store directly in Firestore (which
 * has a 1MB document limit) — no Firebase Storage required.
 */
export const MAX_UPLOAD_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

export async function fileToResizedDataUrl(
  file: File,
  maxDim: number = MAX_UPLOAD_DIMENSION
): Promise<string> {
  const original = await readAsDataUrl(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode that image."));
    el.src = original;
  });

  const max = Math.max(img.width, img.height);
  const scale = Math.min(1, maxDim / max);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(img, 0, 0, w, h);

  const isPng = file.type === "image/png";
  const out = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  if (out.length > 900_000) {
    const tighter = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.6);
    if (tighter.length > 900_000) {
      throw new Error("Image is still too large after downsizing. Please pick a smaller photo.");
    }
    return tighter;
  }
  return out;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}
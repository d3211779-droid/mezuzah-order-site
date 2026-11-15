"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";

const BUCKET = "model-images";
const MAX_SIDE = 1200;

/** Draws the file on a canvas no larger than MAX_SIDE and returns a compact WebP (or PNG) blob. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.9);
  // Some browsers cannot encode WebP and silently return PNG - both are allowed by the bucket.
  return webp && webp.type === "image/webp" ? webp : ((await toBlob("image/png")) as Blob);
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Uploads a model photo to the public Supabase Storage bucket and returns its public URL.
 * Only the URL is stored in the database - never the image itself.
 */
export async function uploadModelImage(file: File): Promise<UploadResult> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "אפשר להעלות רק תמונות JPG, PNG או WebP." };
  try {
    const blob = await shrink(file);
    const ext = blob.type === "image/webp" ? "webp" : "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const supabase = getBrowserSupabase();
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return { ok: false, error: "העלאת התמונה נכשלה. נסו שוב." };
    return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  } catch {
    return { ok: false, error: "לא הצלחנו לעבד את התמונה. נסו קובץ אחר." };
  }
}

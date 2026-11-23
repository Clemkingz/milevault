/** Center-crop + resize an uploaded image to a small square JPEG data URL (keeps storage tiny). */
export async function toAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) throw new Error("Use a PNG, JPG, WebP or GIF image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("That image is over 5 MB. Pick a smaller one.");
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  if (s < 64) throw new Error("That image is too small. Use one at least 64×64 px.");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

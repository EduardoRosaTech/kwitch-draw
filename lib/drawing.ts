// Reencode the image before upload: small files and no original photo metadata.
export async function prepareDrawing(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (file.size > 15 * 1024 * 1024)
    throw Error("Escolha uma imagem de até 15 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw Error(
        "A imagem é muito grande. Reduza a resolução e tente novamente.",
      );
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw Error("Não foi possível preparar a imagem neste navegador.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.65, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob?.type === "image/webp" && blob.size <= 1024 * 1024) return blob;
    }
    throw Error(
      "Não consegui reduzir a imagem para 1 MB. Escolha uma versão menor.",
    );
  } finally {
    bitmap.close();
  }
}

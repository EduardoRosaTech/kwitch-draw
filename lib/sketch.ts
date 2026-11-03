export const SKETCH_WIDTH = 1200,
  SKETCH_HEIGHT = 900;
export type DrawingMode = "digital" | "paper";
export type SketchPoint = { x: number; y: number };
export type SketchStroke = {
  color: string;
  width: number;
  points: SketchPoint[];
};
export function sketchPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): SketchPoint {
  if (rect.width <= 0 || rect.height <= 0) throw Error("Quadro indisponível.");
  return {
    x: Math.max(
      0,
      Math.min(
        SKETCH_WIDTH,
        ((clientX - rect.left) * SKETCH_WIDTH) / rect.width,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        SKETCH_HEIGHT,
        ((clientY - rect.top) * SKETCH_HEIGHT) / rect.height,
      ),
    ),
  };
}
export function paintSketch(
  ctx: CanvasRenderingContext2D,
  strokes: SketchStroke[],
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SKETCH_WIDTH, SKETCH_HEIGHT);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    const p = stroke.points[0];
    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  ctx.restore();
}
export async function sketchFile(
  strokes: SketchStroke[],
): Promise<File | null> {
  if (!strokes.some((s) => s.color !== "#ffffff" && s.points.length))
    return null;
  const canvas = document.createElement("canvas");
  canvas.width = SKETCH_WIDTH;
  canvas.height = SKETCH_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Seu navegador não abriu o quadro de desenho.");
  paintSketch(ctx, strokes);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw Error("Não foi possível preparar seu desenho.");
  return new File([blob], "meu-desenho.png", { type: "image/png" });
}
export function downloadDrawing(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

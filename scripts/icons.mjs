import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const svg = await readFile(new URL("../public/icon.svg", import.meta.url));
for (const size of [192, 512])
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(
      fileURLToPath(new URL(`../public/icon-${size}.png`, import.meta.url)),
    );
const inner = await sharp(svg).resize(320, 320).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#271b31" },
})
  .composite([{ input: inner, left: 96, top: 96 }])
  .png()
  .toFile(
    fileURLToPath(new URL("../public/icon-maskable.png", import.meta.url)),
  );

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sketchPoint,
  paintSketch,
  sketchFile,
  SKETCH_WIDTH,
  SKETCH_HEIGHT,
} from "../lib/sketch.ts";
test("Pointer coordinates remain correct on resized and offset drawing boards", () => {
  const desktop = { left: 100, top: 50, width: 600, height: 450 };
  const phone = { left: 16, top: 200, width: 300, height: 225 };
  assert.deepEqual(sketchPoint(400, 275, desktop), { x: 600, y: 450 });
  assert.deepEqual(sketchPoint(166, 312.5, phone), { x: 600, y: 450 });
  assert.deepEqual(sketchPoint(-10, 9999, phone), { x: 0, y: 900 });
  assert.throws(
    () => sketchPoint(0, 0, { ...phone, width: 0 }),
    /indisponível/,
  );
});
test("White background, brush dots and eraser strokes are preserved by export rendering", () => {
  const calls = [];
  const context = new Proxy(
    {},
    {
      set(object, key, value) {
        object[key] = value;
        calls.push([key, value]);
        return true;
      },
      get(object, key) {
        return object[key] ?? ((...args) => calls.push([key, ...args]));
      },
    },
  );
  paintSketch(context, [
    { color: "#322339", width: 6, points: [{ x: 10, y: 20 }] },
    {
      color: "#ffffff",
      width: 12,
      points: [
        { x: 30, y: 40 },
        { x: 60, y: 80 },
      ],
    },
  ]);
  assert.deepEqual(calls[1], ["fillStyle", "#ffffff"]);
  assert.deepEqual(calls[2], ["fillRect", 0, 0, SKETCH_WIDTH, SKETCH_HEIGHT]);
  assert.ok(calls.some((c) => c[0] === "arc" && c[3] === 3));
  assert.ok(calls.some((c) => c[0] === "strokeStyle" && c[1] === "#ffffff"));
  assert.ok(calls.some((c) => c[0] === "lineTo" && c[1] === 60 && c[2] === 80));
  assert.equal(calls.at(-1)[0], "restore");
});
test("An untouched board or eraser-only board does not produce a reward attachment", async () => {
  assert.equal(await sketchFile([]), null);
  assert.equal(
    await sketchFile([
      { color: "#ffffff", width: 20, points: [{ x: 10, y: 20 }] },
    ]),
    null,
  );
});

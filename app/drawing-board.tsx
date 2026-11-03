"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  paintSketch,
  sketchPoint,
  SKETCH_WIDTH,
  SKETCH_HEIGHT,
  sketchFile,
  downloadDrawing,
  type SketchStroke,
} from "../lib/sketch";
export function DrawingBoard({
  strokes,
  onChange,
  disabled,
  onError,
}: {
  strokes: SketchStroke[];
  onChange: (strokes: SketchStroke[]) => void;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    drawing = useRef<{ pointer: number; stroke: SketchStroke } | null>(null),
    frame = useRef<number | undefined>(undefined),
    latest = useRef(strokes);
  const [color, setColor] = useState("#322339"),
    [width, setWidth] = useState(6),
    [eraser, setEraser] = useState(false),
    [undo, setUndo] = useState<SketchStroke[][]>([]),
    [redo, setRedo] = useState<SketchStroke[][]>([]),
    [clearAsked, setClearAsked] = useState(false);
  latest.current = strokes;
  function render() {
    const ctx = canvas.current?.getContext("2d");
    if (ctx)
      paintSketch(
        ctx,
        drawing.current
          ? [...latest.current, drawing.current.stroke]
          : latest.current,
      );
  }
  useEffect(() => {
    render();
  }, [strokes]);
  useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );
  function point(e: PointerEvent<HTMLCanvasElement>) {
    return sketchPoint(
      e.clientX,
      e.clientY,
      e.currentTarget.getBoundingClientRect(),
    );
  }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (disabled || drawing.current || e.button !== 0) return;
    e.preventDefault();
    if (strokes.length >= 1000) {
      onError(
        "Este quadro já tem muitos traços. Baixe seu desenho para guardá-lo.",
      );
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = {
      pointer: e.pointerId,
      stroke: { color: eraser ? "#ffffff" : color, width, points: [point(e)] },
    };
    render();
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || drawing.current.pointer !== e.pointerId) return;
    e.preventDefault();
    if (drawing.current.stroke.points.length < 20000)
      drawing.current.stroke.points.push(point(e));
    if (frame.current === undefined)
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined;
        render();
      });
  }
  function up(e: PointerEvent<HTMLCanvasElement>) {
    if (drawing.current?.pointer !== e.pointerId) return;
    const stroke = drawing.current.stroke;
    drawing.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    setUndo((previous) => [...previous.slice(-49), latest.current]);
    onChange([...latest.current, stroke]);
    setRedo([]);
  }
  function replace(next: SketchStroke[]) {
    onChange(next);
    setClearAsked(false);
  }
  async function download() {
    try {
      const file = await sketchFile(strokes);
      if (file) downloadDrawing(file);
      else onError("Faça alguns traços para baixar seu desenho.");
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não consegui baixar o desenho.",
      );
    }
  }
  return (
    <div className="drawing-board">
      <div className="drawing-toolbar" aria-label="Ferramentas de desenho">
        <button
          type="button"
          className={eraser ? "secondary" : ""}
          aria-pressed={!eraser}
          disabled={disabled}
          onClick={() => setEraser(false)}
        >
          ✎ Pincel
        </button>
        <button
          type="button"
          className={eraser ? "" : "secondary"}
          aria-pressed={eraser}
          disabled={disabled}
          onClick={() => setEraser(true)}
        >
          Borracha
        </button>
        <label>
          Cor
          <input
            aria-label="Cor do pincel"
            type="color"
            value={color}
            disabled={disabled}
            onChange={(e) => {
              setColor(e.target.value);
              setEraser(false);
            }}
          />
        </label>
        <label>
          Espessura: {width}
          <input
            type="range"
            aria-label="Espessura do pincel"
            min="1"
            max="40"
            value={width}
            disabled={disabled}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="secondary"
          disabled={disabled || (!strokes.length && !undo.length)}
          onClick={() => {
            setRedo([...redo, strokes]);
            const previous = undo.at(-1) ?? strokes.slice(0, -1);
            setUndo(undo.slice(0, -1));
            replace(previous);
          }}
        >
          Desfazer
        </button>
        <button
          type="button"
          className="secondary"
          disabled={disabled || !redo.length}
          onClick={() => {
            const saved = redo.at(-1)!;
            setUndo([...undo.slice(-49), strokes]);
            setRedo(redo.slice(0, -1));
            replace(saved);
          }}
        >
          Refazer
        </button>
        <button
          type="button"
          className="text-button"
          disabled={disabled || !strokes.length}
          onClick={() => setClearAsked(true)}
        >
          Limpar quadro
        </button>
        <button
          type="button"
          className="secondary"
          disabled={disabled || !strokes.length}
          onClick={download}
        >
          Baixar desenho
        </button>
      </div>
      {clearAsked && (
        <div className="clear-board-prompt" role="alert">
          <p>
            Limpar os traços deste quadro? Você poderá usar Desfazer para
            recuperá-los.
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setUndo([...undo.slice(-49), strokes]);
              setRedo([]);
              replace([]);
            }}
          >
            Limpar e permitir recuperar
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setClearAsked(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      <canvas
        ref={canvas}
        width={SKETCH_WIDTH}
        height={SKETCH_HEIGHT}
        className="drawing-canvas"
        aria-label="Quadro branco de desenho. Use mouse, toque ou caneta para desenhar."
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
      />
      <p className="muted">
        {strokes.length} traços · Use mouse, toque ou caneta. O quadro tem fundo
        branco.
      </p>
    </div>
  );
}

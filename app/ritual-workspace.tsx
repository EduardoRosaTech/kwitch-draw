"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DrawingBoard } from "./drawing-board";
import { prepareDrawing } from "../lib/drawing";
import {
  draftKey,
  getDrawingDraft,
  saveDrawingDraft,
  deleteDrawingDraft,
  draftFile,
  type DrawingDraft,
} from "../lib/drawing-drafts";
import {
  downloadDrawing,
  type DrawingMode,
  type SketchStroke,
} from "../lib/sketch";
export type WorkspaceHandle = {
  snapshot: () => Promise<File | null>;
  discard: () => Promise<void>;
};
export const RitualWorkspace = forwardRef<
  WorkspaceHandle,
  {
    userId: string;
    runId: string;
    initialMode: DrawingMode | null;
    disabled: boolean;
    paused: boolean;
  }
>(function RitualWorkspace(
  { userId, runId, initialMode, disabled, paused },
  ref,
) {
  const [mode, setMode] = useState<DrawingMode | null>(null),
    [strokes, setStrokes] = useState<SketchStroke[]>([]),
    [photo, setPhoto] = useState<Blob | null>(null),
    [ready, setReady] = useState(false),
    [processing, setProcessing] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [photoUrl, setPhotoUrl] = useState("");
  const current = useRef<DrawingDraft | null>(null),
    queue = useRef(Promise.resolve()),
    discarded = useRef(false),
    photoRequest = useRef(0),
    alive = useRef(true),
    fileInput = useRef<HTMLInputElement>(null),
    cameraInput = useRef<HTMLInputElement>(null);
  current.current =
    ready && mode
      ? {
          key: draftKey(userId, runId),
          userId,
          runId,
          mode,
          strokes,
          photo,
          updatedAt: Date.now(),
        }
      : null;
  function persist(draft: DrawingDraft) {
    if (alive.current) setStatus("Guardando rascunho…");
    const task = queue.current
      .catch(() => {})
      .then(() => saveDrawingDraft(draft));
    queue.current = task;
    task
      .then(() => {
        if (alive.current) setStatus("Rascunho salvo neste aparelho ✓");
      })
      .catch(() => {
        if (alive.current) {
          setStatus("Rascunho ainda não salvo");
          setError(
            "Não consegui guardar o rascunho neste aparelho. Você pode baixar seu desenho.",
          );
        }
      });
    return task;
  }
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    getDrawingDraft(userId, runId)
      .then((draft) => {
        if (cancelled) return;
        setMode(draft?.mode ?? initialMode);
        setStrokes(draft?.strokes ?? []);
        setPhoto(draft?.photo ?? null);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMode(initialMode);
        setReady(true);
        setError(
          "Este navegador não guardou o rascunho local. Baixe seu desenho antes de fechar a página.",
        );
      });
    return () => {
      cancelled = true;
      alive.current = false;
      photoRequest.current++;
      if (current.current && !discarded.current)
        void persist(current.current).catch(() => {});
    };
  }, [userId, runId]);
  useEffect(() => {
    if (!ready || !current.current || discarded.current) return;
    void persist(current.current).catch(() => {});
  }, [ready, mode, strokes, photo]);
  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useImperativeHandle(
    ref,
    () => ({
      snapshot: async () => {
        if (!ready || processing)
          throw Error("Aguarde seu desenho ficar pronto para concluir.");
        if (!current.current) return null;
        try {
          await persist(current.current);
        } catch {
          /* Cloud save can still succeed when device storage is unavailable. */
        }
        return draftFile(current.current);
      },
      discard: async () => {
        discarded.current = true;
        await queue.current.catch(() => {});
        await deleteDrawingDraft(userId, runId).catch(() => {});
      },
    }),
    [ready, processing, userId, runId],
  );
  async function pickPhoto(file: File) {
    const request = ++photoRequest.current;
    setProcessing(true);
    setError("");
    try {
      const blob = await prepareDrawing(file);
      if (request === photoRequest.current && alive.current) setPhoto(blob);
    } catch (e) {
      if (request === photoRequest.current && alive.current)
        setError(
          e instanceof Error ? e.message : "Não consegui abrir esta foto.",
        );
    } finally {
      if (request === photoRequest.current && alive.current)
        setProcessing(false);
    }
  }
  async function downloadPhoto() {
    if (photo)
      downloadDrawing(
        new File([photo], "meu-desenho.webp", { type: photo.type }),
      );
  }
  return (
    <section className="ritual-workspace" aria-label="Seu projeto de desenho">
      <h3>Como você quer desenhar?</h3>
      <div className="actions">
        <button
          type="button"
          className={mode === "digital" ? "" : "secondary"}
          aria-pressed={mode === "digital"}
          disabled={!ready || disabled || processing}
          onClick={() => setMode("digital")}
        >
          ✎ No digital
        </button>
        <button
          type="button"
          className={mode === "paper" ? "" : "secondary"}
          aria-pressed={mode === "paper"}
          disabled={!ready || disabled || processing}
          onClick={() => setMode("paper")}
        >
          ▤ No papel
        </button>
      </div>
      {!ready ? (
        <p>Abrindo seu rascunho…</p>
      ) : mode === "digital" ? (
        <>
          <p>
            Desenhe aqui. Ao concluir o ritual, seu desenho será guardado no
            histórico.
          </p>
          <DrawingBoard
            strokes={strokes}
            onChange={setStrokes}
            disabled={disabled || paused}
            onError={setError}
          />
          {paused && (
            <p className="muted">
              Ritual pausado. Toque em Retomar para continuar desenhando.
            </p>
          )}
        </>
      ) : mode === "paper" ? (
        <div className="paper-workspace">
          <p>
            Desenhe no papel e escolha uma foto do resultado. Ela será enviada
            ao concluir o ritual.
          </p>
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Escolher foto do desenho"
            disabled={disabled || processing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void pickPhoto(file);
            }}
          />
          <input
            ref={cameraInput}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            aria-label="Fotografar desenho"
            disabled={disabled || processing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void pickPhoto(file);
            }}
          />
          <div className="actions">
            <button
              type="button"
              disabled={disabled || processing}
              onClick={() => fileInput.current?.click()}
            >
              {processing
                ? "Preparando foto…"
                : photo
                  ? "Trocar foto do aparelho"
                  : "Escolher foto do aparelho"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={disabled || processing}
              onClick={() => cameraInput.current?.click()}
            >
              Tirar foto
            </button>
          </div>
          {photoUrl && (
            <>
              <img
                className="paper-photo"
                src={photoUrl}
                alt="Prévia da foto do seu desenho"
              />
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={downloadPhoto}
                  disabled={disabled}
                >
                  Baixar cópia
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setPhoto(null)}
                  disabled={disabled || processing}
                >
                  Remover foto
                </button>
              </div>
            </>
          )}
          <p className="muted">
            JPG, PNG ou WebP, até 15 MB. No celular, Tirar foto pode abrir a
            câmera; no computador, pode abrir o seletor de arquivos.
          </p>
        </div>
      ) : (
        <p>
          Escolha digital para abrir um quadro branco ou papel para enviar uma
          foto.
        </p>
      )}
      {mode && (
        <p className="draft-status" role="status">
          {status}
        </p>
      )}
      {error && (
        <p className="workspace-error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">
        Rascunhos ficam neste aparelho. O desenho só fica na sua conta depois de
        concluir e salvar online. Um desenho enviado concede +15 XP extras, uma
        vez por ritual.
      </p>
    </section>
  );
});

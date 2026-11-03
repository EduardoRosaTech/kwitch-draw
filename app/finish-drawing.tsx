"use client";
import { useEffect, useRef, useState } from "react";
import { prepareDrawing } from "../lib/drawing";
export function FinishDrawing({
  initialFile,
  busy,
  onClose,
  onConfirm,
}: {
  initialFile: File | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (file: File, publish: boolean) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    gallery = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState(initialFile),
    [url, setUrl] = useState(""),
    [publish, setPublish] = useState(false),
    [error, setError] = useState(""),
    [processing, setProcessing] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  async function choose(f?: File) {
    if (!f) return;
    setProcessing(true);
    setError("");
    try {
      const b = await prepareDrawing(f);
      setFile(new File([b], "desenho.webp", { type: "image/webp" }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir a imagem.",
      );
    } finally {
      setProcessing(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="finish-dialog"
      aria-labelledby="finish-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="finish-title">Seu desenho está pronto?</h2>
      <p>
        Envie seu desenho para concluir o ritual. O XP e a evolução serão salvos
        depois que a imagem for enviada com sucesso.
      </p>
      <div className="actions">
        <button
          disabled={busy || processing}
          onClick={() => camera.current?.click()}
        >
          📷 Tirar foto
        </button>
        <button
          className="secondary"
          disabled={busy || processing}
          onClick={() => gallery.current?.click()}
        >
          🖼 Escolher da galeria
        </button>
      </div>
      <input
        hidden
        ref={gallery}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        hidden
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {url && (
        <div className="drawing-preview">
          <img src={url} alt="Prévia do desenho que será salvo" />
          <div className="actions">
            <button
              className="text-button"
              disabled={busy}
              onClick={() => gallery.current?.click()}
            >
              Trocar imagem
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => setFile(null)}
            >
              Remover imagem da prévia
            </button>
          </div>
        </div>
      )}
      <label className="publish-choice">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          disabled={busy}
        />
        Publicar meu desenho na Comunidade
      </label>
      <p className="muted">
        Desmarcado: somente você vê seu desenho. Ao publicar, pessoas com conta
        no Kwitch Draw verão a imagem, seu apelido e seu familiar. Você poderá
        retirar a publicação depois.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {processing && <p role="status">Preparando imagem…</p>}
      <div className="actions finish-actions">
        <button
          disabled={!file || busy || processing}
          onClick={async () => {
            setError("");
            try {
              await onConfirm(file!, publish);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Não foi possível concluir. Seu ritual continua disponível.",
              );
            }
          }}
        >
          {busy ? "Enviando e confirmando…" : "Confirmar conclusão ✦"}
        </button>
        <button className="secondary" disabled={busy} onClick={onClose}>
          Voltar ao desenho
        </button>
      </div>
    </dialog>
  );
}

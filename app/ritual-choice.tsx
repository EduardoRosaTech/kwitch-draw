import { useEffect, useRef } from "react";
import type { Challenge } from "../lib/supabase";
import type { DrawingMode } from "../lib/sketch";
export function RitualChoice({
  challenge,
  busy,
  onChoose,
  onClose,
}: {
  challenge: Challenge;
  busy: boolean;
  onChoose: (mode: DrawingMode) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="ritual-choice"
      aria-labelledby="ritual-choice-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="eyebrow">SEU PRÓXIMO PROJETO</div>
      <h2 id="ritual-choice-title">Como você quer criar?</h2>
      <p>{challenge.title}</p>
      <div className="mode-grid">
        <button disabled={busy} onClick={() => onChoose("digital")}>
          <strong>✎ Desenhar no digital</strong>
          <span>Abra um quadro branco com pincel, cores e borracha.</span>
        </button>
        <button disabled={busy} onClick={() => onChoose("paper")}>
          <strong>▤ Desenhar no papel</strong>
          <span>Desenhe fora do app e escolha a foto pelo aparelho.</span>
        </button>
      </div>
      <p className="muted">
        O cronômetro de {challenge.duration_minutes} minutos começa após sua
        escolha. Você poderá trocar o modo durante o ritual.
      </p>
      <button className="text-button" disabled={busy} onClick={onClose}>
        Voltar
      </button>
    </dialog>
  );
}

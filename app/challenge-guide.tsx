"use client";
import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../lib/supabase";
import { VisualTutorial } from "./visual-tutorial";
export function ChallengeGuide({
  challenge,
  onClose,
  onStart,
  inProgress = false,
}: {
  challenge: Challenge;
  onClose: () => void;
  onStart?: () => void;
  inProgress?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [mode, setMode] = useState("guided");
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="guide-dialog visual-guide-dialog"
      aria-labelledby="guide-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="guide-heading">
        <button className="secondary" onClick={onClose}>
          ← Voltar ao desafio
        </button>
        <h2 id="guide-title">Como desenhar — {challenge.title}</h2>
        <p>{challenge.prompt}</p>
        <small>
          {challenge.difficulty} · {challenge.duration_minutes} min ·{" "}
          {challenge.xp} XP
        </small>
      </div>
      <div className="actions">
        <button
          className={mode === "guided" ? "" : "secondary"}
          onClick={() => setMode("guided")}
        >
          Modo Guiado
        </button>
        <button
          className={mode === "free" ? "" : "secondary"}
          onClick={() => setMode("free")}
        >
          Modo Livre
        </button>
      </div>
      {mode === "guided" ? (
        <VisualTutorial challengeId={challenge.id} />
      ) : (
        <p>
          Use o desafio acima e desenvolva sua própria solução. A recompensa é a
          mesma nos dois modos.
        </p>
      )}
      <div className="actions guide-footer">
        {onStart && (
          <button onClick={onStart}>
            {inProgress ? "✏ Continuar meu desenho" : "✏ Começar desafio"}
          </button>
        )}
        <button className="secondary" onClick={onClose}>
          Voltar ao desafio
        </button>
      </div>
      {inProgress && (
        <p className="muted">
          O cronômetro permanece no mesmo ritual e continua contando enquanto
          você consulta o guia.
        </p>
      )}
    </dialog>
  );
}

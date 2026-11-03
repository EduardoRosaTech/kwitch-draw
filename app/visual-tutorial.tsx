"use client";
import { useEffect, useId, useRef, useState } from "react";
import { db } from "../lib/supabase";
import { resolveTutorial, type TutorialPayload } from "../lib/visual-tutorial";
export function TutorialPages({
  payload,
  preview = false,
}: {
  payload: TutorialPayload;
  preview?: boolean;
}) {
  const [step, setStep] = useState(0),
    refs = useRef<(HTMLElement | null)[]>([]),
    id = useId();
  function jump(index: number) {
    setStep(index);
    refs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="visual-tutorial">
      <h3>{payload.title}</h3>
      {payload.intro && <p>{payload.intro}</p>}
      <nav className="tutorial-index" aria-label="Etapas do tutorial">
        {payload.steps.map((s, i) => (
          <button
            key={i}
            className={step === i ? "" : "secondary"}
            aria-current={step === i ? "step" : undefined}
            onClick={() => jump(i)}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </nav>
      <div className="tutorial-pages">
        {payload.steps.map((s, i) => (
          <article
            key={`${id}-${i}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`tutorial-page ${step === i ? "active-page" : ""}`}
          >
            <div className="eyebrow">
              PASSO {i + 1} · {payload.steps.length}
            </div>
            <h3>
              {s.type === "final"
                ? "Resultado final — uma inspiração"
                : s.title}
            </h3>
            {s.image ? (
              <img
                src={s.image}
                alt={`${s.title}: evolução do desenho, etapa ${i + 1}`}
                loading={i > 1 ? "lazy" : "eager"}
              />
            ) : (
              <div className="tutorial-image-missing">
                {preview
                  ? "Adicione uma imagem própria para esta etapa antes de publicar."
                  : "A imagem desta etapa está temporariamente indisponível."}
              </div>
            )}
            <p>{s.description}</p>
            {s.tip && <p className="tutorial-tip">✦ {s.tip}</p>}
          </article>
        ))}
      </div>
      {payload.palette.length > 0 && (
        <section className="tutorial-extras">
          <h3>🎨 Paleta sugerida</h3>
          <div className="tutorial-palette">
            {payload.palette.map((c, i) => (
              <div key={i}>
                <span style={{ background: c.hex }} aria-label={c.hex} />
                <strong>{c.label || c.hex}</strong>
                <small>{c.hex}</small>
              </div>
            ))}
          </div>
        </section>
      )}
      {payload.final_image &&
        !payload.steps.some((s) => s.image === payload.final_image) && (
          <section className="tutorial-page">
            <h3>✨ Uma inspiração de resultado</h3>
            <img
              src={payload.final_image}
              alt="Uma inspiração de resultado, sem obrigação de copiar"
            />
          </section>
        )}
      {payload.tips && (
        <section className="tutorial-extras">
          <h3>Detalhes, luz e possibilidades</h3>
          <p>{payload.tips}</p>
        </section>
      )}
      <div className="actions tutorial-pagination">
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => jump(step - 1)}
        >
          ← Etapa anterior
        </button>
        <span>
          {step + 1} / {payload.steps.length}
        </span>
        <button
          className="secondary"
          disabled={step >= payload.steps.length - 1}
          onClick={() => jump(step + 1)}
        >
          Próxima etapa →
        </button>
      </div>
      <p className="tutorial-inspiration">
        ✨ Não precisa ficar igual. Use o exemplo para entender a construção e
        crie sua própria versão.
      </p>
    </div>
  );
}
export function VisualTutorial({
  challengeId,
  lessonId,
}: {
  challengeId?: number;
  lessonId?: string;
}) {
  const [data, setData] = useState<TutorialPayload | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    setError("");
    async function load() {
      const r = await db!.rpc("get_visual_tutorial", {
        p_challenge_id: challengeId ?? null,
        p_lesson_id: lessonId ?? null,
      });
      if (r.error) throw Error(r.error.message);
      const result = r.data ? await resolveTutorial(r.data) : null;
      if (alive) setData(result);
    }
    load()
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const timer = setInterval(() => load().catch(() => {}), 240000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [challengeId, lessonId]);
  if (loading) return <p role="status">Abrindo as páginas do tutorial…</p>;
  if (error)
    return (
      <p className="notice" role="alert">
        Não foi possível abrir o tutorial: {error}
      </p>
    );
  if (!data)
    return (
      <div className="tutorial-unavailable">
        <h3>O tutorial visual desta atividade ainda não foi cadastrado.</h3>
        <p>
          Você pode desenhar no Modo Livre. Quando um guia próprio for
          publicado, ele aparecerá aqui.
        </p>
      </div>
    );
  return <TutorialPages key={`${challengeId ?? lessonId}`} payload={data} />;
}

import { useState } from "react";
import type {
  Challenge,
  Lesson,
  LessonStep,
  LessonProgress,
} from "../lib/supabase";
import { VisualTutorial } from "./visual-tutorial";
export function Academy({
  lessons,
  steps,
  progress,
  level,
  selected,
  onSelect,
  onRead,
  onPractice,
  busy,
  challenges,
  returnTitle,
  onReturn,
  onGuide,
}: {
  lessons: Lesson[];
  steps: LessonStep[];
  progress: LessonProgress[];
  level: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onRead: (id: string) => void;
  onPractice: (challenge: Challenge) => void;
  busy: boolean;
  challenges: Challenge[];
  returnTitle?: string;
  onReturn?: () => void;
  onGuide?: (challenge: Challenge) => void;
}) {
  const [category, setCategory] = useState("Todas"),
    [difficulty, setDifficulty] = useState("Todas"),
    [format, setFormat] = useState("lesson");
  const lesson = lessons.find((l) => l.id === selected),
    record = progress.find((p) => p.lesson_id === selected);
  const exercise = challenges.find(
    (c) => c.id === lesson?.practice_challenge_id,
  );
  return (
    <>
      <div className="welcome">
        <div>
          <div className="eyebrow">ACADEMIA MÁGICA</div>
          <h1>Grimório de Dicas ▤</h1>
          <p>
            Aprenda um detalhe, pratique com carinho e veja sua magia crescer.
          </p>
        </div>
      </div>
      <p className="muted">
        {lessons.filter((l) => l.format === "lesson").length} aulas ·{" "}
        {lessons.filter((l) => l.format === "quick_tip").length} truques rápidos
        · {progress.filter((p) => p.practice_completed_at).length} dicas
        praticadas
      </p>
      {lesson ? (
        <section className="panel lesson-detail">
          <button
            className="secondary"
            onClick={onReturn ?? (() => onSelect(null))}
          >
            {onReturn ? "← Voltar ao desafio" : "← Voltar às dicas"}
          </button>
          {returnTitle && (
            <p className="muted">
              Seu desafio: {returnTitle}. Você pode voltar e continuar de onde
              parou.
            </p>
          )}
          <div className="eyebrow">
            {lesson.category} · {lesson.difficulty} ·{" "}
            {Math.ceil(lesson.reading_seconds / 60)} min de leitura
          </div>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
          {level < lesson.min_level ? (
            <div className="empty">
              <h3>✦ Um novo capítulo espera por você</h3>
              <p>
                Esta dica abre no nível {lesson.min_level}. Continue seus
                rituais para chegar lá.
              </p>
            </div>
          ) : (
            <>
              <VisualTutorial key={lesson.id} lessonId={lesson.id} />
              <div className="lesson-notes">
                {" "}
                <ol className="lesson-text-notes">
                  {steps
                    .filter((s) => s.lesson_id === lesson.id)
                    .sort((a, b) => a.step - b.step)
                    .map((s) => (
                      <li key={s.step}>
                        <div>
                          <h3>
                            {s.step}. {s.title}
                          </h3>
                          <p>{s.explanation}</p>
                        </div>
                      </li>
                    ))}
                </ol>
              </div>
              <button
                className="secondary"
                disabled={busy || !!record?.read_at}
                onClick={() => onRead(lesson.id)}
              >
                {record?.read_at
                  ? "✓ Dica marcada como lida"
                  : "Marcar como lida"}
              </button>
              {exercise && (
                <div className="practice-box">
                  <div className="eyebrow">APRENDER → PRATICAR → EVOLUIR</div>
                  <h3>Praticar esta dica</h3>
                  <p>{exercise.prompt}</p>
                  <div className="tags">
                    <span>◷ {exercise.duration_minutes} min</span>
                    <span>✦ +{exercise.xp} XP</span>
                    {record?.practice_completed_at && (
                      <span>✓ Já praticada</span>
                    )}
                  </div>
                  {onGuide && (
                    <button
                      className="secondary"
                      onClick={() => onGuide(exercise)}
                    >
                      📖 Ver como desenhar este exercício
                    </button>
                  )}
                  <button disabled={busy} onClick={() => onPractice(exercise)}>
                    Começar exercício →
                  </button>
                  <p className="muted">
                    O XP é recebido após concluir o tempo do exercício. Ao
                    terminar, você pode guardar seu desenho no histórico.
                  </p>
                </div>
              )}
            </>
          )}
          {onReturn && (
            <button className="secondary" onClick={onReturn}>
              ← Voltar ao desafio
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="panel">
            <div className="actions">
              <button
                className={format === "lesson" ? "" : "secondary"}
                onClick={() => setFormat("lesson")}
              >
                Aulas ilustradas
              </button>
              <button
                className={format === "quick_tip" ? "" : "secondary"}
                onClick={() => setFormat("quick_tip")}
              >
                Truques rápidos
              </button>
            </div>
            <div className="filters">
              <label>
                Categoria
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Todas</option>
                  {[...new Set(lessons.map((l) => l.category))].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Nível do estudo
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>Todas</option>
                  {["iniciante", "intermediário", "avançado"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted">
              Iniciante: nível 1 · Intermediário: nível 3 · Avançado: nível 6.
              Aprenda no seu ritmo.
            </p>
          </section>
          <div className="lesson-grid">
            {lessons
              .filter(
                (l) =>
                  l.format === format &&
                  (category === "Todas" || l.category === category) &&
                  (difficulty === "Todas" || l.difficulty === difficulty),
              )
              .map((l) => {
                const locked = level < l.min_level,
                  p = progress.find((p) => p.lesson_id === l.id);
                return (
                  <button
                    key={l.id}
                    className={`lesson-card ${locked ? "locked" : ""}`}
                    onClick={() => onSelect(l.id)}
                  >
                    <span className="eyebrow">
                      {l.category} · {l.difficulty}
                    </span>
                    <h3>{l.title}</h3>
                    <p>{l.summary}</p>
                    <small>
                      {locked
                        ? `🔒 Abre no nível ${l.min_level}`
                        : p?.practice_completed_at
                          ? "✓ Prática concluída"
                          : p?.read_at
                            ? "✓ Lida · Praticar →"
                            : "Abrir dica →"}
                    </small>
                  </button>
                );
              })}
          </div>
          {!lessons.some(
            (l) =>
              l.format === format &&
              (category === "Todas" || l.category === category) &&
              (difficulty === "Todas" || l.difficulty === difficulty),
          ) && (
            <p className="empty">
              Nenhuma dica com esses filtros. Experimente outra combinação.
            </p>
          )}
        </>
      )}
    </>
  );
}

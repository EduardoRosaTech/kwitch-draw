"use client";
import { useEffect, useState } from "react";
import { db } from "../lib/supabase";
import { prepareDrawing } from "../lib/drawing";
import {
  resolveTutorial,
  type TutorialPayload,
  type TutorialStep,
} from "../lib/visual-tutorial";
import { TutorialPages } from "./visual-tutorial";
type CatalogItem = {
  id: number | string;
  title: string;
  category: string;
  difficulty: string;
};
const blankStep = (): TutorialStep => ({
  title: "Nova etapa",
  description: "",
  image: "",
  type: "sketch",
  tip: "",
});
const blank = (): TutorialPayload => ({
  title: "Novo tutorial visual",
  intro: "",
  palette: [],
  final_image: null,
  tips: "",
  steps: [blankStep()],
});
export function TutorialEditor({ userId }: { userId: string }) {
  const [catalog, setCatalog] = useState<{
      challenges: CatalogItem[];
      lessons: CatalogItem[];
    }>({ challenges: [], lessons: [] }),
    [kind, setKind] = useState("challenge"),
    [target, setTarget] = useState(""),
    [payload, setPayload] = useState<TutorialPayload>(blank),
    [revision, setRevision] = useState(0),
    [published, setPublished] = useState(false),
    [preview, setPreview] = useState<TutorialPayload | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false),
    [search, setSearch] = useState("");
  async function call(name: string, args?: Record<string, unknown>) {
    const r = await db!.rpc(name, args);
    if (r.error) throw Error(r.error.message);
    return r.data;
  }
  useEffect(() => {
    call("admin_tutorial_catalog")
      .then(setCatalog)
      .catch((e) => setNotice(e.message));
  }, []);
  const args = {
    p_challenge_id: kind === "challenge" && target ? Number(target) : null,
    p_lesson_id: kind === "lesson" ? target || null : null,
  };
  async function open(k: string, t: string) {
    if (
      dirty &&
      !window.confirm(
        "Trocar de atividade e descartar alterações que ainda não foram salvas?",
      )
    )
      return;
    setBusy(true);
    setNotice("");
    setPreview(null);
    try {
      const data = t
        ? await call("get_tutorial_draft", {
            p_challenge_id: k === "challenge" ? Number(t) : null,
            p_lesson_id: k === "lesson" ? t : null,
          })
        : null;
      setKind(k);
      setTarget(t);
      setPayload(data?.payload ?? blank());
      setRevision(data?.revision ?? 0);
      setPublished(data?.published ?? false);
      setDirty(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Não foi possível abrir.");
    } finally {
      setBusy(false);
    }
  }
  function edit(next: TutorialPayload) {
    setPayload(next);
    setDirty(true);
    setPreview(null);
  }
  function step(index: number, patch: Partial<TutorialStep>) {
    edit({
      ...payload,
      steps: payload.steps.map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      ),
    });
  }
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function image(file: File, index: number | null) {
    await action(async () => {
      const blob = await prepareDrawing(file);
      const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const path = `${userId}/${day}/${crypto.randomUUID()}.webp`;
      const r = await db!.storage
        .from("tutorial-assets")
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (r.error) throw Error(r.error.message);
      if (index === null) edit({ ...payload, final_image: `storage:${path}` });
      else step(index, { image: `storage:${path}` });
      setNotice(
        "Imagem preparada e enviada. Salve o rascunho ou publique para vincular a etapa.",
      );
    });
  }
  async function save(publish: boolean) {
    await action(async () => {
      const data = await call("save_visual_tutorial", {
        ...args,
        p_payload: payload,
        p_publish: publish,
        p_expected_revision: revision,
      });
      setRevision(data.revision);
      setPublished(data.published);
      setPayload(data.payload);
      setDirty(false);
      setNotice(
        publish
          ? "Tutorial publicado. Os participantes já podem consultar."
          : "Rascunho salvo. O tutorial publicado permanece igual.",
      );
    });
  }
  const items = kind === "challenge" ? catalog.challenges : catalog.lessons;
  return (
    <section className="panel tutorial-editor">
      <h2>Tutoriais visuais</h2>
      <p>
        Escolha uma atividade, acrescente imagens próprias e confira a prévia
        antes de publicar. Alterações ficam no rascunho até a publicação.
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="filters">
        <label>
          Tipo de conteúdo
          <select
            value={kind}
            disabled={busy}
            onChange={(e) => open(e.target.value, "")}
          >
            <option value="challenge">Desafio / exercício / Grimório</option>
            <option value="lesson">Academia / dica</option>
          </select>
        </label>
        <label>
          Buscar atividade
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label>
          Atividade
          <select
            value={target}
            disabled={busy}
            onChange={(e) => open(kind, e.target.value)}
          >
            <option value="">Selecione…</option>
            {items
              .filter(
                (i) =>
                  i.title
                    .toLocaleLowerCase("pt-BR")
                    .includes(search.toLocaleLowerCase("pt-BR")) ||
                  String(i.id) === target,
              )
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} · {i.difficulty}
                </option>
              ))}
          </select>
        </label>
      </div>
      {target && (
        <>
          <p>
            {published ? "Há uma versão publicada." : "Ainda não publicado."}{" "}
            {dirty ? "Você tem alterações não salvas." : ""}
          </p>
          <label>
            Título do tutorial
            <input
              maxLength={120}
              value={payload.title}
              disabled={busy}
              onChange={(e) => edit({ ...payload, title: e.target.value })}
            />
          </label>
          <label>
            Introdução curta
            <textarea
              maxLength={600}
              value={payload.intro}
              disabled={busy}
              onChange={(e) => edit({ ...payload, intro: e.target.value })}
            />
          </label>
          <div className="tutorial-editor-steps">
            {payload.steps.map((s, i) => (
              <section key={i} className="tutorial-edit-step">
                <h3>Etapa {i + 1}</h3>
                <div className="actions">
                  <button
                    className="secondary"
                    disabled={busy || i === 0}
                    onClick={() => {
                      const list = [...payload.steps];
                      [list[i - 1], list[i]] = [list[i], list[i - 1]];
                      edit({ ...payload, steps: list });
                    }}
                  >
                    ↑ Mover acima
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || i === payload.steps.length - 1}
                    onClick={() => {
                      const list = [...payload.steps];
                      [list[i + 1], list[i]] = [list[i], list[i + 1]];
                      edit({ ...payload, steps: list });
                    }}
                  >
                    ↓ Mover abaixo
                  </button>
                  <button
                    className="text-button"
                    disabled={busy || payload.steps.length === 1}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remover esta etapa do rascunho? O arquivo da imagem será mantido.",
                        )
                      )
                        edit({
                          ...payload,
                          steps: payload.steps.filter((_, n) => n !== i),
                        });
                    }}
                  >
                    Remover etapa
                  </button>
                </div>
                <label>
                  Título da etapa
                  <input
                    value={s.title}
                    maxLength={120}
                    disabled={busy}
                    onChange={(e) => step(i, { title: e.target.value })}
                  />
                </label>
                <label>
                  Tipo da etapa
                  <select
                    value={s.type}
                    disabled={busy}
                    onChange={(e) =>
                      step(i, { type: e.target.value as TutorialStep["type"] })
                    }
                  >
                    {[
                      ["reference", "Referências / formas"],
                      ["construction", "Construção"],
                      ["sketch", "Esboço"],
                      ["lineart", "Lineart e detalhes"],
                      ["color", "Cor e iluminação"],
                      ["detail", "Close / textura"],
                      ["final", "Resultado final — uma inspiração"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Descrição curta
                  <textarea
                    value={s.description}
                    maxLength={300}
                    disabled={busy}
                    onChange={(e) => step(i, { description: e.target.value })}
                  />
                </label>
                <label>
                  Imagem própria da etapa
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) image(f, i);
                    }}
                  />
                </label>
                <p className="muted">
                  {s.image
                    ? "Imagem vinculada. Use Pré-visualizar para conferir."
                    : "Imagem ainda não adicionada."}
                </p>
                <label>
                  Dica opcional
                  <input
                    value={s.tip}
                    maxLength={300}
                    disabled={busy}
                    onChange={(e) => step(i, { tip: e.target.value })}
                  />
                </label>
              </section>
            ))}
          </div>
          <button
            className="secondary"
            disabled={busy || payload.steps.length >= 40}
            onClick={() =>
              edit({ ...payload, steps: [...payload.steps, blankStep()] })
            }
          >
            + Adicionar etapa
          </button>
          <section className="tutorial-extras">
            <h3>Paleta sugerida</h3>
            {payload.palette.map((c, i) => (
              <div className="palette-editor" key={i}>
                <label>
                  Cor
                  <input
                    type="color"
                    value={c.hex}
                    disabled={busy}
                    onChange={(e) =>
                      edit({
                        ...payload,
                        palette: payload.palette.map((x, n) =>
                          n === i ? { ...x, hex: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Nome
                  <input
                    value={c.label}
                    maxLength={40}
                    disabled={busy}
                    onChange={(e) =>
                      edit({
                        ...payload,
                        palette: payload.palette.map((x, n) =>
                          n === i ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    edit({
                      ...payload,
                      palette: payload.palette.filter((_, n) => n !== i),
                    })
                  }
                >
                  Remover cor
                </button>
              </div>
            ))}
            <button
              className="secondary"
              disabled={busy || payload.palette.length >= 8}
              onClick={() =>
                edit({
                  ...payload,
                  palette: [
                    ...payload.palette,
                    { hex: "#8766ad", label: "Nova cor" },
                  ],
                })
              }
            >
              + Adicionar cor
            </button>
            <label>
              Imagem final opcional
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) image(f, null);
                }}
              />
            </label>
            {payload.final_image && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => edit({ ...payload, final_image: null })}
              >
                Retirar imagem final do rascunho
              </button>
            )}
            <label>
              Texturas, luz, extras e erros comuns
              <textarea
                maxLength={1000}
                value={payload.tips}
                disabled={busy}
                onChange={(e) => edit({ ...payload, tips: e.target.value })}
              />
            </label>
          </section>
          <div className="actions editor-save">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => save(false)}
            >
              Salvar rascunho
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  setPreview(await resolveTutorial(payload));
                  setNotice(
                    "Prévia com a mesma apresentação que o participante verá.",
                  );
                })
              }
            >
              Pré-visualizar
            </button>
            <button
              disabled={busy || !preview || preview.steps.some((s) => !s.image)}
              onClick={() => save(true)}
            >
              Publicar tutorial
            </button>
            {published && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Retirar este tutorial da visualização dos participantes? O conteúdo e o rascunho serão mantidos.",
                    )
                  )
                    action(async () => {
                      await call("unpublish_visual_tutorial", {
                        ...args,
                        p_expected_revision: revision,
                      });
                      await open(kind, target);
                      setNotice(
                        "Tutorial retirado. Você pode editar e publicar novamente.",
                      );
                    });
                }}
              >
                Retirar publicação
              </button>
            )}
          </div>
          {!preview && (
            <p className="muted">Confira a prévia antes de publicar.</p>
          )}
          {preview && (
            <div className="tutorial-preview">
              <div className="eyebrow">PRÉVIA DO PARTICIPANTE</div>
              <TutorialPages payload={preview} preview />
            </div>
          )}
        </>
      )}
    </section>
  );
}

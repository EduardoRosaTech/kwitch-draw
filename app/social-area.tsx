"use client";
import { useEffect, useState } from "react";
import { TutorialEditor } from "./tutorial-editor";
import { db } from "../lib/supabase";
import { FamiliarAvatar } from "./familiar";
import { defaultFamiliar, type Familiar } from "../lib/familiar";
type Drawing = Familiar & {
  id: string;
  user_id: string;
  drawing_path: string;
  drawing_visibility: string;
  moderated: boolean;
  completed_at: string;
  challenge_title: string;
  display_name: string;
  url?: string;
};
type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
};
type Message = {
  id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
};
type Overview = {
  users: number;
  rituals: number;
  active_week: number;
  public_drawings: number;
  open_tickets: number;
  new_reports: number;
  members: {
    id: string;
    display_name: string;
    email: string;
    level: number;
    xp: number;
  }[];
};
type Report = {
  id: string;
  drawing_id: string;
  reason: string;
  status: string;
  drawing_path: string;
  drawing_visibility: string;
};
const statusLabels: Record<string, string> = {
  new: "Nova",
  answered: "Respondida",
  resolved: "Resolvida",
};
export function SocialArea({
  section,
  userId,
  isAdmin,
  onChanged,
}: {
  section: "community" | "support" | "admin" | "mine";
  userId: string;
  isAdmin: boolean;
  onChanged: () => Promise<unknown>;
}) {
  const [drawings, setDrawings] = useState<Drawing[]>([]),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [overview, setOverview] = useState<Overview | null>(null),
    [reports, setReports] = useState<Report[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [body, setBody] = useState(""),
    [reply, setReply] = useState(""),
    [subject, setSubject] = useState(""),
    [category, setCategory] = useState("Dúvida"),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [reporting, setReporting] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [preview, setPreview] = useState<string | null>(null);
  const admin = section === "admin" && isAdmin;
  async function call(name: string, args?: Record<string, unknown>) {
    const r = await db!.rpc(name, args);
    if (r.error) throw Error(r.error.message);
    return r.data;
  }
  async function load() {
    if (section === "community" || section === "mine" || admin) {
      const list: Drawing[] = await call("list_drawings", {
        p_scope: admin ? "admin" : section === "mine" ? "mine" : "community",
        p_page: page,
      });
      const withUrls = await Promise.all(
        list.map(async (d) => {
          const r = await db!.storage
            .from("drawings")
            .createSignedUrl(d.drawing_path, 300);
          return { ...d, url: r.data?.signedUrl };
        }),
      );
      setDrawings(withUrls);
    }
    if (section === "support" || admin) {
      const r = await db!
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false })
        .range(page * 25, page * 25 + 24);
      if (r.error) throw Error(r.error.message);
      setTickets(r.data ?? []);
    }
    if (admin) {
      setOverview(await call("admin_overview", { p_page: page }));
      setReports(await call("admin_reports", { p_page: page }));
    }
  }
  async function act(fn: () => Promise<unknown>) {
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
  useEffect(() => {
    let alive = true;
    setBusy(true);
    load()
      .catch((e) => {
        if (alive) setNotice(e.message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    const interval = setInterval(() => load().catch(() => {}), 240000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [section, page, userId]);
  async function openTicket(id: string) {
    setSelected(id);
    const r = await db!
      .from("support_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at")
      .limit(500);
    if (r.error) throw Error(r.error.message);
    setMessages(r.data ?? []);
  }
  async function visibility(d: Drawing, value: string) {
    if (
      value === "removed" &&
      !window.confirm(
        "Remover este desenho? Ele deixará de aparecer no histórico e na Comunidade. Seu XP e a conclusão serão mantidos. O arquivo fica guardado para recuperação.",
      )
    )
      return;
    await act(async () => {
      await call("set_drawing_visibility", { p_id: d.id, p_visibility: value });
      await load();
      await onChanged();
      setNotice(
        value === "removed"
          ? "Desenho removido. Seu XP foi mantido."
          : value === "public"
            ? "Publicado na Comunidade."
            : "Agora seu desenho é privado.",
      );
    });
  }
  return (
    <>
      <div className="welcome">
        <div className="eyebrow">SEU UNIVERSO CRIATIVO</div>
        <h1>
          {admin
            ? "Painel Administrativo"
            : section === "support"
              ? "Dúvidas e Sugestões"
              : section === "mine"
                ? "Meus desenhos"
                : "Comunidade Kwitch Draw"}
        </h1>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {section === "admin" && !isAdmin ? (
        <p>Acesso administrativo necessário.</p>
      ) : (
        <>
          {admin && <TutorialEditor userId={userId} />}
          {admin && overview && (
            <>
              <section className="panel">
                <h2>Atividade do ateliê</h2>
                <div className="stats">
                  <p>{overview.users} usuários</p>
                  <p>{overview.rituals} rituais concluídos</p>
                  <p>{overview.active_week} artistas ativos em 7 dias</p>
                  <p>{overview.public_drawings} desenhos públicos</p>
                  <p>{overview.open_tickets} atendimentos abertos</p>
                  <p>{overview.new_reports} denúncias novas</p>
                </div>
              </section>
              <section className="panel">
                <h2>Usuários cadastrados</h2>
                <ul className="member-list">
                  {overview.members.map((m) => (
                    <li key={m.id}>
                      <strong>{m.display_name}</strong> · {m.email} · nível{" "}
                      {m.level} · {m.xp} XP<small>ID: {m.id}</small>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="panel">
                <h2>Denúncias</h2>
                {reports.length ? (
                  reports.map((r) => (
                    <article key={r.id} className="support-message">
                      <p>{r.reason}</p>
                      <small>{r.status === "new" ? "Nova" : "Resolvida"}</small>
                      <div className="actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              const u = await db!.storage
                                .from("drawings")
                                .createSignedUrl(r.drawing_path, 300);
                              if (u.error) throw u.error;
                              setPreview(u.data.signedUrl);
                            })
                          }
                        >
                          Ver desenho denunciado
                        </button>
                        {r.drawing_visibility === "public" && (
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Remover esta publicação pública? A conclusão e o XP serão mantidos.",
                                )
                              )
                                act(async () => {
                                  await call("set_drawing_visibility", {
                                    p_id: r.drawing_id,
                                    p_visibility: "removed",
                                  });
                                  await call("resolve_report", { p_id: r.id });
                                  await load();
                                });
                            }}
                          >
                            Remover publicação
                          </button>
                        )}
                        <button
                          className="secondary"
                          disabled={busy || r.status === "resolved"}
                          onClick={() =>
                            act(async () => {
                              await call("resolve_report", { p_id: r.id });
                              await load();
                            })
                          }
                        >
                          Marcar analisada
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p>Nenhuma denúncia nesta página.</p>
                )}
              </section>
            </>
          )}
          {(section === "support" || admin) && (
            <section className="panel">
              <h2>{admin ? "Atendimentos" : "Fale com o ateliê"}</h2>
              {!admin && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(async () => {
                      const id = await call("create_ticket", {
                        p_category: category,
                        p_subject: subject,
                        p_body: body,
                      });
                      setSubject("");
                      setBody("");
                      await load();
                      await openTicket(id);
                      setNotice("Mensagem enviada. A resposta aparecerá aqui.");
                    });
                  }}
                >
                  <label>
                    Tipo
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {["Dúvida", "Sugestão", "Problema/Bug", "Outro"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Assunto
                    <input
                      required
                      minLength={3}
                      maxLength={120}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </label>
                  <label>
                    Sua mensagem
                    <textarea
                      required
                      maxLength={3000}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </label>
                  <button disabled={busy}>Enviar ao administrador</button>
                </form>
              )}
              <div className="ticket-list">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    className="secondary"
                    disabled={busy}
                    onClick={() => act(() => openTicket(t.id))}
                  >
                    {t.subject} · {t.category} · {statusLabels[t.status]}
                  </button>
                ))}
                {!tickets.length && <p>Nenhuma solicitação nesta página.</p>}
              </div>
              {selected && (
                <div className="support-conversation">
                  <h3>
                    {tickets.find((t) => t.id === selected)?.subject ??
                      "Atendimento"}
                  </h3>
                  {messages.map((m) => (
                    <div key={m.id} className="support-message">
                      <strong>
                        {m.is_staff ? "Equipe Kwitch Draw" : "Participante"}
                      </strong>
                      <small>
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </small>
                      <p>{m.body}</p>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(async () => {
                        await call("reply_ticket", {
                          p_id: selected,
                          p_body: reply,
                        });
                        setReply("");
                        await load();
                        await openTicket(selected);
                      });
                    }}
                  >
                    <label>
                      Resposta
                      <textarea
                        required
                        maxLength={3000}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                    </label>
                    <button disabled={busy}>Enviar resposta</button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        act(async () => {
                          await call("resolve_ticket", { p_id: selected });
                          await load();
                          setNotice("Atendimento resolvido.");
                        })
                      }
                    >
                      Marcar como resolvido
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}
          {(section === "community" || section === "mine" || admin) && (
            <>
              <p className="muted">
                {section === "mine"
                  ? "Seus desenhos privados e publicados."
                  : "Inspire-se nas interpretações de outros artistas. A publicação é sempre uma escolha de quem desenhou."}
              </p>
              <div className="community-grid">
                {drawings.map((d) => (
                  <article key={d.id} className="panel community-card">
                    {d.url ? (
                      <img
                        loading="lazy"
                        className="community-art"
                        src={d.url}
                        alt={`Desenho de ${d.display_name}: ${d.challenge_title}`}
                      />
                    ) : (
                      <p>Imagem indisponível. Atualize a página.</p>
                    )}
                    <div className="artist">
                      <FamiliarAvatar familiar={{ ...defaultFamiliar, ...d }} />
                      <strong>{d.display_name}</strong>
                    </div>
                    <h3>{d.challenge_title}</h3>
                    <small>
                      {new Date(d.completed_at).toLocaleDateString("pt-BR")} ·{" "}
                      {d.drawing_visibility === "public"
                        ? "Publicado"
                        : "Privado"}
                    </small>
                    <div className="actions">
                      {d.user_id === userId && (
                        <>
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              visibility(
                                d,
                                d.drawing_visibility === "public"
                                  ? "private"
                                  : "public",
                              )
                            }
                          >
                            {d.drawing_visibility === "public"
                              ? "Tornar privado"
                              : "Publicar na Comunidade"}
                          </button>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => visibility(d, "removed")}
                          >
                            Excluir desenho
                          </button>
                        </>
                      )}
                      {admin && d.user_id !== userId && (
                        <button
                          disabled={busy}
                          onClick={() => visibility(d, "removed")}
                        >
                          Remover publicação
                        </button>
                      )}
                      {d.user_id !== userId && !admin && (
                        <button
                          className="text-button"
                          onClick={() => {
                            setReporting(d.id);
                            setReason("");
                          }}
                        >
                          Denunciar
                        </button>
                      )}
                    </div>
                    {reporting === d.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          act(async () => {
                            await call("report_drawing", {
                              p_id: d.id,
                              p_reason: reason,
                            });
                            setReporting(null);
                            setNotice("Denúncia enviada ao administrador.");
                          });
                        }}
                      >
                        <label>
                          Motivo
                          <textarea
                            required
                            minLength={3}
                            maxLength={1000}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </label>
                        <button disabled={busy}>Enviar denúncia</button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => setReporting(null)}
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
              {!drawings.length && (
                <p className="panel">Nenhum desenho nesta página.</p>
              )}
            </>
          )}
          <div className="actions pagination">
            <button
              className="secondary"
              disabled={busy || page === 0}
              onClick={() => {
                setPage(page - 1);
                setSelected(null);
              }}
            >
              ← Anterior
            </button>
            <span>Página {page + 1}</span>
            <button
              className="secondary"
              disabled={
                busy ||
                (drawings.length < 24 &&
                  tickets.length < 25 &&
                  (overview?.members.length ?? 0) < 25 &&
                  reports.length < 25)
              }
              onClick={() => {
                setPage(page + 1);
                setSelected(null);
              }}
            >
              Próxima →
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => act(load)}
            >
              Atualizar
            </button>
          </div>
        </>
      )}
      {preview && (
        <div
          role="dialog"
          aria-label="Desenho denunciado"
          className="report-preview panel"
        >
          <button onClick={() => setPreview(null)}>Fechar imagem</button>
          <img src={preview} alt="Desenho denunciado para análise" />
        </div>
      )}
    </>
  );
}

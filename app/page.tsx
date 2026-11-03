"use client";
import { useEffect, useState, useRef, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { address, type Gender } from "../lib/addressing";
import { prepareDrawing } from "../lib/drawing";
import { FamiliarAvatar, FamiliarEditor } from "./familiar";
import {
  defaultFamiliar,
  familiarFromProfile,
  type Familiar,
} from "../lib/familiar";
import { levelProgress, xpForLevel } from "../lib/progression";
import { FinishDrawing } from "./finish-drawing";
import { SocialArea } from "./social-area";
import { ChallengeGuide } from "./challenge-guide";
import { Academy } from "./academy";
import { RitualChoice } from "./ritual-choice";
import { RitualWorkspace, type WorkspaceHandle } from "./ritual-workspace";
import { type DrawingMode } from "../lib/sketch";
import {
  listDrawingDrafts,
  getDrawingDraft,
  deleteDrawingDraft,
  draftFile,
} from "../lib/drawing-drafts";
import {
  db,
  configured,
  type Challenge,
  type Profile,
  type Run,
  type Completion,
  type Grimoire,
  type Spell,
  type Lesson,
  type LessonStep,
  type LessonProgress,
  type ChallengeLesson,
} from "../lib/supabase";
type Tab =
  | "home"
  | "generator"
  | "grimoires"
  | "spells"
  | "profile"
  | "academy"
  | "community"
  | "support"
  | "admin"
  | "mine";
const nav: [Tab, string, string][] = [
  ["home", "☽", "Meu ateliê"],
  ["generator", "✧", "Gerador mágico"],
  ["grimoires", "▤", "Grimórios"],
  ["academy", "✎", "Grimório de Dicas"],
  ["spells", "✦", "Meus feitiços"],
  ["profile", "♡", "Meu perfil"],
  ["mine", "▧", "Meus desenhos"],
  ["community", "☷", "Comunidade"],
  ["support", "?", "Dúvidas e Sugestões"],
];
function localDay() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function clock(n: number) {
  return `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
}
function TreatmentSelect({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  return (
    <label>
      Como você prefere ser chamado ou chamada?
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Gender)}
      >
        <option value="neutral">Neutro — pessoa criativa</option>
        <option value="feminine">Feminino — bruxinha</option>
        <option value="masculine">Masculino — bruxinho</option>
      </select>
    </label>
  );
}
export default function Page() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [finishing, setFinishing] = useState<{
    runId: string;
    file: File | null;
  } | null>(null);
  const [guide, setGuide] = useState<{
    challenge: Challenge;
    kind: string;
  } | null>(null);
  const workspace = useRef<WorkspaceHandle | null>(null);
  const [projectChoice, setProjectChoice] = useState<{
      challenge: Challenge;
      kind: string;
    } | null>(null),
    [workspaceMode, setWorkspaceMode] = useState<DrawingMode | null>(null),
    [pendingDrafts, setPendingDrafts] = useState<string[]>([]),
    [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [lessons, setLessons] = useState<Lesson[]>([]),
    [lessonSteps, setLessonSteps] = useState<LessonStep[]>([]),
    [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]),
    [recommendations, setRecommendations] = useState<ChallengeLesson[]>([]),
    [dailyTip, setDailyTip] = useState<Lesson | null>(null),
    [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonOrigin, setLessonOrigin] = useState<{
    tab: Tab;
    challengeId: number;
    title: string;
  } | null>(null);
  function openLesson(id: string, challengeId?: number) {
    const challenge = challenges.find((c) => c.id === challengeId);
    setLessonOrigin(
      challenge
        ? { tab, challengeId: challenge.id, title: challenge.title }
        : null,
    );
    setSelectedLesson(id);
    setTab("academy");
  }
  async function readLesson(id: string) {
    await act(async () => {
      const { error } = await db!.rpc("mark_lesson_read", { p_lesson_id: id });
      if (error) throw error;
      await refresh();
    });
  }
  const [gender, setGender] = useState<Gender>("neutral");
  const [familiar, setFamiliar] = useState<Familiar>({ ...defaultFamiliar });
  const [drawingView, setDrawingView] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const currentUser = useRef<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [tab, setTab] = useState<Tab>("home");
  const [profile, setProfile] = useState<Profile | null>(null),
    [challenges, setChallenges] = useState<Challenge[]>([]),
    [grimoires, setGrimoires] = useState<Grimoire[]>([]),
    [spells, setSpells] = useState<Spell[]>([]),
    [unlocked, setUnlocked] = useState<string[]>([]),
    [history, setHistory] = useState<Completion[]>([]),
    [daily, setDaily] = useState<Challenge | null>(null),
    [run, setRun] = useState<Run | null>(null);
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [filter, setFilter] = useState("Todas"),
    [difficulty, setDifficulty] = useState("Todas"),
    [generated, setGenerated] = useState<Challenge | null>(null),
    [now, setNow] = useState(Date.now()),
    [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    db.auth.getSession().then(({ data, error }) => {
      if (error) setMessage(error.message);
      currentUser.current = data.session?.user.id;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      currentUser.current = session?.user.id;
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function refresh() {
    if (!db) return;
    const requestedUser = currentUser.current;
    if (!requestedUser) return;
    const results = await Promise.all([
      db.from("profiles").select("*").single(),
      db.from("challenges").select("*").order("id"),
      db.from("grimoires").select("*").order("id"),
      db.from("achievements").select("*").order("required_count"),
      db.from("user_achievements").select("achievement_id"),
      loadHistory(),
      db.rpc("daily_challenge"),
      db
        .from("challenge_runs")
        .select("*")
        .in("status", ["active", "paused"])
        .maybeSingle(),
      db.from("lessons").select("*").order("sort_order"),
      db.from("lesson_steps").select("*").order("step"),
      db.from("user_lesson_progress").select("*"),
      db.from("challenge_lessons").select("*").order("priority"),
      db.rpc("daily_tip"),
      db.rpc("is_admin"),
    ]);
    if (requestedUser !== currentUser.current) return;
    const err = results.find((r) => r.error)?.error;
    if (err) throw Error(err.message);
    setProfile(results[0].data);
    setName(results[0].data.display_name);
    setGender(results[0].data.gender ?? "neutral");
    setFamiliar(familiarFromProfile(results[0].data));
    setChallenges(results[1].data ?? []);
    setGrimoires(results[2].data ?? []);
    setSpells(results[3].data ?? []);
    setUnlocked(
      (results[4].data ?? []).map(
        (v: { achievement_id: string }) => v.achievement_id,
      ),
    );
    setHistory(results[5].data ?? []);
    setDaily(results[6].data?.[0] ?? null);
    setRun(results[7].data);
    listDrawingDrafts(requestedUser)
      .then((drafts) => {
        if (currentUser.current === requestedUser)
          setPendingDrafts(
            drafts
              .filter((d) =>
                d.mode === "digital"
                  ? d.strokes.some(
                      (s) => s.color !== "#ffffff" && s.points.length,
                    )
                  : !!d.photo,
              )
              .map((d) => d.runId),
          );
      })
      .catch(() => {});
    setLessons(results[8].data ?? []);
    setLessonSteps(results[9].data ?? []);
    setLessonProgress(results[10].data ?? []);
    setRecommendations(results[11].data ?? []);
    setDailyTip(results[12].data?.[0] ?? null);
    setIsAdmin(Boolean(results[13].data));
    return results[0].data as Profile;
  }
  async function loadHistory() {
    const all: Completion[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db!
        .from("completions")
        .select("*")
        .order("completed_at", { ascending: false })
        .order("id")
        .range(offset, offset + 499);
      if (error) return { data: all, error };
      all.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) return { data: all, error: null };
    }
  }
  useEffect(() => {
    if (user) {
      setLoading(true);
      refresh()
        .catch((e) => setMessage(e.message))
        .finally(() => setLoading(false));
    } else {
      setDrawingView(null);
      setIsAdmin(false);
      setFinishing(null);
      setGuide(null);
      setProfile(null);
      setRun(null);
      setHistory([]);
      setChallenges([]);
      setUnlocked([]);
      setGrimoires([]);
      setSpells([]);
      setDaily(null);
      setLessons([]);
      setLessonSteps([]);
      setLessonProgress([]);
      setRecommendations([]);
      setDailyTip(null);
      setSelectedLesson(null);
      setProjectChoice(null);
      setWorkspaceMode(null);
      setPendingDrafts([]);
      setPendingFiles({});
    }
  }, [user?.id]);
  // Atualiza o ritual diário quando a aba volta ou vira o dia de São Paulo.
  useEffect(() => {
    if (!user) return;
    const update = () => refresh().catch((e) => setMessage(e.message));
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [user?.id]);
  const day = localDay();
  useEffect(() => {
    if (user) refresh().catch((e) => setMessage(e.message));
  }, [day]);
  async function act(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (!navigator.onLine)
        throw Error("Conecte-se à internet para salvar seu ritual.");
      await fn();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await act(async () => {
      const { error } = await db!.auth.signOut();
      if (error) throw error;
      setTab("home");
      setGenerated(null);
      setEmail("");
      setName("");
      setGender("neutral");
      setFamiliar({ ...defaultFamiliar });
    });
  }
  async function auth(e: FormEvent) {
    e.preventDefault();
    await act(async () => {
      if (!db) return;
      if (signup) {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name.trim(),
              gender,
              ...familiar,
              familiar_name: familiar.familiar_name.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session)
          setMessage(
            "Conta criada! Confirme seu e-mail e depois entre com sua senha.",
          );
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword("");
    });
  }
  function start(c: Challenge, kind: string) {
    setProjectChoice({ challenge: c, kind });
  }
  async function beginProject(mode: DrawingMode) {
    if (!projectChoice) return;
    const { challenge: c, kind } = projectChoice;
    await act(async () => {
      const { data, error } = await db!.rpc("start_challenge", {
        p_challenge_id: c.id,
        p_kind: kind,
      });
      if (error) throw error;
      setRun(data);
      setWorkspaceMode(mode);
      setProjectChoice(null);
      setTab("home");
    });
  }
  async function control(action: string) {
    if (action === "complete") {
      try {
        const file = (await workspace.current?.snapshot()) ?? null;
        setFinishing({ runId: run!.id, file });
      } catch (e) {
        setMessage(
          e instanceof Error
            ? e.message
            : "Não foi possível preparar seu desenho.",
        );
      }
      return;
    }
    if (
      action === "abandon" &&
      !window.confirm(
        "Abandonar este ritual sem XP? Baixe o desenho primeiro se quiser guardá-lo.",
      )
    )
      return;
    await act(async () => {
      const { error } = await db!.rpc("control_run", {
        p_run_id: run!.id,
        p_action: action,
      });
      if (error) throw error;
      if (action === "abandon") await workspace.current?.discard();
      await refresh();
    });
  }
  async function finishRitual(file: File, publish: boolean) {
    if (!finishing || busy) return;
    setBusy(true);
    const working = finishing,
      requestedUser = currentUser.current;
    try {
      if (!navigator.onLine)
        throw Error(
          "Conecte-se à internet. Seu ritual continua disponível e nenhum XP foi concedido.",
        );
      const previous = await db!
        .from("completions")
        .select("id")
        .eq("run_id", working.runId)
        .maybeSingle();
      if (previous.error) throw previous.error;
      if (!previous.data) {
        const blob = await prepareDrawing(file);
        if (currentUser.current !== requestedUser)
          throw Error("A sessão mudou. Entre novamente.");
        const path = `${requestedUser}/${working.runId}.webp`;
        const listed = await db!.storage
          .from("drawings")
          .list(requestedUser!, { search: `${working.runId}.webp` });
        if (listed.error) throw listed.error;
        if (listed.data.some((o) => o.name === `${working.runId}.webp`)) {
          const removed = await db!.storage.from("drawings").remove([path]);
          if (removed.error) throw removed.error;
        }
        const uploaded = await db!.storage
          .from("drawings")
          .upload(path, blob, { contentType: "image/webp", upsert: false });
        if (uploaded.error)
          throw Error(
            `O upload falhou: ${uploaded.error.message}. Seu ritual continua disponível.`,
          );
      }
      if (currentUser.current !== requestedUser)
        throw Error("A sessão mudou. Entre novamente.");
      const result = await db!.rpc("finish_with_drawing", {
        p_run_id: working.runId,
        p_public: publish,
      });
      if (result.error) throw result.error;
      if (currentUser.current !== requestedUser) return;
      await workspace.current?.discard().catch(() => {});
      await deleteDrawingDraft(requestedUser!, working.runId).catch(() => {});
      setFinishing(null);
      await refresh();
      setTab("mine");
      setMessage(
        `Ritual concluído! +${result.data.xp + result.data.drawing_bonus} XP. Desenho salvo ${result.data.drawing_visibility === "public" ? "e publicado na Comunidade" : "somente para você"}. ✨`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function uploadDrawing(h: Completion, file: File) {
    await act(async () => {
      await saveDrawing(h, file);
      await refresh();
      setMessage("Desenho guardado no seu histórico! +15 XP extras. ✨");
    });
  }
  async function saveDrawing(h: Completion, file: File) {
    const requestedUser = user!.id;
    const blob = await prepareDrawing(file);
    if (currentUser.current !== requestedUser)
      throw Error("A sessão mudou. Entre novamente para salvar seu desenho.");
    const path = `${requestedUser}/${h.id}.webp`;
    // A previous upload may have succeeded even if the bonus request lost its connection.
    const { data: existing, error: lookupError } = await db!.storage
      .from("drawings")
      .list(requestedUser, { search: `${h.id}.webp` });
    if (lookupError) throw lookupError;
    if (currentUser.current !== requestedUser)
      throw Error("A sessão mudou. Entre novamente para salvar seu desenho.");
    if (!existing?.some((o) => o.name === `${h.id}.webp`)) {
      const { error } = await db!.storage
        .from("drawings")
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error)
        throw Error(`Não foi possível enviar o desenho: ${error.message}`);
    }
    const { error } = await db!.rpc("attach_drawing", {
      p_completion_id: h.id,
    });
    if (error) throw error;
    if (currentUser.current !== requestedUser)
      throw Error("A sessão mudou. Entre novamente para salvar seu desenho.");
    if (run?.id === h.run_id && workspace.current)
      await workspace.current.discard();
    else await deleteDrawingDraft(requestedUser, h.run_id).catch(() => {});
    setPendingFiles((previous) => {
      const next = { ...previous };
      delete next[h.run_id];
      return next;
    });
    setPendingDrafts((previous) => previous.filter((id) => id !== h.run_id));
  }
  async function retryDrawing(h: Completion) {
    await act(async () => {
      const local = await getDrawingDraft(user!.id, h.run_id).catch(() => null);
      const file =
        pendingFiles[h.run_id] ?? (local ? await draftFile(local) : null);
      if (!file)
        throw Error(
          "O rascunho não está mais neste aparelho. Escolha uma foto do desenho para enviar.",
        );
      await saveDrawing(h, file);
      await refresh();
      setMessage("Desenho guardado! +15 XP extras. ✨");
    });
  }
  async function viewDrawing(h: Completion) {
    await act(async () => {
      const requestedUser = user!.id;
      const { data, error } = await db!.storage
        .from("drawings")
        .createSignedUrl(h.drawing_path!, 300);
      if (error) throw error;
      if (currentUser.current !== requestedUser) return;
      setDrawingView({
        url: data.signedUrl,
        title:
          challenges.find((c) => c.id === h.challenge_id)?.title ??
          "Meu desenho",
      });
    });
  }
  const active = challenges.find((c) => c.id === run?.challenge_id);
  const elapsed = run
    ? run.accumulated_seconds +
      (run.status === "active" && run.active_since
        ? Math.max(
            0,
            Math.floor((now - new Date(run.active_since).getTime()) / 1000),
          )
        : 0)
    : 0;
  const remaining = active
    ? Math.max(0, active.duration_minutes * 60 - elapsed)
    : 0;
  const done = new Set(history.map((h) => h.challenge_id));
  const practicedCount = new Set(
    history.filter((h) => h.kind === "practice").map((h) => h.challenge_id),
  ).size;
  const savedFamiliar = familiarFromProfile(profile);
  const progress = levelProgress(profile?.xp ?? 0);
  const todayHistory = history.filter((h) => h.completed_on === day);
  const effectiveStreak =
    profile?.last_completed_on &&
    new Date(`${day}T12:00:00Z`).getTime() -
      new Date(`${profile.last_completed_on}T12:00:00Z`).getTime() <=
      86400000
      ? profile.streak
      : 0;
  function generate() {
    const list = challenges.filter(
      (c) =>
        c.channel === "standard" &&
        (filter === "Todas" || c.category === filter) &&
        (difficulty === "Todas" || c.difficulty === difficulty) &&
        !todayHistory.some((h) => h.challenge_id === c.id),
    );
    if (!list.length) {
      setGenerated(null);
      setMessage(
        "Nenhum desafio disponível com esses filtros. Experimente outra combinação.",
      );
      return;
    }
    setGenerated(list[Math.floor(Math.random() * list.length)]);
    setMessage("");
  }
  function card(c: Challenge, kind: string) {
    const completed =
      kind === "daily"
        ? todayHistory.some((h) => h.kind === "daily")
        : kind === "journey"
          ? done.has(c.id)
          : todayHistory.some((h) => h.challenge_id === c.id);
    return (
      <article className="challenge-card" id={`challenge-${c.id}`}>
        <div className="eyebrow">
          {c.category} · {c.difficulty}
        </div>
        <h2>{c.title}</h2>
        <p>{c.prompt}</p>
        {recommendedTips(c.id)}
        <button
          className="text-button"
          onClick={() => setGuide({ challenge: c, kind })}
        >
          📖 Ver como desenhar
        </button>
        <div className="tags">
          <span>◷ {c.duration_minutes} min</span>
          <span>✦ +{c.xp} XP</span>
        </div>
        <button
          disabled={
            busy || !!run || completed || !online || todayHistory.length >= 5
          }
          onClick={() => start(c, kind)}
        >
          {completed ? "✓ Ritual concluído" : "Começar meu ritual →"}
        </button>
      </article>
    );
  }
  function recommendedTips(challengeId: number) {
    const ids = recommendations
      .filter((r) => r.challenge_id === challengeId)
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.lesson_id);
    const related = ids
      .map((id) => lessons.find((l) => l.id === id))
      .filter((l): l is Lesson => !!l);
    return related.length > 0 ? (
      <div className="recommended-tips">
        <small>✎ Antes de desenhar, uma ajudinha:</small>
        {related.map((l) => (
          <button
            key={l.id}
            className="text-button"
            onClick={() => openLesson(l.id, challengeId)}
          >
            {l.title} →
          </button>
        ))}
      </div>
    ) : null;
  }
  if (loading)
    return (
      <main className="loading">
        <img src="/icon.svg" width="64" alt="" />
        <p>Abrindo seu ateliê…</p>
      </main>
    );
  if (!user)
    return (
      <main className="auth">
        <section className="auth-art">
          <div className="brand">
            ✦ Kwitch <em>Draw</em>
          </div>
          <div className="eyebrow">UM POUCO DE MAGIA, TODOS OS DIAS</div>
          <h1>
            Sua criatividade
            <br />
            merece um ritual.
          </h1>
          <p>Um lápis, alguns minutos e um mundo inteiro para encantar.</p>
          <img
            src="/atelier.svg"
            alt="Bruxinha ilustradora com lápis mágico e gato preto"
          />
          <span className="handwritten">
            Pequenos desenhos. Grandes encantamentos.
          </span>
        </section>
        <section className="auth-form">
          <span className="eyebrow">
            {address(signup ? gender : "neutral").welcome}
          </span>
          <h2>{signup ? "Comece sua jornada" : "Que bom te ver por aqui."}</h2>
          <p>Seu próximo encantamento começa com um traço.</p>
          {!configured ? (
            <div role="alert" className="notice">
              Configure o arquivo .env com a URL e a chave pública do Supabase.
              Veja o README incluído no projeto.
            </div>
          ) : (
            <form onSubmit={auth}>
              {signup && (
                <label>
                  Seu nome mágico
                  <input
                    autoComplete="nickname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={40}
                    required
                  />
                </label>
              )}
              {signup && (
                <TreatmentSelect value={gender} onChange={setGender} />
              )}
              {signup && (
                <FamiliarEditor value={familiar} onChange={setFamiliar} />
              )}
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button disabled={busy || !online}>
                {busy
                  ? "Preparando…"
                  : signup
                    ? "Criar minha conta ✦"
                    : "Entrar no ateliê →"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setSignup(!signup);
                  setMessage("");
                }}
              >
                {signup ? "Já tenho uma conta" : "Ainda não tenho conta"}
              </button>
            </form>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <small>Seu progresso fica guardado na sua conta individual.</small>
        </section>
      </main>
    );
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/">
          ✦ Kwitch <em>Draw</em>
        </a>
        <div className="sidebar-title">SEU UNIVERSO CRIATIVO</div>
        <nav aria-label="Principal">
          {(isAdmin
            ? [...nav, ["admin", "⚙", "Administração"] as [Tab, string, string]]
            : nav
          ).map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id);
                setLessonOrigin(null);
                setSelectedLesson(null);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="familiar">
          <FamiliarAvatar familiar={savedFamiliar} />
          <strong>{savedFamiliar.familiar_name}</strong>
          <p>
            Um traço por vez.
            <br />
            <strong>A magia já está em você.</strong>
          </p>
        </div>
        <button className="logout" disabled={busy} onClick={logout}>
          Sair da conta ↗
        </button>
      </aside>
      <main className="workspace">
        <header>
          <span>O seu cantinho de criar e crescer</span>
          <div className="user-pill">
            <FamiliarAvatar
              familiar={savedFamiliar}
              className="name-familiar"
            />
            {profile?.display_name}{" "}
            <small> · Nível {profile?.level ?? 1}</small>
          </div>
        </header>
        {!online && (
          <div className="notice">
            Você está offline. Seus rituais precisam de conexão para iniciar e
            salvar.
          </div>
        )}
        {message && (
          <div className="notice" role="status">
            {message}
            <button
              className="dismiss"
              aria-label="Fechar aviso"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
        {tab === "home" && (
          <>
            <section className="welcome">
              <div>
                <div className="eyebrow">SEU RITUAL CRIATIVO</div>
                <h1>
                  Olá, {profile?.display_name ?? address(profile?.gender).alias}{" "}
                  <span>✧</span>
                </h1>
                <p>Vamos transformar um pouquinho do seu dia em magia?</p>
              </div>
              <span className="date">
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "numeric",
                  month: "long",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date())}
              </span>
            </section>
            <section className="stats">
              <article>
                <span>✦ Experiência</span>
                <strong>
                  {profile?.xp ?? 0} <small>XP</small>
                </strong>
                <progress
                  value={progress.earned}
                  max={progress.required}
                  aria-label="Progresso para o próximo nível"
                />
                <small>
                  {progress.remaining} XP para o nível {progress.level + 1}
                </small>
              </article>
              <article>
                <span>☽ Seu nível</span>
                <strong>{profile?.level ?? 1}</strong>
                <small>
                  {(profile?.level ?? 1) < 5
                    ? "Aprendiz de encantamentos"
                    : address(profile?.gender).artist}
                </small>
              </article>
              <article>
                <span>♨ Sequência criativa</span>
                <strong>
                  {effectiveStreak} <small>dias</small>
                </strong>
                <small>Um ritual por dia faz a magia crescer</small>
              </article>
            </section>
            <p className="muted">
              {todayHistory.length}/5 rituais com XP hoje · O dia criativo segue
              o horário de São Paulo.
            </p>
            <details className="progression-details">
              <summary>Como funcionam os níveis?</summary>
              <p>
                O nível 2 pede 150 XP acumulados. Cada próxima subida exige mais
                25 XP que a anterior. Seu XP continua guardado; desafios e
                desenhos enviados ajudam você a crescer.
              </p>
              <p>
                Nível 10: {xpForLevel(10).toLocaleString("pt-BR")} XP · Nível
                20: {xpForLevel(20).toLocaleString("pt-BR")} XP · Nível 50:{" "}
                {xpForLevel(50).toLocaleString("pt-BR")} XP.
              </p>
            </details>
            {dailyTip && (
              <section className="panel daily-tip">
                <div>
                  <div className="eyebrow">💡 DICA MÁGICA DO DIA</div>
                  <h2>{dailyTip.title}</h2>
                  <p>{dailyTip.summary}</p>
                  <button
                    className="secondary"
                    onClick={() => openLesson(dailyTip.id)}
                  >
                    Aprender e praticar →
                  </button>
                </div>
                <FamiliarAvatar familiar={savedFamiliar} />
              </section>
            )}
            {run && active ? (
              <section className="ritual panel" id={`challenge-${active.id}`}>
                <div className="eyebrow">
                  RITUAL EM ANDAMENTO ·{" "}
                  {run.status === "paused" ? "PAUSADO" : "TEMPO DE CRIAR"}
                </div>
                <h2>{active.title}</h2>
                <p>{active.prompt}</p>
                {recommendedTips(active.id)}
                <button
                  className="text-button"
                  onClick={() =>
                    setGuide({ challenge: active, kind: run!.kind })
                  }
                >
                  📖 Ver como desenhar
                </button>
                <div className="timer" aria-label="Tempo restante">
                  {clock(remaining)}
                </div>
                <p className="muted">
                  Conclua quando terminar o tempo. Seu resultado será guardado
                  na conta após o envio.
                </p>
                <div className="actions">
                  <button
                    disabled={busy || !online}
                    onClick={() =>
                      control(run.status === "paused" ? "resume" : "pause")
                    }
                  >
                    {run.status === "paused" ? "Retomar" : "Pausar"}
                  </button>
                  <button
                    disabled={remaining > 0 || busy || !online}
                    onClick={() => control("complete")}
                  >
                    Concluir · +{active.xp} XP
                  </button>
                  <button
                    disabled={busy}
                    className="text-button"
                    onClick={() => control("abandon")}
                  >
                    Abandonar ritual
                  </button>
                </div>
                <RitualWorkspace
                  key={`${user.id}:${run.id}`}
                  ref={workspace}
                  userId={user.id}
                  runId={run.id}
                  initialMode={workspaceMode}
                  disabled={busy}
                  paused={run.status === "paused"}
                />
                <button
                  className="workspace-complete"
                  disabled={remaining > 0 || busy || !online}
                  onClick={() => control("complete")}
                >
                  Concluir projeto · +{active.xp} XP
                </button>
              </section>
            ) : (
              <section className="daily panel">
                <div className="daily-copy">
                  <span className="eyebrow">✦ DESAFIO DO DIA</span>
                  {daily ? (
                    card(daily, "daily")
                  ) : (
                    <p>
                      Não foi possível carregar o desafio.{" "}
                      <button onClick={() => act(refresh)}>
                        Tentar novamente
                      </button>
                    </p>
                  )}
                </div>
                <img
                  src="/atelier.svg"
                  alt="Bruxinha criando estrelas com seu lápis mágico"
                />
              </section>
            )}
            <div className="section-title">
              <h2>Seu próximo capítulo</h2>
              <button
                className="text-button"
                onClick={() => setTab("grimoires")}
              >
                Ver todos os grimórios →
              </button>
            </div>
            <section className="book-grid">
              {grimoires.map((g) => {
                const steps = challenges.filter((c) => c.grimoire_id === g.id);
                const count = steps.filter((c) => done.has(c.id)).length;
                return (
                  <button
                    key={g.id}
                    className="book"
                    onClick={() => setTab("grimoires")}
                  >
                    <span className="book-icon">{g.icon}</span>
                    <h3>{g.title}</h3>
                    <p>{g.description}</p>
                    <progress value={count} max={steps.length || 1} />
                    <small>
                      {count}/{steps.length} rituais concluídos
                    </small>
                  </button>
                );
              })}
            </section>
            <footer>✧ Não precisa ser perfeito. Só precisa ser seu.</footer>
          </>
        )}
        {tab === "generator" && (
          <>
            <div className="welcome">
              <div>
                <div className="eyebrow">UM EMPURRÃOZINHO DO UNIVERSO</div>
                <h1>Gerador mágico ✧</h1>
                <p>Uma ideia nova para quando a página em branco assusta.</p>
              </div>
            </div>
            <section className="panel">
              <div className="filters">
                <label>
                  Categoria
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>Todas</option>
                    {[
                      ...new Set(
                        challenges
                          .filter((c) => c.channel === "standard")
                          .map((c) => c.category),
                      ),
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Dificuldade
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
                <button onClick={generate}>Sortear encantamento ✦</button>
              </div>
              {generated ? (
                card(generated, "random")
              ) : (
                <div className="empty">
                  <span>✧</span>
                  <h2>O que vamos criar hoje?</h2>
                  <p>
                    Escolha seus ingredientes e sorteie uma ideia do nosso
                    grimório.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
        {tab === "grimoires" && (
          <>
            <div className="welcome">
              <div>
                <div className="eyebrow">JORNADAS PARA EXPLORAR</div>
                <h1>Seus grimórios ▤</h1>
                <p>
                  Aprenda em pequenos capítulos. Cada ritual abre o próximo.
                </p>
              </div>
            </div>
            {grimoires.map((g) => {
              const steps = challenges
                .filter((c) => c.grimoire_id === g.id)
                .sort((a, b) => a.step! - b.step!);
              const next = steps.find((c) => !done.has(c.id));
              const count = steps.filter((c) => done.has(c.id)).length;
              return (
                <section className="panel journey" key={g.id}>
                  <div className="section-title">
                    <h2>
                      {g.icon} {g.title}
                    </h2>
                    <span>
                      {count}/{steps.length}
                    </span>
                  </div>
                  <p>{g.description}</p>
                  <progress value={count} max={steps.length || 1} />
                  <ol>
                    {steps.map((c) => (
                      <li
                        id={`challenge-${c.id}`}
                        key={c.id}
                        className={
                          done.has(c.id)
                            ? "done"
                            : next?.id === c.id
                              ? "next"
                              : "locked"
                        }
                      >
                        <span>{done.has(c.id) ? "✓" : c.step}</span>
                        <div>
                          <strong>{c.title}</strong>
                          {next?.id === c.id && (
                            <>
                              {recommendedTips(c.id)}
                              <button
                                className="text-button"
                                onClick={() =>
                                  setGuide({ challenge: c, kind: "journey" })
                                }
                              >
                                📖 Ver como desenhar
                              </button>
                            </>
                          )}
                          <small>
                            {c.duration_minutes} minutos · {c.xp} XP{" "}
                            {next?.id !== c.id && !done.has(c.id)
                              ? " · Bloqueado"
                              : ""}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {next ? (
                    card(next, "journey")
                  ) : (
                    <p className="success">
                      ✦ Grimório concluído. Que sua próxima aventura seja ainda
                      mais mágica!
                    </p>
                  )}
                </section>
              );
            })}
          </>
        )}
        {tab === "academy" && (
          <Academy
            lessons={lessons}
            steps={lessonSteps}
            progress={lessonProgress}
            level={profile?.level ?? 1}
            selected={selectedLesson}
            onSelect={(id) => {
              setSelectedLesson(id);
              if (!id) setLessonOrigin(null);
            }}
            returnTitle={lessonOrigin?.title}
            onReturn={
              lessonOrigin
                ? () => {
                    const origin = lessonOrigin;
                    setTab(
                      run?.challenge_id === origin.challengeId
                        ? "home"
                        : origin.tab,
                    );
                    setSelectedLesson(null);
                    setLessonOrigin(null);
                    requestAnimationFrame(() =>
                      document
                        .getElementById(`challenge-${origin.challengeId}`)
                        ?.scrollIntoView({ block: "center" }),
                    );
                  }
                : undefined
            }
            onRead={readLesson}
            onPractice={(c) => start(c, "practice")}
            busy={busy || !!run || !online || todayHistory.length >= 5}
            challenges={challenges}
            onGuide={(c) => setGuide({ challenge: c, kind: "practice" })}
          />
        )}
        {(["community", "support", "admin", "mine"] as Tab[]).includes(tab) && (
          <SocialArea
            key={`${user.id}:${tab}`}
            section={tab as "community" | "support" | "admin" | "mine"}
            userId={user.id}
            isAdmin={isAdmin}
            onChanged={refresh}
          />
        )}
        {tab === "spells" && (
          <>
            <div className="welcome">
              <div>
                <div className="eyebrow">
                  PEQUENAS VITÓRIAS, GRANDES PODERES
                </div>
                <h1>Meus feitiços ✦</h1>
                <p>Conquistas que celebram sua constância criativa.</p>
              </div>
            </div>
            <div className="spell-grid">
              {spells.map((s) => (
                <article
                  key={s.id}
                  className={`panel spell ${unlocked.includes(s.id) ? "earned" : ""}`}
                >
                  <span>{s.icon}</span>
                  <h2>
                    {s.id === "witch"
                      ? address(profile?.gender).witch
                      : s.id === "master"
                        ? address(profile?.gender).master
                        : s.title}
                  </h2>
                  <p>{s.description}</p>
                  <progress
                    value={Math.min(
                      s.required_practice_count
                        ? practicedCount
                        : history.length,
                      s.required_practice_count ?? s.required_count,
                    )}
                    max={s.required_count}
                  />
                  <small>
                    {unlocked.includes(s.id)
                      ? "✦ Feitiço desbloqueado"
                      : `${Math.min(s.required_practice_count ? practicedCount : history.length, s.required_practice_count ?? s.required_count)}/${s.required_count} ${s.required_practice_count ? "dicas diferentes" : "rituais"}`}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "profile" && (
          <>
            <div className="welcome">
              <div>
                <div className="eyebrow">A ARTISTA POR TRÁS DA MAGIA</div>
                <h1>Meu perfil ♡</h1>
              </div>
            </div>
            <section className="panel">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    const { error } = await db!
                      .from("profiles")
                      .update({
                        display_name: name.trim(),
                        gender,
                        ...familiar,
                        familiar_name: familiar.familiar_name.trim(),
                      })
                      .eq("id", user.id);
                    if (error) throw error;
                    await refresh();
                    setMessage("Perfil e familiar atualizados. ✨");
                  });
                }}
              >
                <label>
                  Seu nome mágico
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={40}
                    required
                  />
                </label>
                <TreatmentSelect value={gender} onChange={setGender} />
                <FamiliarEditor value={familiar} onChange={setFamiliar} />
                <button disabled={busy}>Salvar perfil</button>
              </form>
              <dl>
                <dt>E-mail</dt>
                <dd>{user.email}</dd>
                <dt>Seu ID individual</dt>
                <dd className="uuid">{user.id}</dd>
                <dt>No ateliê desde</dt>
                <dd>
                  {profile
                    ? new Date(profile.created_at).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
                <dt>Rituais concluídos</dt>
                <dd>{history.length}</dd>
              </dl>
              <button className="text-button" disabled={busy} onClick={logout}>
                Sair da minha conta ↗
              </button>
            </section>
            <h2>Histórico de encantamentos</h2>
            <p>
              Guarde uma foto ou imagem do seu desenho e ganhe +15 XP por
              desafio concluído. O bônus é concedido uma única vez por
              conclusão. Seus desenhos são privados.
            </p>
            <small>
              JPG, PNG ou WebP até 15 MB. O app reduz a imagem para até 1 MB
              antes de enviar.
            </small>
            {drawingView && (
              <section className="panel drawing-preview">
                <h3>{drawingView.title}</h3>
                <img
                  src={drawingView.url}
                  alt={`Desenho: ${drawingView.title}`}
                  referrerPolicy="no-referrer"
                />
                <button
                  className="text-button"
                  onClick={() => setDrawingView(null)}
                >
                  Fechar desenho
                </button>
              </section>
            )}
            <section className="panel history">
              {history.length ? (
                <ul>
                  {history.map((h) => (
                    <li key={h.id}>
                      <div>
                        <strong>
                          {challenges.find((c) => c.id === h.challenge_id)
                            ?.title ?? "Ritual"}
                        </strong>
                        <small>
                          {new Date(h.completed_at).toLocaleString("pt-BR")} ·{" "}
                          {clock(h.seconds)} ·{" "}
                          {h.kind === "daily"
                            ? "Diário"
                            : h.kind === "journey"
                              ? "Jornada"
                              : h.kind === "practice"
                                ? "Academia"
                                : "Gerador"}
                        </small>
                      </div>
                      <div className="drawing-actions">
                        <span>
                          +{h.xp + (h.drawing_bonus ?? 0)} XP{" "}
                          {h.drawing_bonus ? "(inclui +15 do desenho)" : ""}
                        </span>
                        {h.drawing_visibility === "removed" ? (
                          <span>Desenho removido · XP mantido</span>
                        ) : h.drawing_path ? (
                          <button
                            disabled={busy || !online}
                            onClick={() => viewDrawing(h)}
                          >
                            Ver meu desenho
                          </button>
                        ) : (
                          <div>
                            {(pendingDrafts.includes(h.run_id) ||
                              pendingFiles[h.run_id]) && (
                              <button
                                disabled={busy || !online}
                                onClick={() => retryDrawing(h)}
                              >
                                Salvar desenho pendente · +15 XP
                              </button>
                            )}
                            <label>
                              Enviar desenho · +15 XP
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={busy || !online}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (file) uploadDrawing(h, file);
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">
                  <h3>Seu primeiro capítulo está esperando.</h3>
                  <p>Conclua um ritual para começar seu histórico.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      {finishing && (
        <FinishDrawing
          key={finishing.runId}
          initialFile={finishing.file}
          busy={busy}
          onClose={() => setFinishing(null)}
          onConfirm={finishRitual}
        />
      )}
      {guide && (
        <ChallengeGuide
          challenge={guide.challenge}
          inProgress={run?.challenge_id === guide.challenge.id}
          onStart={
            !run || run.challenge_id === guide.challenge.id
              ? () => {
                  if (run) {
                    setTab("home");
                    setGuide(null);
                  } else {
                    start(guide.challenge, guide.kind);
                    setGuide(null);
                  }
                }
              : undefined
          }
          onClose={() => setGuide(null)}
        />
      )}
      {projectChoice && (
        <RitualChoice
          challenge={projectChoice.challenge}
          busy={busy}
          onChoose={beginProject}
          onClose={() => setProjectChoice(null)}
        />
      )}
    </div>
  );
}

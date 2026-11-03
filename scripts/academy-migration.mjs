import { readFile, writeFile } from "node:fs/promises";
const base = await readFile(
  new URL("../supabase/migrations/001_kwitch.sql", import.meta.url),
  "utf8",
);
let start = base.slice(
  base.indexOf("create function public.start_challenge"),
  base.indexOf("create function public.control_run"),
);
start = start
  .replace("create function", "create or replace function")
  .replace("daily_id integer;", "daily_id integer; learner_level integer;")
  .replace(
    "perform 1 from public.profiles where id=u for update;",
    "select level into learner_level from public.profiles where id=u for update;",
  )
  .replace(
    "if not found or p_kind not in ('daily','random','journey')",
    "if not found or p_kind is null or p_kind not in ('daily','random','journey','practice')",
  )
  .replace(
    "if p_kind='daily' then",
    "if p_kind='practice' then\n  if c.channel<>'academy' or not exists(select 1 from public.lessons l where l.practice_challenge_id=c.id and l.status='published' and l.min_level<=learner_level) then raise exception 'Prática bloqueada para seu nível ou indisponível.'; end if;\n elsif p_kind='daily' then",
  )
  .replace(
    "if c.id<>daily_id or",
    "if c.channel<>'standard' or daily_id is null or c.id<>daily_id or",
  )
  .replace(
    "if c.grimoire_id is null or exists",
    "if c.channel<>'journey' or c.grimoire_id is null or exists",
  )
  .replace(
    "elsif c.grimoire_id is not null then raise exception 'Use a jornada para este desafio.';",
    "elsif c.channel<>'standard' or c.grimoire_id is not null then raise exception 'Use a aula ou jornada para este desafio.';",
  );
let control = base.slice(
  base.indexOf("create function public.control_run"),
  base.indexOf("revoke execute on function public.on_signup"),
);
control = control
  .replace("create function", "create or replace function")
  .replace(
    "n integer;",
    "n integer; learner_level integer; practice_count integer; practice_lesson_id text;",
  )
  .replace(
    "perform 1 from public.profiles where id=u for update;",
    "select level into learner_level from public.profiles where id=u for update;",
  )
  .replace(
    "if total<c.duration_minutes*60",
    "if r.kind='practice' then\n   select id into practice_lesson_id from public.lessons where practice_challenge_id=c.id and status='published' and min_level<=learner_level;\n   if not found then raise exception 'Esta prática está indisponível.'; end if;\n  end if;\n  if total<c.duration_minutes*60",
  )
  .replace(
    "select count(*) into n from public.completions where user_id=u;",
    "if r.kind='practice' then\n   insert into public.user_lesson_progress(user_id,lesson_id,practice_completed_at) values(u,practice_lesson_id,now())\n   on conflict(user_id,lesson_id) do update set practice_completed_at=coalesce(public.user_lesson_progress.practice_completed_at,excluded.practice_completed_at);\n  end if;\n  select count(*) into n from public.completions where user_id=u;\n  select count(distinct challenge_id) into practice_count from public.completions where user_id=u and kind='practice';",
  )
  .replace(
    "where required_count<=n on conflict",
    "where required_count<=n and (required_practice_count is null or required_practice_count<=practice_count) on conflict",
  );
const schema = `-- Academy: no second XP ledger. Practices use the existing timer and completion rules.
begin;
alter table public.challenges add column channel text not null default 'standard' check(channel in ('standard','journey','academy'));
update public.challenges set channel='journey' where grimoire_id is not null;
alter table public.challenges add constraint challenge_channel_consistent check((channel='journey')=(grimoire_id is not null));
alter table public.challenge_runs drop constraint challenge_runs_kind_check;
alter table public.challenge_runs add constraint challenge_runs_kind_check check(kind in ('daily','random','journey','practice'));
alter table public.completions add constraint completions_kind_check check(kind in ('daily','random','journey','practice'));
alter table public.achievements add column required_practice_count integer check(required_practice_count>0);

create table public.lessons(
 id text primary key, title text not null, category text not null,
 difficulty text not null check(difficulty in ('iniciante','intermediário','avançado')),
 format text not null check(format in ('lesson','quick_tip')), summary text not null,
 min_level integer not null default 1 check(min_level between 1 and 1000),
 reading_seconds integer not null check(reading_seconds between 30 and 600),
 sort_order integer not null, status text not null default 'published' check(status in ('draft','published')),
 practice_challenge_id integer not null unique references public.challenges(id)
);
create table public.lesson_steps(
 lesson_id text references public.lessons(id) on delete cascade,
 step integer not null check(step between 1 and 3), title text not null, explanation text not null,
 diagram_key text not null check(diagram_key in ('fundamentos','rostos','olhos','cabelos','maos','anatomia','poses','perspectiva','luz','cores','roupas','animais','cenarios','digital')),
 primary key(lesson_id,step)
);
create table public.user_lesson_progress(
 user_id uuid references public.profiles(id) on delete cascade,
 lesson_id text references public.lessons(id) on delete cascade,
 read_at timestamptz, practice_completed_at timestamptz, primary key(user_id,lesson_id)
);
create table public.challenge_lessons(
 challenge_id integer references public.challenges(id) on delete cascade,
 lesson_id text references public.lessons(id) on delete cascade,
 priority integer not null check(priority>0), primary key(challenge_id,lesson_id)
);
alter table public.lessons enable row level security;
alter table public.lesson_steps enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.challenge_lessons enable row level security;
create policy published_lessons on public.lessons for select to authenticated using(status='published');
create policy unlocked_lesson_steps on public.lesson_steps for select to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published' and l.min_level<=(select level from public.profiles where id=(select auth.uid()))));
create policy own_lesson_progress on public.user_lesson_progress for select to authenticated using(user_id=(select auth.uid()));
create policy published_recommendations on public.challenge_lessons for select to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published'));
drop policy catalog_challenges on public.challenges;
create policy catalog_challenges on public.challenges for select to authenticated using(channel<>'academy' or exists(select 1 from public.lessons l where l.practice_challenge_id=public.challenges.id and l.status='published' and l.min_level<=(select level from public.profiles where id=(select auth.uid()))));
revoke all on public.lessons,public.lesson_steps,public.user_lesson_progress,public.challenge_lessons from anon,authenticated;
grant select on public.lessons,public.lesson_steps,public.user_lesson_progress,public.challenge_lessons to authenticated;

create or replace function public.daily_challenge() returns setof public.challenges language sql stable security invoker set search_path='' as $$
 select * from public.challenges where channel='standard' order by id
 offset mod(((now() at time zone 'America/Sao_Paulo')::date-date '2026-01-01')::integer+365000,nullif((select count(*)::integer from public.challenges where channel='standard'),0)) limit 1
$$;
create function public.daily_tip() returns setof public.lessons language sql stable security invoker set search_path='' as $$
 select * from public.lessons where status='published' and min_level<=(select level from public.profiles where id=auth.uid()) order by sort_order,id
 offset mod(((now() at time zone 'America/Sao_Paulo')::date-date '2026-01-01')::integer+365000,nullif((select count(*)::integer from public.lessons where status='published' and min_level<=(select level from public.profiles where id=auth.uid())),0)) limit 1
$$;
create function public.mark_lesson_read(p_lesson_id text) returns public.user_lesson_progress language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.user_lesson_progress;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 if not exists(select 1 from public.lessons l join public.profiles me on me.id=u where l.id=p_lesson_id and l.status='published' and l.min_level<=me.level) then raise exception 'Dica bloqueada ou indisponível.'; end if;
 insert into public.user_lesson_progress(user_id,lesson_id,read_at) values(u,p_lesson_id,now())
 on conflict(user_id,lesson_id) do update set read_at=coalesce(public.user_lesson_progress.read_at,excluded.read_at) returning * into p;
 return p;
end $$;
`;
const tail = `
revoke execute on function public.daily_tip(),public.mark_lesson_read(text) from public,anon;
grant execute on function public.daily_tip(),public.mark_lesson_read(text) to authenticated;
notify pgrst,'reload schema';
commit;
`;
await writeFile(
  new URL("../supabase/migrations/005_academy.sql", import.meta.url),
  schema + start + control + tail,
);
console.log("Academy migration generated.");

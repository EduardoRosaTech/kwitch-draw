-- Academy: no second XP ledger. Practices use the existing timer and completion rules.
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
create or replace function public.start_challenge(p_challenge_id integer,p_kind text) returns public.challenge_runs language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.challenges; r public.challenge_runs; today date:=(now() at time zone 'America/Sao_Paulo')::date; daily_id integer; learner_level integer;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 select level into learner_level from public.profiles where id=u for update;
 select * into c from public.challenges where id=p_challenge_id;
 if not found or p_kind is null or p_kind not in ('daily','random','journey','practice') then raise exception 'Desafio inválido.'; end if;
 if exists(select 1 from public.challenge_runs where user_id=u and status in ('active','paused')) then raise exception 'Conclua ou abandone o ritual atual.'; end if;
 if exists(select 1 from public.completions where user_id=u and challenge_id=c.id and completed_on=today) then raise exception 'Você já recebeu XP por este desafio hoje.'; end if;
 if (select count(*) from public.completions where user_id=u and completed_on=today)>=5 then raise exception 'Limite de cinco rituais com XP por dia atingido.'; end if;
 if p_kind='practice' then
  if c.channel<>'academy' or not exists(select 1 from public.lessons l where l.practice_challenge_id=c.id and l.status='published' and l.min_level<=learner_level) then raise exception 'Prática bloqueada para seu nível ou indisponível.'; end if;
 elsif p_kind='daily' then
  select id into daily_id from public.daily_challenge();
  if c.channel<>'standard' or daily_id is null or c.id<>daily_id or exists(select 1 from public.completions where user_id=u and kind='daily' and completed_on=today) then raise exception 'Ritual diário indisponível.'; end if;
 elsif p_kind='journey' then
  if c.channel<>'journey' or c.grimoire_id is null or exists(select 1 from public.completions where user_id=u and challenge_id=c.id) or exists(select 1 from public.challenges prev where prev.grimoire_id=c.grimoire_id and prev.step<c.step and not exists(select 1 from public.completions h where h.user_id=u and h.challenge_id=prev.id)) then raise exception 'Siga a ordem do grimório.'; end if;
 elsif c.channel<>'standard' or c.grimoire_id is not null then raise exception 'Use a aula ou jornada para este desafio.';
 end if;
 insert into public.challenge_runs(user_id,challenge_id,kind) values(u,c.id,p_kind) returning * into r;
 return r;
end $$;

create or replace function public.control_run(p_run_id uuid,p_action text) returns public.challenge_runs language plpgsql security definer set search_path='' as $$
declare r public.challenge_runs; c public.challenges; u uuid:=auth.uid(); today date:=(now() at time zone 'America/Sao_Paulo')::date; total integer; n integer; learner_level integer; practice_count integer; practice_lesson_id text;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 select level into learner_level from public.profiles where id=u for update;
 select * into r from public.challenge_runs where id=p_run_id and user_id=u for update;
 if not found then raise exception 'Ritual não encontrado.'; end if;
 if r.status='completed' and p_action='complete' then return r; end if;
 if r.status not in ('active','paused') then raise exception 'Ritual encerrado.'; end if;
 total:=r.accumulated_seconds+case when r.status='active' then greatest(0,floor(extract(epoch from now()-r.active_since))::integer) else 0 end;
 if p_action='pause' and r.status='active' then
  update public.challenge_runs set status='paused',accumulated_seconds=total,active_since=null where id=r.id returning * into r;
 elsif p_action='resume' and r.status='paused' then
  update public.challenge_runs set status='active',active_since=now() where id=r.id returning * into r;
 elsif p_action='abandon' then
  update public.challenge_runs set status='abandoned',accumulated_seconds=total,active_since=null where id=r.id returning * into r;
 elsif p_action='complete' then
  select * into c from public.challenges where id=r.challenge_id;
  if r.kind='practice' then
   select id into practice_lesson_id from public.lessons where practice_challenge_id=c.id and status='published' and min_level<=learner_level;
   if not found then raise exception 'Esta prática está indisponível.'; end if;
  end if;
  if total<c.duration_minutes*60 then raise exception 'Continue seu desenho até completar o tempo do ritual.'; end if;
  if r.kind='daily' and (r.started_at at time zone 'America/Sao_Paulo')::date<>today then raise exception 'O ritual diário expirou. Abandone e abra o de hoje.'; end if;
  if (select count(*) from public.completions where user_id=u and completed_on=today)>=5 then raise exception 'Limite de XP diário atingido.'; end if;
  insert into public.completions(user_id,run_id,challenge_id,kind,xp,seconds,completed_on) values(u,r.id,c.id,r.kind,c.xp,total,today);
  update public.profiles set xp=xp+c.xp,streak=case when last_completed_on=today then streak when last_completed_on=today-1 then streak+1 else 1 end,last_completed_on=today where id=u;
  update public.challenge_runs set status='completed',accumulated_seconds=total,active_since=null where id=r.id returning * into r;
  if r.kind='practice' then
   insert into public.user_lesson_progress(user_id,lesson_id,practice_completed_at) values(u,practice_lesson_id,now())
   on conflict(user_id,lesson_id) do update set practice_completed_at=coalesce(public.user_lesson_progress.practice_completed_at,excluded.practice_completed_at);
  end if;
  select count(*) into n from public.completions where user_id=u;
  select count(distinct challenge_id) into practice_count from public.completions where user_id=u and kind='practice';
  insert into public.user_achievements(user_id,achievement_id) select u,id from public.achievements where required_count<=n and (required_practice_count is null or required_practice_count<=practice_count) on conflict do nothing;
 else raise exception 'Ação inválida para o estado do ritual.';
 end if;
 return r;
end $$;

revoke execute on function public.daily_tip(),public.mark_lesson_read(text) from public,anon;
grant execute on function public.daily_tip(),public.mark_lesson_read(text) to authenticated;
notify pgrst,'reload schema';
commit;

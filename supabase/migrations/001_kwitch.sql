begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Bruxinha' check(char_length(display_name) between 2 and 40),
 xp integer not null default 0 check(xp>=0),
 level integer generated always as (1+xp/100) stored,
 streak integer not null default 0,
 last_completed_on date,
 created_at timestamptz not null default now()
);
create table public.grimoires(id text primary key,title text not null,description text not null,icon text not null);
create table public.challenges(
 id integer primary key, title text not null, prompt text not null,
 category text not null, difficulty text not null check(difficulty in ('iniciante','intermediário','avançado')),
 duration_minutes integer not null check(duration_minutes between 1 and 120),
 xp integer not null check(xp between 1 and 100),
 grimoire_id text references public.grimoires(id), step integer,
 check((grimoire_id is null and step is null) or (grimoire_id is not null and step>0)),
 unique(grimoire_id,step)
);
create table public.challenge_runs(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 challenge_id integer not null references public.challenges(id), kind text not null check(kind in ('daily','random','journey')),
 started_at timestamptz not null default now(), active_since timestamptz default now(),
 accumulated_seconds integer not null default 0, status text not null default 'active' check(status in ('active','paused','completed','abandoned'))
);
create unique index one_open_run on public.challenge_runs(user_id) where status in ('active','paused');
create table public.completions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 run_id uuid not null unique references public.challenge_runs(id), challenge_id integer not null references public.challenges(id),
 kind text not null, xp integer not null, seconds integer not null,
 completed_at timestamptz not null default now(), completed_on date not null,
 unique(user_id,challenge_id,completed_on)
);
create unique index one_daily_reward on public.completions(user_id,completed_on) where kind='daily';
create table public.achievements(id text primary key,title text not null,description text not null,icon text not null,required_count integer not null);
create table public.user_achievements(user_id uuid references public.profiles(id) on delete cascade,achievement_id text references public.achievements(id),unlocked_at timestamptz not null default now(),primary key(user_id,achievement_id));
create index completions_owner on public.completions(user_id,completed_at desc);
create function public.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Bruxinha'),40));
 return new;
end $$;
create trigger create_profile after insert on auth.users for each row execute function public.on_signup();
alter table public.profiles enable row level security;
alter table public.grimoires enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_runs enable row level security;
alter table public.completions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy edit_name on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_runs on public.challenge_runs for select to authenticated using(user_id=(select auth.uid()));
create policy own_history on public.completions for select to authenticated using(user_id=(select auth.uid()));
create policy own_spells on public.user_achievements for select to authenticated using(user_id=(select auth.uid()));
create policy catalog_grimoires on public.grimoires for select to authenticated using(true);
create policy catalog_challenges on public.challenges for select to authenticated using(true);
create policy catalog_achievements on public.achievements for select to authenticated using(true);
revoke all on public.profiles,public.grimoires,public.challenges,public.challenge_runs,public.completions,public.achievements,public.user_achievements from anon,authenticated;
grant select on public.profiles,public.grimoires,public.challenges,public.challenge_runs,public.completions,public.achievements,public.user_achievements to authenticated;
grant update(display_name) on public.profiles to authenticated;

create function public.daily_challenge() returns setof public.challenges language sql stable security invoker set search_path='' as $$
 select * from public.challenges where grimoire_id is null order by id
 offset mod(((now() at time zone 'America/Sao_Paulo')::date-date '2026-01-01')::integer+365000,(select count(*)::integer from public.challenges where grimoire_id is null)) limit 1
$$;

create function public.start_challenge(p_challenge_id integer,p_kind text) returns public.challenge_runs language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.challenges; r public.challenge_runs; today date:=(now() at time zone 'America/Sao_Paulo')::date; daily_id integer;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 perform 1 from public.profiles where id=u for update;
 select * into c from public.challenges where id=p_challenge_id;
 if not found or p_kind not in ('daily','random','journey') then raise exception 'Desafio inválido.'; end if;
 if exists(select 1 from public.challenge_runs where user_id=u and status in ('active','paused')) then raise exception 'Conclua ou abandone o ritual atual.'; end if;
 if exists(select 1 from public.completions where user_id=u and challenge_id=c.id and completed_on=today) then raise exception 'Você já recebeu XP por este desafio hoje.'; end if;
 if (select count(*) from public.completions where user_id=u and completed_on=today)>=5 then raise exception 'Limite de cinco rituais com XP por dia atingido.'; end if;
 if p_kind='daily' then
  select id into daily_id from public.daily_challenge();
  if c.id<>daily_id or exists(select 1 from public.completions where user_id=u and kind='daily' and completed_on=today) then raise exception 'Ritual diário indisponível.'; end if;
 elsif p_kind='journey' then
  if c.grimoire_id is null or exists(select 1 from public.completions where user_id=u and challenge_id=c.id) or exists(select 1 from public.challenges prev where prev.grimoire_id=c.grimoire_id and prev.step<c.step and not exists(select 1 from public.completions h where h.user_id=u and h.challenge_id=prev.id)) then raise exception 'Siga a ordem do grimório.'; end if;
 elsif c.grimoire_id is not null then raise exception 'Use a jornada para este desafio.';
 end if;
 insert into public.challenge_runs(user_id,challenge_id,kind) values(u,c.id,p_kind) returning * into r;
 return r;
end $$;

create function public.control_run(p_run_id uuid,p_action text) returns public.challenge_runs language plpgsql security definer set search_path='' as $$
declare r public.challenge_runs; c public.challenges; u uuid:=auth.uid(); today date:=(now() at time zone 'America/Sao_Paulo')::date; total integer; n integer;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 perform 1 from public.profiles where id=u for update;
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
  if total<c.duration_minutes*60 then raise exception 'Continue seu desenho até completar o tempo do ritual.'; end if;
  if r.kind='daily' and (r.started_at at time zone 'America/Sao_Paulo')::date<>today then raise exception 'O ritual diário expirou. Abandone e abra o de hoje.'; end if;
  if (select count(*) from public.completions where user_id=u and completed_on=today)>=5 then raise exception 'Limite de XP diário atingido.'; end if;
  insert into public.completions(user_id,run_id,challenge_id,kind,xp,seconds,completed_on) values(u,r.id,c.id,r.kind,c.xp,total,today);
  update public.profiles set xp=xp+c.xp,streak=case when last_completed_on=today then streak when last_completed_on=today-1 then streak+1 else 1 end,last_completed_on=today where id=u;
  update public.challenge_runs set status='completed',accumulated_seconds=total,active_since=null where id=r.id returning * into r;
  select count(*) into n from public.completions where user_id=u;
  insert into public.user_achievements(user_id,achievement_id) select u,id from public.achievements where required_count<=n on conflict do nothing;
 else raise exception 'Ação inválida para o estado do ritual.';
 end if;
 return r;
end $$;
revoke execute on function public.on_signup(),public.daily_challenge(),public.start_challenge(integer,text),public.control_run(uuid,text) from public,anon;
grant execute on function public.daily_challenge(),public.start_challenge(integer,text),public.control_run(uuid,text) to authenticated;
commit;

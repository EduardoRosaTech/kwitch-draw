begin;
-- Roles are provisioned only from the trusted SQL console, never signup metadata.
create table public.app_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon,authenticated;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.app_admins where user_id=auth.uid())$$;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;

alter table public.completions add column drawing_visibility text not null default 'private' check(drawing_visibility in ('private','public','removed'));
alter table public.completions add column moderated boolean not null default false;
alter table public.completions drop constraint drawing_reward_consistent;
alter table public.completions add constraint drawing_reward_consistent check((drawing_path is null and drawing_bonus=0) or (drawing_bonus=15 and drawing_path in (user_id::text||'/'||id::text||'.webp',user_id::text||'/'||run_id::text||'.webp')));

-- Keep the old reward algorithm private, including its timer, cap and journey checks.
alter function public.control_run(uuid,text) rename to reward_run_internal;
revoke all on function public.reward_run_internal(uuid,text) from public,anon,authenticated;
create function public.control_run(p_run_id uuid,p_action text) returns public.challenge_runs language plpgsql security definer set search_path='' as $$
begin
 if p_action='complete' then raise exception 'Envie e confirme seu desenho para concluir.'; end if;
 return public.reward_run_internal(p_run_id,p_action);
end $$;
revoke all on function public.control_run(uuid,text) from public,anon;
grant execute on function public.control_run(uuid,text) to authenticated;

create function public.finish_with_drawing(p_run_id uuid,p_public boolean default false) returns public.completions language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.challenge_runs; c public.completions; path text;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 perform 1 from public.profiles where id=u for update;
 select * into r from public.challenge_runs where id=p_run_id and user_id=u for update;
 if not found then raise exception 'Ritual não encontrado.'; end if;
 if r.status='completed' then select * into c from public.completions where run_id=r.id and user_id=u; return c; end if;
 path:=u::text||'/'||r.id::text||'.webp';
 if not exists(select 1 from storage.objects where bucket_id='drawings' and name=path and owner_id=u::text and metadata->>'mimetype'='image/webp' and (metadata->>'size')::bigint between 1 and 1048576)
 then raise exception 'Envie uma imagem válida antes de concluir. Nenhum XP foi concedido.'; end if;
 perform public.reward_run_internal(r.id,'complete');
 update public.completions set drawing_path=path,drawing_bonus=15,drawing_visibility=case when p_public then 'public' else 'private' end where run_id=r.id and user_id=u returning * into c;
 update public.profiles set xp=xp+15 where id=u;
 return c;
end $$;
revoke all on function public.finish_with_drawing(uuid,boolean) from public,anon;
grant execute on function public.finish_with_drawing(uuid,boolean) to authenticated;

create function public.can_upload_run(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.challenge_runs r where r.user_id=auth.uid() and r.status in ('active','paused') and p_name=r.user_id::text||'/'||r.id::text||'.webp')
 and (select count(*) from storage.objects o join public.challenge_runs r on o.name=r.user_id::text||'/'||r.id::text||'.webp' where o.bucket_id='drawings' and r.user_id=auth.uid() and r.started_at>=date_trunc('day',now()))<10
$$;
revoke all on function public.can_upload_run(text) from public,anon;
grant execute on function public.can_upload_run(text) to authenticated;
drop policy drawings_owned_read on storage.objects;
drop policy drawings_completed_upload on storage.objects;
create function public.drawing_is_public(p_name text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.completions where drawing_path=p_name and drawing_visibility='public' and not moderated)$$;
revoke all on function public.drawing_is_public(text) from public,anon;
grant execute on function public.drawing_is_public(text) to authenticated;
create policy drawings_visible_read on storage.objects for select to authenticated using(bucket_id='drawings' and (
 public.is_admin() or
 (owner_id=auth.uid()::text and not exists(select 1 from public.completions c where c.drawing_path=name and c.drawing_visibility='removed')) or
 public.drawing_is_public(name)
));
create policy drawings_valid_upload on storage.objects for insert to authenticated with check(bucket_id='drawings' and owner_id=auth.uid()::text and (public.can_upload_run(name) or exists(select 1 from public.completions c where c.user_id=auth.uid() and c.drawing_path is null and c.drawing_visibility<>'removed' and name=c.user_id::text||'/'||c.id::text||'.webp')));
create policy drawings_pending_delete on storage.objects for delete to authenticated using(bucket_id='drawings' and owner_id=auth.uid()::text and exists(select 1 from public.challenge_runs r where r.user_id=auth.uid() and r.status in ('active','paused') and name=r.user_id::text||'/'||r.id::text||'.webp') and not exists(select 1 from public.completions c where c.user_id=auth.uid() and c.drawing_path=name));

create function public.set_drawing_visibility(p_id uuid,p_visibility text) returns void language plpgsql security definer set search_path='' as $$
declare c public.completions; u uuid:=auth.uid(); a boolean:=public.is_admin();
begin
 if u is null or p_visibility not in ('public','private','removed') then raise exception 'Ação inválida.'; end if;
 select * into c from public.completions where id=p_id for update;
 if not found or c.drawing_path is null or (c.user_id<>u and not a) then raise exception 'Desenho indisponível.'; end if;
 if c.user_id<>u and (p_visibility<>'removed' or c.drawing_visibility<>'public') then raise exception 'A moderação pode remover somente publicações públicas.'; end if;
 if c.moderated and p_visibility<>'removed' then raise exception 'Esta publicação foi removida pela moderação.'; end if;
 update public.completions set drawing_visibility=p_visibility,moderated=moderated or (a and c.user_id<>u and p_visibility='removed') where id=p_id;
 -- A soft removal retains completion, earned XP and file for recovery/audit.
end $$;
revoke all on function public.set_drawing_visibility(uuid,text) from public,anon;
grant execute on function public.set_drawing_visibility(uuid,text) to authenticated;

create function public.list_drawings(p_scope text default 'community',p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or p_scope not in ('community','mine','admin') or p_page<0 or p_page>10000 then raise exception 'Consulta inválida.'; end if;
 if p_scope='admin' and not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 return coalesce((select jsonb_agg(x) from (select c.id,c.user_id,c.drawing_path,c.drawing_visibility,c.moderated,c.completed_at,c.challenge_id,h.title as challenge_title,p.display_name,p.familiar_kind,p.familiar_tone,p.familiar_charm,p.familiar_name
 from public.completions c join public.profiles p on p.id=c.user_id join public.challenges h on h.id=c.challenge_id
 where c.drawing_path is not null and case when p_scope='mine' then c.user_id=auth.uid() and c.drawing_visibility<>'removed' else c.drawing_visibility='public' and not c.moderated end
 order by c.completed_at desc,c.id limit 24 offset p_page*24)x),'[]'::jsonb);
end $$;
revoke all on function public.list_drawings(text,integer) from public,anon;
grant execute on function public.list_drawings(text,integer) to authenticated;

create table public.support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,category text not null check(category in ('Dúvida','Sugestão','Problema/Bug','Outro')),subject text not null check(length(subject) between 3 and 120),status text not null default 'new' check(status in ('new','answered','resolved')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.support_messages(id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id) on delete cascade,author_id uuid not null references auth.users(id) on delete cascade,is_staff boolean not null,body text not null check(length(body) between 1 and 3000),created_at timestamptz not null default now());
create table public.drawing_reports(id uuid primary key default gen_random_uuid(),drawing_id uuid not null references public.completions(id) on delete cascade,reporter_id uuid not null references auth.users(id) on delete cascade,reason text not null check(length(reason) between 3 and 1000),status text not null default 'new' check(status in ('new','resolved')),created_at timestamptz not null default now(),unique(drawing_id,reporter_id));
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.drawing_reports enable row level security;
grant select on public.support_tickets,public.support_messages,public.drawing_reports to authenticated;
revoke insert,update,delete on public.support_tickets,public.support_messages,public.drawing_reports from authenticated,anon;
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy messages_read on public.support_messages for select to authenticated using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.is_admin())));
create policy reports_read on public.drawing_reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin());
create index tickets_owner on public.support_tickets(user_id,created_at desc);
create index messages_ticket on public.support_messages(ticket_id,created_at);
create index community_drawings on public.completions(completed_at desc) where drawing_visibility='public';

create function public.create_ticket(p_category text,p_subject text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 perform 1 from public.profiles where id=u for update;
 if (select count(*) from public.support_tickets where user_id=u and created_at>now()-interval '1 day')>=5 then raise exception 'Limite de cinco solicitações por dia.'; end if;
 insert into public.support_tickets(user_id,category,subject) values(u,p_category,trim(p_subject)) returning id into result;
 insert into public.support_messages(ticket_id,author_id,is_staff,body) values(result,u,false,trim(p_body));
 return result;
end $$;
create function public.reply_ticket(p_id uuid,p_body text) returns void language plpgsql security definer set search_path='' as $$
declare t public.support_tickets; a boolean:=public.is_admin(); u uuid:=auth.uid();
begin
 select * into t from public.support_tickets where id=p_id for update;
 if u is null or not found or (t.user_id<>u and not a) then raise exception 'Atendimento indisponível.'; end if;
 if (select count(*) from public.support_messages where ticket_id=p_id and author_id=u and created_at>now()-interval '1 hour')>=20 then raise exception 'Aguarde antes de enviar novas mensagens.'; end if;
 insert into public.support_messages(ticket_id,author_id,is_staff,body) values(p_id,u,a,trim(p_body));
 update public.support_tickets set status=case when a then 'answered' else 'new' end,updated_at=now() where id=p_id;
end $$;
create function public.resolve_ticket(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
 update public.support_tickets set status='resolved',updated_at=now() where id=p_id and (user_id=auth.uid() or public.is_admin());
 if not found then raise exception 'Atendimento indisponível.'; end if;
end $$;
create function public.report_drawing(p_id uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not exists(select 1 from public.completions where id=p_id and drawing_visibility='public') then raise exception 'Publicação indisponível.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if (select count(*) from public.drawing_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Limite de denúncias por dia.'; end if;
 insert into public.drawing_reports(drawing_id,reporter_id,reason) values(p_id,auth.uid(),trim(p_reason)) on conflict(drawing_id,reporter_id) do nothing;
end $$;
create function public.resolve_report(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 update public.drawing_reports set status='resolved' where id=p_id;
end $$;
create function public.admin_overview(p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not public.is_admin() or p_page<0 or p_page>10000 then raise exception 'Acesso administrativo necessário.'; end if;
 return jsonb_build_object('users',(select count(*) from public.profiles),'rituals',(select count(*) from public.completions),'active_week',(select count(distinct user_id) from public.completions where completed_at>now()-interval '7 days'),'public_drawings',(select count(*) from public.completions where drawing_visibility='public'),'open_tickets',(select count(*) from public.support_tickets where status<>'resolved'),'new_reports',(select count(*) from public.drawing_reports where status='new'),'members',coalesce((select jsonb_agg(x) from (select p.id,p.display_name,p.level,p.xp,p.created_at,u.email from public.profiles p join auth.users u on u.id=p.id order by p.created_at desc limit 25 offset p_page*25)x),'[]'::jsonb));
end $$;
revoke all on function public.create_ticket(text,text,text),public.reply_ticket(uuid,text),public.resolve_ticket(uuid),public.report_drawing(uuid,text),public.resolve_report(uuid),public.admin_overview(integer) from public,anon;
grant execute on function public.create_ticket(text,text,text),public.reply_ticket(uuid,text),public.resolve_ticket(uuid),public.report_drawing(uuid,text),public.resolve_report(uuid),public.admin_overview(integer) to authenticated;
create function public.admin_reports(p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not public.is_admin() or p_page<0 or p_page>10000 then raise exception 'Acesso administrativo necessário.'; end if;
 return coalesce((select jsonb_agg(x) from (select r.id,r.drawing_id,r.reason,r.status,r.created_at,c.drawing_path,c.drawing_visibility from public.drawing_reports r join public.completions c on c.id=r.drawing_id order by r.created_at desc limit 25 offset p_page*25)x),'[]'::jsonb);
end $$;
revoke all on function public.admin_reports(integer) from public,anon;
grant execute on function public.admin_reports(integer) to authenticated;
notify pgrst,'reload schema';
commit;

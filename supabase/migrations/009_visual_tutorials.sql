begin;
create table public.visual_tutorials(
 id uuid primary key default gen_random_uuid(), challenge_id integer unique references public.challenges(id),lesson_id text unique references public.lessons(id),
 title text not null default '',intro text not null default '',palette jsonb not null default '[]',final_image text,tips text not null default '',
 published boolean not null default false,draft jsonb,revision integer not null default 0,updated_at timestamptz not null default now(),
 check(num_nonnulls(challenge_id,lesson_id)=1)
);
create table public.tutorial_steps(tutorial_id uuid references public.visual_tutorials(id) on delete cascade,position integer not null check(position between 1 and 40),title text not null,description text not null,image text not null,type text not null check(type in ('reference','construction','sketch','lineart','color','detail','final')),tip text not null default '',primary key(tutorial_id,position));
create table public.tutorial_asset_manifest(path text primary key);
alter table public.visual_tutorials enable row level security;
alter table public.tutorial_steps enable row level security;
alter table public.tutorial_asset_manifest enable row level security;
revoke all on public.visual_tutorials,public.tutorial_steps,public.tutorial_asset_manifest from anon,authenticated;
-- Viewer RPCs omit drafts entirely. Editing a draft does not change the published guide.
create function public.can_read_visual_tutorial(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.visual_tutorials t where t.id=p_id and (public.is_admin() or (t.published and
 ((t.lesson_id is not null and exists(select 1 from public.lessons l join public.profiles p on p.id=auth.uid() where l.id=t.lesson_id and l.status='published' and l.min_level<=p.level)) or
 (t.challenge_id is not null and exists(select 1 from public.challenges c where c.id=t.challenge_id and (c.channel<>'academy' or exists(select 1 from public.lessons l join public.profiles p on p.id=auth.uid() where l.practice_challenge_id=c.id and l.status='published' and l.min_level<=p.level))))))))
$$;
create function public.visual_tutorial_payload(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('title',t.title,'intro',t.intro,'palette',t.palette,'final_image',t.final_image,'tips',t.tips,'steps',coalesce((select jsonb_agg(jsonb_build_object('title',s.title,'description',s.description,'image',s.image,'type',s.type,'tip',s.tip) order by s.position) from public.tutorial_steps s where s.tutorial_id=t.id),'[]'::jsonb)) from public.visual_tutorials t where t.id=p_id$$;
create function public.get_visual_tutorial(p_challenge_id integer default null,p_lesson_id text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$declare t public.visual_tutorials;begin
 if auth.uid() is null or num_nonnulls(p_challenge_id,p_lesson_id)<>1 then raise exception 'Atividade inválida.';end if;
 select * into t from public.visual_tutorials where challenge_id is not distinct from p_challenge_id and lesson_id is not distinct from p_lesson_id and published;
 if not found or not public.can_read_visual_tutorial(t.id) then return null;end if;
 return public.visual_tutorial_payload(t.id);
end $$;
create function public.admin_tutorial_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário.';end if;
 return jsonb_build_object('challenges',(select jsonb_agg(jsonb_build_object('id',id,'title',title,'category',category,'difficulty',difficulty) order by id) from public.challenges),'lessons',(select jsonb_agg(jsonb_build_object('id',id,'title',title,'category',category,'difficulty',difficulty) order by sort_order) from public.lessons));
end $$;
create function public.get_tutorial_draft(p_challenge_id integer default null,p_lesson_id text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$declare t public.visual_tutorials;begin
 if not public.is_admin() or num_nonnulls(p_challenge_id,p_lesson_id)<>1 then raise exception 'Acesso administrativo necessário.';end if;
 select * into t from public.visual_tutorials where challenge_id is not distinct from p_challenge_id and lesson_id is not distinct from p_lesson_id;
 if not found then return null;end if;
 return jsonb_build_object('revision',t.revision,'published',t.published,'payload',coalesce(t.draft,public.visual_tutorial_payload(t.id)));
end $$;
create function public.tutorial_image_valid(p_image text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tutorial_asset_manifest where path=p_image) or
 (p_image ~ '^storage:[0-9a-f-]{36}/[0-9]{8}/[0-9a-f-]{36}\.webp$' and exists(select 1 from storage.objects where bucket_id='tutorial-assets' and name=substr(p_image,9) and metadata->>'mimetype'='image/webp' and (metadata->>'size')::bigint between 1 and 1048576))
$$;
create function public.save_visual_tutorial(p_challenge_id integer,p_lesson_id text,p_payload jsonb,p_publish boolean default false,p_expected_revision integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.visual_tutorials;s jsonb;v jsonb;n integer:=0;
begin
 if not public.is_admin() or num_nonnulls(p_challenge_id,p_lesson_id)<>1 then raise exception 'Acesso administrativo necessário.';end if;
 if jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'steps')<>'array' or jsonb_typeof(p_payload->'palette')<>'array' then raise exception 'Estrutura de tutorial inválida.';end if;
 if length(trim(coalesce(p_payload->>'title','')) ) not between 3 and 120 or length(coalesce(p_payload->>'intro',''))>600 or length(coalesce(p_payload->>'tips',''))>1000 or jsonb_array_length(p_payload->'steps') not between 1 and 40 or jsonb_array_length(p_payload->'palette')>8 then raise exception 'Revise o título, textos e quantidade de etapas.';end if;
 for v in select value from jsonb_array_elements(p_payload->'palette') loop
  if coalesce(v->>'hex','')!~'^#[0-9a-fA-F]{6}$' or length(coalesce(v->>'label',''))>40 then raise exception 'Paleta inválida.';end if;
 end loop;
 for s in select value from jsonb_array_elements(p_payload->'steps') loop
  n:=n+1;
  if length(trim(coalesce(s->>'title',''))) not between 1 and 120 or length(coalesce(s->>'description',''))>300 or length(coalesce(s->>'tip',''))>300 or coalesce(s->>'type','') not in ('reference','construction','sketch','lineart','color','detail','final') then raise exception 'Revise os campos da etapa %.',n;end if;
  if coalesce(s->>'image','')<>'' and not public.tutorial_image_valid(s->>'image') then raise exception 'Imagem inválida na etapa %.',n;end if;
  if p_publish and coalesce(s->>'image','')='' then raise exception 'Cada etapa publicada precisa de uma imagem própria.';end if;
 end loop;
 if coalesce(p_payload->>'final_image','')<>'' and not public.tutorial_image_valid(p_payload->>'final_image') then raise exception 'Imagem final inválida.';end if;
 if p_publish and n<2 then raise exception 'Publique pelo menos duas etapas visuais.';end if;
 -- Serialize creation and revision updates for this target without locking participant data.
 perform pg_advisory_xact_lock(hashtext(coalesce(p_challenge_id::text,p_lesson_id)));
 select * into t from public.visual_tutorials where challenge_id is not distinct from p_challenge_id and lesson_id is not distinct from p_lesson_id for update;
 if not found then
  if p_expected_revision<>0 then raise exception 'O tutorial mudou. Reabra antes de salvar.';end if;
  insert into public.visual_tutorials(challenge_id,lesson_id) values(p_challenge_id,p_lesson_id) returning * into t;
 end if;
 if t.revision<>p_expected_revision then raise exception 'Outra edição foi salva. Reabra o tutorial antes de salvar.';end if;
 update public.visual_tutorials set draft=p_payload,revision=revision+1,updated_at=now() where id=t.id;
 if p_publish then
  update public.visual_tutorials set title=p_payload->>'title',intro=coalesce(p_payload->>'intro',''),palette=p_payload->'palette',final_image=nullif(p_payload->>'final_image',''),tips=coalesce(p_payload->>'tips',''),published=true where id=t.id;
  delete from public.tutorial_steps where tutorial_id=t.id;
  insert into public.tutorial_steps(tutorial_id,position,title,description,image,type,tip) select t.id,ordinality::int,value->>'title',coalesce(value->>'description',''),value->>'image',value->>'type',coalesce(value->>'tip','') from jsonb_array_elements(p_payload->'steps') with ordinality;
 end if;
 return public.get_tutorial_draft(p_challenge_id,p_lesson_id);
end $$;
create function public.unpublish_visual_tutorial(p_challenge_id integer,p_lesson_id text,p_expected_revision integer) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() or num_nonnulls(p_challenge_id,p_lesson_id)<>1 then raise exception 'Acesso administrativo necessário.';end if;
 update public.visual_tutorials set published=false,revision=revision+1,updated_at=now() where challenge_id is not distinct from p_challenge_id and lesson_id is not distinct from p_lesson_id and revision=p_expected_revision;
 if not found then raise exception 'O tutorial mudou. Reabra antes de retirar a publicação.';end if;
end $$;
create function public.tutorial_asset_readable(p_name text) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and (public.is_admin() or exists(select 1 from public.visual_tutorials t where public.can_read_visual_tutorial(t.id) and t.published and (t.final_image='storage:'||p_name or exists(select 1 from public.tutorial_steps s where s.tutorial_id=t.id and s.image='storage:'||p_name))))$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('tutorial-assets','tutorial-assets',false,1048576,array['image/webp']);
create policy tutorial_images_read on storage.objects for select to authenticated using(bucket_id='tutorial-assets' and public.tutorial_asset_readable(name));
create function public.tutorial_upload_allowed() returns boolean language sql stable security definer set search_path='' as $$select public.is_admin() and (select count(*) from storage.objects where bucket_id='tutorial-assets' and owner_id=auth.uid()::text and split_part(name,'/',2)=to_char(now() at time zone 'UTC','YYYYMMDD'))<50$$;
grant execute on function public.tutorial_upload_allowed() to authenticated;
revoke all on function public.tutorial_upload_allowed() from public,anon;
create policy tutorial_images_upload on storage.objects for insert to authenticated with check(bucket_id='tutorial-assets' and public.is_admin() and owner_id=auth.uid()::text and name ~ '^[0-9a-f-]{36}/[0-9]{8}/[0-9a-f-]{36}\.webp$' and split_part(name,'/',1)=auth.uid()::text and split_part(name,'/',2)=to_char(now() at time zone 'UTC','YYYYMMDD') and public.tutorial_upload_allowed());
revoke all on function public.can_read_visual_tutorial(uuid),public.visual_tutorial_payload(uuid),public.tutorial_image_valid(text) from public,anon,authenticated;
revoke all on function public.get_visual_tutorial(integer,text),public.admin_tutorial_catalog(),public.get_tutorial_draft(integer,text),public.save_visual_tutorial(integer,text,jsonb,boolean,integer),public.unpublish_visual_tutorial(integer,text,integer),public.tutorial_asset_readable(text) from public,anon;
grant execute on function public.get_visual_tutorial(integer,text),public.admin_tutorial_catalog(),public.get_tutorial_draft(integer,text),public.save_visual_tutorial(integer,text,jsonb,boolean,integer),public.unpublish_visual_tutorial(integer,text,integer),public.tutorial_asset_readable(text) to authenticated;
notify pgrst,'reload schema';
commit;


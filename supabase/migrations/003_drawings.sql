begin;
alter table public.completions add column drawing_path text;
alter table public.completions add column drawing_bonus integer not null default 0 check(drawing_bonus in (0,15));
alter table public.completions add constraint drawing_reward_consistent check
 ((drawing_path is null and drawing_bonus=0) or
  (drawing_path=user_id::text||'/'||id::text||'.webp' and drawing_bonus=15));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('drawings','drawings',false,1048576,array['image/webp']);

-- One immutable file for an owned, completed ritual. No overwrites or public reads.
create policy drawings_owned_read on storage.objects for select to authenticated
using(bucket_id='drawings' and owner_id=(select auth.uid())::text
 and split_part(name,'/',1)=(select auth.uid())::text);
create policy drawings_completed_upload on storage.objects for insert to authenticated
with check(bucket_id='drawings' and owner_id=(select auth.uid())::text
 and exists(select 1 from public.completions c
 where c.user_id=(select auth.uid()) and c.drawing_path is null
 and name=c.user_id::text||'/'||c.id::text||'.webp'));

create function public.attach_drawing(p_completion_id uuid)
returns public.completions language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.completions; path text;
begin
 if u is null then raise exception 'Entre na sua conta.'; end if;
 -- Same locking order as ritual completion: retries and concurrent calls cannot farm XP.
 perform 1 from public.profiles where id=u for update;
 select * into c from public.completions where id=p_completion_id and user_id=u for update;
 if not found then raise exception 'Desafio concluído não encontrado.'; end if;
 if c.drawing_bonus=15 then return c; end if;
 path:=u::text||'/'||c.id::text||'.webp';
 if not exists(select 1 from storage.objects o where o.bucket_id='drawings'
  and o.name=path and o.owner_id=u::text and o.metadata->>'mimetype'='image/webp'
  and (o.metadata->>'size')::bigint between 1 and 1048576)
 then raise exception 'Envie uma imagem válida antes de receber o bônus.'; end if;
 update public.completions set drawing_path=path,drawing_bonus=15 where id=c.id returning * into c;
 update public.profiles set xp=xp+15 where id=u;
 return c;
end $$;
revoke execute on function public.attach_drawing(uuid) from public,anon;
grant execute on function public.attach_drawing(uuid) to authenticated;
commit;

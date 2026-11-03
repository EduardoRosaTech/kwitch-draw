-- Preserve safe reapplication of the original seeds after adding channels.
begin;
create function public.infer_challenge_channel() returns trigger language plpgsql set search_path='' as $$
begin
 if new.grimoire_id is not null and new.channel='standard' then new.channel:='journey'; end if;
 return new;
end $$;
create trigger challenge_channel_before_insert before insert on public.challenges for each row execute function public.infer_challenge_channel();
revoke execute on function public.infer_challenge_channel() from public,anon,authenticated;
commit;

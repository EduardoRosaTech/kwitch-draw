-- Atualização para projetos existentes. Não reaplique a migration 001.
begin;
alter table public.profiles add column if not exists gender text not null default 'neutral';
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check(gender in ('feminine','masculine','neutral'));
alter table public.profiles alter column display_name set default 'Pessoa criativa';
grant update(gender) on public.profiles to authenticated;
create or replace function public.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
declare
 selected_gender text:=coalesce(new.raw_user_meta_data->>'gender','neutral');
 chosen_name text:=left(trim(coalesce(new.raw_user_meta_data->>'display_name','')),40);
begin
 if selected_gender not in ('feminine','masculine','neutral') then selected_gender:='neutral'; end if;
 if char_length(chosen_name)<2 then
  chosen_name:=case selected_gender when 'feminine' then 'Bruxinha' when 'masculine' then 'Bruxinho' else 'Pessoa criativa' end;
 end if;
 insert into public.profiles(id,display_name,gender) values(new.id,chosen_name,selected_gender);
 return new;
end $$;
revoke execute on function public.on_signup() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;

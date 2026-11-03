begin;
-- Progressive level cost: level 1->2 = 150 XP; each next level costs +25 XP.
-- The total threshold for level L is 25*(L-1)*(L+10)/2. Existing XP is preserved.
create function public.level_from_xp(p_xp integer) returns integer
language plpgsql immutable strict parallel safe set search_path='' as $$
declare lo integer:=0; hi integer:=100000; mid integer; threshold bigint;
begin
 if p_xp<0 then return 1; end if;
 while lo<hi loop
  mid:=(lo+hi+1)/2;
  threshold:=25::bigint*mid*(mid+11)/2;
  if threshold<=p_xp then lo:=mid; else hi:=mid-1; end if;
 end loop;
 return lo+1;
end $$;
revoke execute on function public.level_from_xp(integer) from public,anon;
grant execute on function public.level_from_xp(integer) to authenticated;
alter table public.profiles drop column level;
alter table public.profiles add column level integer generated always as (public.level_from_xp(xp)) stored;

alter table public.profiles add column familiar_kind text not null default 'cat' check(familiar_kind in ('cat','fox','owl','frog','raven','rabbit'));
alter table public.profiles add column familiar_tone text not null default 'plum' check(familiar_tone in ('plum','rose','coral','sage'));
alter table public.profiles add column familiar_charm text not null default 'star' check(familiar_charm in ('star','moon','leaf'));
alter table public.profiles add column familiar_name text not null default 'Nox' check(char_length(trim(familiar_name)) between 2 and 30);
alter table public.profiles add column familiar_description text not null default '' check(char_length(familiar_description)<=240);
grant update(familiar_kind,familiar_tone,familiar_charm,familiar_name,familiar_description) on public.profiles to authenticated;

create or replace function public.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
declare
 selected_gender text:=coalesce(new.raw_user_meta_data->>'gender','neutral');
 chosen_name text:=left(trim(coalesce(new.raw_user_meta_data->>'display_name','')),40);
 kind text:=coalesce(new.raw_user_meta_data->>'familiar_kind','cat');
 tone text:=coalesce(new.raw_user_meta_data->>'familiar_tone','plum');
 charm text:=coalesce(new.raw_user_meta_data->>'familiar_charm','star');
 pet_name text:=left(trim(coalesce(new.raw_user_meta_data->>'familiar_name','Nox')),30);
 description text:=left(coalesce(new.raw_user_meta_data->>'familiar_description',''),240);
begin
 if selected_gender not in ('feminine','masculine','neutral') then selected_gender:='neutral'; end if;
 if char_length(chosen_name)<2 then chosen_name:=case selected_gender when 'feminine' then 'Bruxinha' when 'masculine' then 'Bruxinho' else 'Pessoa criativa' end; end if;
 if kind not in ('cat','fox','owl','frog','raven','rabbit') then kind:='cat'; end if;
 if tone not in ('plum','rose','coral','sage') then tone:='plum'; end if;
 if charm not in ('star','moon','leaf') then charm:='star'; end if;
 if char_length(pet_name)<2 then pet_name:='Nox'; end if;
 insert into public.profiles(id,display_name,gender,familiar_kind,familiar_tone,familiar_charm,familiar_name,familiar_description)
 values(new.id,chosen_name,selected_gender,kind,tone,charm,pet_name,description);
 return new;
end $$;
revoke execute on function public.on_signup() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;

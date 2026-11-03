-- Aumenta atividades de 5 minutos, preservando XP e historico.
begin;
update public.challenges set duration_minutes = 10 where duration_minutes = 5;
commit;

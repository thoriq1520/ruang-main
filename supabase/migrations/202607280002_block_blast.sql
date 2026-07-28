alter table public.solo_runs drop constraint if exists solo_runs_game_id_check;
alter table public.solo_runs add constraint solo_runs_game_id_check
  check (game_id in ('arrow-puzzle', 'fruit-merge', 'block-blast'));

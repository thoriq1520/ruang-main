alter table public.solo_runs alter column user_id drop not null;
alter table public.solo_runs add column if not exists guest_name text;

alter table public.solo_runs drop constraint if exists solo_runs_identity_check;
alter table public.solo_runs add constraint solo_runs_identity_check
  check (
    (user_id is not null and guest_name is null)
    or (user_id is null and char_length(trim(guest_name)) between 1 and 20)
  );

alter table public.solo_runs drop constraint if exists solo_runs_game_id_check;
alter table public.solo_runs add constraint solo_runs_game_id_check
  check (game_id in ('arrow-puzzle', 'fruit-merge', 'block-blast', 'fruit-slice', 'magic-bottles'));

alter table public.solo_saves drop constraint if exists solo_saves_game_id_check;
alter table public.solo_saves add constraint solo_saves_game_id_check
  check (game_id in ('arrow-puzzle', 'fruit-merge', 'block-blast', 'fruit-slice', 'magic-bottles'));

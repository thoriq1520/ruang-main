create table if not exists public.solo_saves (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  game_id text not null check (game_id in ('arrow-puzzle', 'fruit-merge', 'block-blast')),
  state jsonb not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index if not exists solo_saves_one_active_idx
  on public.solo_saves (user_id, game_id) where status = 'active';

create index if not exists solo_saves_history_idx
  on public.solo_saves (user_id, game_id, created_at desc);

revoke all on public.solo_saves from anon, authenticated;

create table if not exists public.solo_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."user"(id) on delete cascade,
  game_id text not null check (game_id in ('arrow-puzzle', 'fruit-merge', 'block-blast')),
  result text not null check (result in ('won', 'lost')),
  score bigint not null check (score >= 0),
  level integer,
  duration_ms integer not null check (duration_ms between 0 and 86400000),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists solo_runs_leaderboard_idx
  on public.solo_runs (game_id, score desc, duration_ms asc, created_at asc);

create index if not exists solo_runs_user_history_idx
  on public.solo_runs (user_id, created_at desc);

revoke all on public.solo_runs from anon, authenticated;

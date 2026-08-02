import type {Pool} from 'pg'

export const soloGameIds = ['arrow-puzzle', 'fruit-merge', 'block-blast', 'fruit-slice', 'magic-bottles'] as const
export type SoloGameId = typeof soloGameIds[number]
export type RunResult = 'won' | 'lost'

export type RunSubmission = {
  gameId: SoloGameId
  result: RunResult
  durationMs: number
  score?: number
  level?: number
  moves?: number
  mistakes?: number
  largestKind?: number
  linesCleared?: number
  bestCombo?: number
  fruitsSliced?: number
}

export type NormalizedRun = {
  gameId: SoloGameId
  result: RunResult
  score: number
  level: number | null
  durationMs: number
  stats: Record<string, number>
}

export function normalizeRun(input: RunSubmission): NormalizedRun {
  const durationMs = boundedInteger(input.durationMs, 'durationMs', 0, 86_400_000)
  if (input.gameId === 'fruit-merge') {
    const score = boundedInteger(input.score, 'score', 0, 10_000_000)
    const largestKind = boundedInteger(input.largestKind, 'largestKind', 0, 10)
    return {gameId: input.gameId, result: 'lost', score, level: null, durationMs, stats: {largestKind}}
  }

  if (input.gameId === 'block-blast') {
    const score = boundedInteger(input.score, 'score', 0, 10_000_000)
    const linesCleared = boundedInteger(input.linesCleared, 'linesCleared', 0, 100_000)
    return {gameId: input.gameId, result: 'lost', score, level: null, durationMs, stats: {linesCleared}}
  }

  if (input.gameId === 'fruit-slice') {
    const score = boundedInteger(input.score, 'score', 0, 10_000_000)
    const bestCombo = boundedInteger(input.bestCombo, 'bestCombo', 0, 100)
    const fruitsSliced = boundedInteger(input.fruitsSliced, 'fruitsSliced', 0, 100_000)
    return {gameId: input.gameId, result: 'lost', score, level: null, durationMs, stats: {bestCombo, fruitsSliced}}
  }

  if (input.gameId === 'magic-bottles') {
    const level = boundedInteger(input.level, 'level', 1, 10)
    const moves = boundedInteger(input.moves, 'moves', 1, 100_000)
    const score = level * 100_000 + Math.max(0, 50_000 - moves * 100 - Math.floor(durationMs / 1_000))
    return {gameId: input.gameId, result: 'won', score, level, durationMs, stats: {moves}}
  }

  const level = boundedInteger(input.level, 'level', 1, 10_000)
  const moves = boundedInteger(input.moves, 'moves', 1, 100_000)
  const mistakes = boundedInteger(input.mistakes, 'mistakes', 0, moves)
  const score = input.result === 'won'
    ? level * 100_000 + Math.max(0, 50_000 - moves * 100 - mistakes * 2_000 - Math.floor(durationMs / 1_000))
    : Math.max(0, (level - 1) * 100_000)
  return {gameId: input.gameId, result: input.result, score, level, durationMs, stats: {moves, mistakes}}
}

export function normalizeGuestName(value: unknown) {
  if (typeof value !== 'string') throw new Error('Nama pemain wajib diisi.')
  const name = value.trim().replace(/\s+/g, ' ')
  if (!name || name.length > 20) throw new Error('Nama pemain harus 1-20 karakter.')
  return name
}

function boundedInteger(value: number | undefined, name: string, minimum: number, maximum: number) {
  if (!Number.isInteger(value) || value! < minimum || value! > maximum) throw new Error(`${name} tidak valid`)
  return value!
}

export class RunRepository {
  constructor(private readonly pool: Pool) {}

  async create(userId: string | null, guestName: string | null, run: NormalizedRun) {
    const result = await this.pool.query(
      `insert into solo_runs (user_id, guest_name, game_id, result, score, level, duration_ms, stats)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, game_id, result, score::double precision as score, level, duration_ms, stats, created_at`,
      [userId, guestName, run.gameId, run.result, run.score, run.level, run.durationMs, run.stats],
    )
    return mapRun(result.rows[0])
  }

  async qualification(run: NormalizedRun) {
    const result = await this.pool.query(
      `select count(*)::integer as better
       from solo_runs
       where game_id = $1
         and (result = 'lost' or game_id = 'magic-bottles')
         and (score > $2 or (score = $2 and duration_ms <= $3))`,
      [run.gameId, run.score, run.durationMs],
    )
    const rank = Number(result.rows[0]?.better ?? 0) + 1
    return {rank, qualifies: rank <= 5, score: run.score}
  }

  async history(userId: string, limit = 20) {
    const result = await this.pool.query(
      `select id, game_id, result, score::double precision as score, level, duration_ms, stats, created_at
       from solo_runs
       where user_id = $1 and (game_id <> 'arrow-puzzle' or result = 'lost')
       order by created_at desc limit $2`,
      [userId, limit],
    )
    return result.rows.map(mapRun)
  }

  async leaderboard(gameId: SoloGameId, limit = 5) {
    const result = await this.pool.query(
      `select r.id, r.score::double precision as score, r.level, r.duration_ms, r.stats, r.created_at,
              u.id as user_id, coalesce(u.name, r.guest_name) as name, u.image,
              row_number() over (order by r.score desc, r.duration_ms asc, r.created_at asc)::integer as rank
       from solo_runs r
       left join "user" u on u.id = r.user_id
       where r.game_id = $1 and (r.result = 'lost' or r.game_id = 'magic-bottles')
       order by r.score desc, r.duration_ms asc, r.created_at asc
       limit $2`,
      [gameId, limit],
    )
    return result.rows.map((row) => ({
      id: row.id as string,
      rank: Number(row.rank),
      userId: row.user_id as string | null,
      name: row.name as string,
      image: row.image as string | null,
      score: Number(row.score),
      level: row.level === null ? null : Number(row.level),
      durationMs: Number(row.duration_ms),
      stats: row.stats as Record<string, number>,
      createdAt: row.created_at as Date,
    }))
  }
}

function mapRun(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    gameId: row.game_id as SoloGameId,
    result: row.result as RunResult,
    score: Number(row.score),
    level: row.level === null ? null : Number(row.level),
    durationMs: Number(row.duration_ms),
    stats: row.stats as Record<string, number>,
    createdAt: row.created_at as Date,
  }
}

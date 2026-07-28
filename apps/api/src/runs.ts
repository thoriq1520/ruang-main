import type {Pool} from 'pg'

export const soloGameIds = ['arrow-puzzle', 'fruit-merge'] as const
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

  const level = boundedInteger(input.level, 'level', 1, 10_000)
  const moves = boundedInteger(input.moves, 'moves', 1, 100_000)
  const mistakes = boundedInteger(input.mistakes, 'mistakes', 0, moves)
  const score = input.result === 'won'
    ? level * 100_000 + Math.max(0, 50_000 - moves * 100 - mistakes * 2_000 - Math.floor(durationMs / 1_000))
    : Math.max(0, (level - 1) * 100_000)
  return {gameId: input.gameId, result: input.result, score, level, durationMs, stats: {moves, mistakes}}
}

function boundedInteger(value: number | undefined, name: string, minimum: number, maximum: number) {
  if (!Number.isInteger(value) || value! < minimum || value! > maximum) throw new Error(`${name} tidak valid`)
  return value!
}

export class RunRepository {
  constructor(private readonly pool: Pool) {}

  async create(userId: string, run: NormalizedRun) {
    const result = await this.pool.query(
      `insert into solo_runs (user_id, game_id, result, score, level, duration_ms, stats)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, game_id, result, score::double precision as score, level, duration_ms, stats, created_at`,
      [userId, run.gameId, run.result, run.score, run.level, run.durationMs, run.stats],
    )
    return mapRun(result.rows[0])
  }

  async history(userId: string, limit = 20) {
    const result = await this.pool.query(
      `select id, game_id, result, score::double precision as score, level, duration_ms, stats, created_at
       from solo_runs where user_id = $1 order by created_at desc limit $2`,
      [userId, limit],
    )
    return result.rows.map(mapRun)
  }

  async leaderboard(gameId: SoloGameId, limit = 25) {
    const result = await this.pool.query(
      `select r.id, r.score::double precision as score, r.level, r.duration_ms, r.stats, r.created_at,
              u.id as user_id, u.name, u.image,
              row_number() over (order by r.score desc, r.duration_ms asc, r.created_at asc)::integer as rank
       from solo_runs r
       join "user" u on u.id = r.user_id
       where r.game_id = $1 and ($1 = 'fruit-merge' or r.result = 'won')
       order by r.score desc, r.duration_ms asc, r.created_at asc
       limit $2`,
      [gameId, limit],
    )
    return result.rows.map((row) => ({
      id: row.id as string,
      rank: Number(row.rank),
      userId: row.user_id as string,
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

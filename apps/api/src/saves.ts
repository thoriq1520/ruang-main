import type {Pool} from 'pg'
import type {SoloGameId} from './runs'

export type SoloSaveState = Record<string, unknown>

export function normalizeSaveState(state: unknown): SoloSaveState {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Save game tidak valid.')
  if (JSON.stringify(state).length > 100_000) throw new Error('Save game terlalu besar.')
  return state as SoloSaveState
}

export class SaveRepository {
  constructor(private readonly pool: Pool) {}

  async active(userId: string, gameId: SoloGameId) {
    const result = await this.pool.query(
      `select id, game_id, state, created_at, updated_at
       from solo_saves where user_id = $1 and game_id = $2 and status = 'active'
       limit 1`,
      [userId, gameId],
    )
    return result.rows[0] ? mapSave(result.rows[0]) : null
  }

  async save(userId: string, gameId: SoloGameId, state: SoloSaveState) {
    const result = await this.pool.query(
      `insert into solo_saves (user_id, game_id, state)
       values ($1, $2, $3)
       on conflict (user_id, game_id) where status = 'active'
       do update set state = excluded.state, updated_at = now()
       returning id, game_id, state, created_at, updated_at`,
      [userId, gameId, state],
    )
    return mapSave(result.rows[0])
  }

  async archive(userId: string, gameId: SoloGameId) {
    const result = await this.pool.query(
      `update solo_saves
       set status = 'archived', archived_at = now(), updated_at = now()
       where user_id = $1 and game_id = $2 and status = 'active'
       returning id`,
      [userId, gameId],
    )
    return Boolean(result.rowCount)
  }
}

function mapSave(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    gameId: row.game_id as SoloGameId,
    state: row.state as SoloSaveState,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  }
}

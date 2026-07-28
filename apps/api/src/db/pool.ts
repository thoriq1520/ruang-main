import {Pool} from 'pg'
import {config} from '../config'

let pool: Pool | undefined

export function getPool() {
  return pool ??= new Pool({connectionString: config.databaseUrl, max: 5})
}

export async function closePool() {
  if (!pool) return
  await pool.end()
  pool = undefined
}

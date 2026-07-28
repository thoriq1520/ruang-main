import {getMigrations} from 'better-auth/db/migration'
import {auth} from '../auth'
import {closePool, getPool} from './pool'

export async function migrateDatabase() {
  const migrations = await getMigrations(auth.options)
  await migrations.runMigrations()
  const sql = await Bun.file(new URL('../../../../supabase/migrations/202607280001_solo_runs.sql', import.meta.url)).text()
  await getPool().query(sql)
}

if (import.meta.main) {
  try {
    await migrateDatabase()
    console.log('Migrasi database selesai.')
  } finally {
    await closePool()
  }
}

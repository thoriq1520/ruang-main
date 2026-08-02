import {getMigrations} from 'better-auth/db/migration'
import {createAuth} from '../auth'
import {closePool, getPool} from './pool'

export async function migrateDatabase() {
  const auth = createAuth()
  const migrations = await getMigrations(auth.options)
  await migrations.runMigrations()
  for (const name of ['202607280001_solo_runs.sql', '202607280002_block_blast.sql', '202607290001_solo_saves.sql', '202607290002_fruit_slice.sql', '202608010001_guest_leaderboard.sql']) {
    const sql = await Bun.file(new URL(`../../../../supabase/migrations/${name}`, import.meta.url)).text()
    await getPool().query(sql)
  }
}

if (import.meta.main) {
  try {
    await migrateDatabase()
    console.log('Migrasi database selesai.')
  } finally {
    await closePool()
  }
}

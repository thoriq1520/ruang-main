import {getMigrations} from 'better-auth/db/migration'
import {createAuth} from '../auth'
import {closePool, getPool} from './pool'

export async function migrateDatabase() {
  const auth = createAuth()
  const migrations = await getMigrations(auth.options)
  await migrations.runMigrations()
  for (const name of ['202607280001_solo_runs.sql', '202607280002_block_blast.sql']) {
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

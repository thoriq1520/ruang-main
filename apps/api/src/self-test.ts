import {app} from './app'
import {config} from './config'
import {migrateDatabase} from './db/migrate'
import {closePool, getPool} from './db/pool'

const email = `self-test-${Date.now()}@ruangmain.invalid`

function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.set('origin', config.webOrigin)
  return app.handle(new Request(new URL(path, config.authUrl), {...init, headers}))
}

async function expectStatus(response: Response, expected: number, label: string) {
  if (response.status !== expected) throw new Error(`${label}: expected ${expected}, received ${response.status}: ${await response.text()}`)
  return response
}

try {
  await migrateDatabase()
  await expectStatus(await request('/health/db'), 200, 'database health')

  const signup = await expectStatus(await request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({name: 'Self Test', email, password: 'self-test-password'}),
  }), 200, 'sign up')
  const cookie = signup.headers.get('set-cookie')?.split(';', 1)[0]
  if (!cookie) throw new Error('sign up tidak menghasilkan session cookie')

  const authenticatedHeaders = {'content-type': 'application/json', cookie}
  await expectStatus(await request('/api/solo-runs', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({gameId: 'arrow-puzzle', result: 'won', level: 2, moves: 18, mistakes: 1, durationMs: 24_000}),
  }), 201, 'save arrow run')
  await expectStatus(await request('/api/solo-runs', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({gameId: 'fruit-merge', result: 'lost', score: 480, largestKind: 4, durationMs: 42_000}),
  }), 201, 'save fruit run')

  const history = await expectStatus(await request('/api/me/solo-runs', {headers: {cookie}}), 200, 'history')
  const historyRows = (await history.json() as {data: unknown[]}).data
  if (historyRows.length !== 2) throw new Error(`history: expected 2 rows, received ${historyRows.length}`)

  const leaderboard = await expectStatus(await request('/api/leaderboards/arrow-puzzle'), 200, 'leaderboard')
  const leaderboardRows = (await leaderboard.json() as {data: Array<{name: string}>}).data
  if (!leaderboardRows.some((row) => row.name === 'Self Test')) throw new Error('leaderboard tidak memuat hasil self-test')

  console.log('Self-test API, auth, database, history, dan leaderboard lulus.')
} finally {
  const pool = getPool()
  const user = await pool.query('select id from "user" where email = $1', [email]).catch(() => ({rows: []}))
  if (user.rows[0]?.id) {
    await pool.query('delete from solo_runs where user_id = $1', [user.rows[0].id])
    await pool.query('delete from session where "userId" = $1', [user.rows[0].id])
    await pool.query('delete from account where "userId" = $1', [user.rows[0].id])
    await pool.query('delete from "user" where id = $1', [user.rows[0].id])
  }
  await closePool()
}

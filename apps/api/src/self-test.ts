import {createApp} from './app'
import {config} from './config'
import {migrateDatabase} from './db/migrate'
import {closePool, getPool} from './db/pool'

const email = `self-test-${Date.now()}@ruangmain.invalid`
const app = createApp()

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
  await expectStatus(await request('/api/solo-saves/arrow-puzzle', {
    method: 'PUT',
    headers: authenticatedHeaders,
    body: JSON.stringify({state: {version: 1, elapsedMs: 1200, game: {level: 1}}}),
  }), 200, 'save active game')
  const activeSave = await expectStatus(await request('/api/solo-saves/arrow-puzzle', {headers: {cookie}}), 200, 'load active game')
  if (!(await activeSave.json() as {data: {state: {version: number}}}).data?.state || (await request('/api/solo-saves/arrow-puzzle')).status !== 401) {
    throw new Error('save game tidak terisolasi untuk user login')
  }
  await expectStatus(await request('/api/solo-saves/arrow-puzzle/archive', {method: 'POST', headers: {cookie}}), 200, 'archive active game')
  const archivedSave = await expectStatus(await request('/api/solo-saves/arrow-puzzle', {headers: {cookie}}), 200, 'load archived game')
  if ((await archivedSave.json() as {data: unknown}).data !== null) throw new Error('save yang diarsipkan masih aktif')

  await expectStatus(await request('/api/solo-runs', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({gameId: 'arrow-puzzle', result: 'lost', level: 2, moves: 18, mistakes: 1, durationMs: 24_000}),
  }), 201, 'save arrow run')
  await expectStatus(await request('/api/solo-runs', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({gameId: 'fruit-merge', result: 'lost', score: 480, largestKind: 4, durationMs: 42_000}),
  }), 201, 'save fruit run')
  await expectStatus(await request('/api/solo-runs', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({gameId: 'fruit-slice', result: 'lost', score: 75, bestCombo: 4, fruitsSliced: 60, durationMs: 30_000}),
  }), 201, 'save fruit slice run')

  const history = await expectStatus(await request('/api/me/solo-runs', {headers: {cookie}}), 200, 'history')
  const historyRows = (await history.json() as {data: unknown[]}).data
  if (historyRows.length !== 3) throw new Error(`history: expected 3 rows, received ${historyRows.length}`)

  const leaderboard = await expectStatus(await request('/api/leaderboards/arrow-puzzle'), 200, 'leaderboard')
  const leaderboardRows = (await leaderboard.json() as {data: Array<{name: string}>}).data
  if (!leaderboardRows.some((row) => row.name === 'Self Test')) throw new Error('leaderboard tidak memuat hasil self-test')

  const sliceLeaderboard = await expectStatus(await request('/api/leaderboards/fruit-slice'), 200, 'fruit slice leaderboard')
  const sliceLeaderboardRows = (await sliceLeaderboard.json() as {data: Array<{name: string}>}).data
  if (!sliceLeaderboardRows.some((row) => row.name === 'Self Test')) throw new Error('leaderboard Tebas Buah tidak memuat hasil self-test')

  console.log('Self-test API, auth, database, save/continue, history, dan leaderboard lulus.')
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

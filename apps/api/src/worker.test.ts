import {expect, test} from 'bun:test'
import {CloudflareAdapter} from 'elysia/adapter/cloudflare-worker'
import {Pool} from 'pg'
import {createApp} from './app'
import {createAuth} from './auth'
import {config} from './config'
import worker from './worker'

test('Google menaut ke user yang sudah ada dengan email sama', async () => {
  const pool = new Pool()
  const auth = createAuth(pool)

  expect(auth.options.account?.accountLinking).toMatchObject({
    enabled: true,
    trustedProviders: ['google'],
    requireLocalEmailVerified: false,
  })

  await pool.end()
})

test('Worker melayani API dan menjelaskan database yang belum dikonfigurasi', async () => {
  const missingDatabase = await worker.fetch(new Request('https://ruangmain.web.id/health'), {})
  expect(missingDatabase.status).toBe(503)

  const health = await worker.fetch(new Request('https://ruangmain.web.id/health'), {
    DATABASE_URL: 'postgresql://unused:unused@localhost:5432/unused',
  })
  expect(health.status).toBe(200)
  expect((await health.json() as {data: {ok: boolean}}).data.ok).toBe(true)
})

test('Worker meneruskan body OAuth ke Better Auth tanpa membacanya dua kali', async () => {
  const previousClientId = config.googleClientId
  const previousClientSecret = config.googleClientSecret
  config.googleClientId = 'google-test-client'
  config.googleClientSecret = 'google-test-secret'

  const query = async (_sql: unknown, values: unknown[] = []) => ({
    rowCount: 1,
    rows: [{identifier: values[0], value: values[1], expiresAt: values[2], createdAt: values[3], updatedAt: values[4], id: values[5]}],
  })
  const pool = new Pool()
  pool.query = query as typeof pool.query
  pool.connect = (async () => ({query, release() {}})) as typeof pool.connect

  try {
    const app = createApp(pool, CloudflareAdapter, false)
    const response = await app.fetch(new Request(`${config.authUrl}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: {'content-type': 'application/json', origin: config.webOrigin},
      body: JSON.stringify({provider: 'google', callbackURL: `${config.webOrigin}/`}),
    }))

    expect(response.status).toBe(200)
    expect((await response.json() as {url: string}).url).toContain('accounts.google.com')
  } finally {
    config.googleClientId = previousClientId
    config.googleClientSecret = previousClientSecret
    await pool.end()
  }
})

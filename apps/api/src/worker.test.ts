import {expect, test} from 'bun:test'
import worker from './worker'

test('Worker melayani API dan menjelaskan database yang belum dikonfigurasi', async () => {
  const missingDatabase = await worker.fetch(new Request('https://ruangmain.web.id/health'), {})
  expect(missingDatabase.status).toBe(503)

  const health = await worker.fetch(new Request('https://ruangmain.web.id/health'), {
    DATABASE_URL: 'postgresql://unused:unused@localhost:5432/unused',
  })
  expect(health.status).toBe(200)
  expect((await health.json() as {data: {ok: boolean}}).data.ok).toBe(true)
})

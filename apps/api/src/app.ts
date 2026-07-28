import {cors} from '@elysiajs/cors'
import {Elysia, t, type ElysiaAdapter} from 'elysia'
import type {Pool} from 'pg'
import {createAuth} from './auth'
import {config, isAllowedWebOrigin} from './config'
import {getPool} from './db/pool'
import {apiResponse} from './response'
import {normalizeRun, RunRepository, soloGameIds} from './runs'

const runBody = t.Object({
  gameId: t.Union([t.Literal('arrow-puzzle'), t.Literal('fruit-merge')]),
  result: t.Union([t.Literal('won'), t.Literal('lost')]),
  durationMs: t.Integer({minimum: 0, maximum: 86_400_000}),
  score: t.Optional(t.Integer()),
  level: t.Optional(t.Integer()),
  moves: t.Optional(t.Integer()),
  mistakes: t.Optional(t.Integer()),
  largestKind: t.Optional(t.Integer()),
})

const requestStartedAt = new WeakMap<Request, number>()

function errorMessage(error: unknown) {
  const cause = error instanceof AggregateError ? error.errors[0] : error
  return cause instanceof Error ? cause.message : String(cause)
}

export function createApp(pool: Pool = getPool(), adapter?: ElysiaAdapter, aot = true) {
  const auth = createAuth(pool)
  const repository = new RunRepository(pool)

  return new Elysia({adapter, aot})
    .onRequest(({request}) => {
      requestStartedAt.set(request, performance.now())
    })
    .onAfterResponse(({request, responseValue, set}) => {
      const elapsed = Math.round(performance.now() - (requestStartedAt.get(request) ?? performance.now()))
      const status = responseValue instanceof Response ? responseValue.status : set.status || 200
      console.info(`[API] ${request.method} ${new URL(request.url).pathname} ${status} ${elapsed}ms`)
    })
    .onError(({error, request, code, set}) => {
      const path = new URL(request.url).pathname
      const message = errorMessage(error)
      console.error(`[API] ERROR ${request.method} ${path} ${code}: ${message}`)
      if (path.startsWith('/api/auth/')) return
      const statusCode = code === 'NOT_FOUND' ? 404 : code === 'VALIDATION' ? 422 : code === 'PARSE' ? 400 : 500
      set.status = statusCode
      const publicMessage = statusCode === 500 ? 'Terjadi kesalahan pada server.' : statusCode === 404 ? 'Endpoint tidak ditemukan.' : message
      return apiResponse(statusCode, publicMessage, null, String(code))
    })
    .use(cors({origin: (request) => isAllowedWebOrigin(request.headers.get('origin') || ''), credentials: true}))
    .get('/health', () => apiResponse(200, 'API aktif.', {ok: true}))
    .get('/api/auth-options', () => apiResponse(200, 'Opsi autentikasi tersedia.', {google: Boolean(config.googleClientId && config.googleClientSecret)}))
    .get('/health/db', async ({status}) => {
      try {
        await getPool().query('select 1')
        return apiResponse(200, 'Database terhubung.', {ok: true})
      } catch (error) {
        console.error(`[DB] Koneksi gagal: ${errorMessage(error)}`)
        return status(503, apiResponse(503, 'Database tidak dapat dijangkau.', null, 'DATABASE_UNAVAILABLE'))
      }
    })
    .all('/api/auth/*', ({request}) => auth.handler(request))
    .group('/api', (api) => api
      .get('/me', async ({request, status}) => {
        const session = await auth.api.getSession({headers: request.headers})
        return session
          ? apiResponse(200, 'Sesi aktif.', session)
          : status(401, apiResponse(401, 'Silakan masuk terlebih dahulu.', null, 'UNAUTHORIZED'))
      })
      .post('/solo-runs', async ({body, request, status}) => {
        const session = await auth.api.getSession({headers: request.headers})
        if (!session) return status(401, apiResponse(401, 'Silakan masuk untuk menyimpan hasil.', null, 'UNAUTHORIZED'))
        let run: ReturnType<typeof normalizeRun>
        try {
          run = normalizeRun(body)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Hasil tidak valid.'
          return status(400, apiResponse(400, message, null, 'INVALID_RUN'))
        }
        return status(201, apiResponse(201, 'Hasil permainan tersimpan.', await repository.create(session.user.id, run)))
      }, {body: runBody})
      .get('/me/solo-runs', async ({request, status}) => {
        const session = await auth.api.getSession({headers: request.headers})
        return session
          ? apiResponse(200, 'Riwayat permainan ditemukan.', await repository.history(session.user.id))
          : status(401, apiResponse(401, 'Silakan masuk terlebih dahulu.', null, 'UNAUTHORIZED'))
      })
      .get('/leaderboards/:gameId', async ({params, status}) => {
        if (!soloGameIds.includes(params.gameId as typeof soloGameIds[number])) {
          return status(404, apiResponse(404, 'Game tidak ditemukan.', null, 'GAME_NOT_FOUND'))
        }
        return apiResponse(200, 'Peringkat ditemukan.', await repository.leaderboard(params.gameId as typeof soloGameIds[number]))
      }, {params: t.Object({gameId: t.String()})}),
    )
}

export type App = ReturnType<typeof createApp>

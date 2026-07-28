import {CloudflareAdapter} from 'elysia/adapter/cloudflare-worker'
import {Pool} from 'pg'
import {createApp} from './app'
import {apiResponse} from './response'

type WorkerEnv = {
  DATABASE_URL?: string
  HYPERDRIVE?: {connectionString: string}
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    try {
      const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL
      if (!connectionString) {
        return Response.json(apiResponse(503, 'Database belum dikonfigurasi.', null, 'DATABASE_NOT_CONFIGURED'), {status: 503})
      }

      // ponytail: request-scoped pool avoids reusing Worker I/O across requests.
      const pool = new Pool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 5_000,
        connectionTimeoutMillis: 10_000,
      })
      try {
        return await createApp(pool, CloudflareAdapter, false).fetch(request)
      } finally {
        await pool.end().catch(() => undefined)
      }
    } catch (error) {
      console.error('[WORKER] Gagal memulai API:', error)
      return Response.json(apiResponse(500, 'API tidak dapat dimulai.', null, 'WORKER_START_FAILED'), {status: 500})
    }
  },
}

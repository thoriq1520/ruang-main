import {treaty} from '@elysiajs/eden'
import type {App} from '@ruang-main/api'

export const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export const api = treaty<App>(apiOrigin, {fetch: {credentials: 'include'}})

export type SoloRunSubmission = {
  gameId: 'arrow-puzzle' | 'fruit-merge'
  result: 'won' | 'lost'
  durationMs: number
  score?: number
  level?: number
  moves?: number
  mistakes?: number
  largestKind?: number
}

export async function submitSoloRun(run: SoloRunSubmission) {
  const response = await api.api['solo-runs'].post(run)
  return {saved: !response.error, unauthorized: response.error?.status === 401}
}

export async function soloHistory() {
  const response = await api.api.me['solo-runs'].get()
  const rows = response.data?.data
  if (response.error || !rows) throw new Error('Riwayat belum dapat dimuat.')
  return rows
}

export async function leaderboard(gameId: SoloRunSubmission['gameId']) {
  const response = await api.api.leaderboards({gameId}).get()
  const rows = response.data?.data
  if (response.error || !rows) throw new Error('Peringkat belum dapat dimuat.')
  return rows
}

import {treaty} from '@elysiajs/eden'
import type {App} from '@ruang-main/api'

export const apiOrigin = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : location.origin)).replace(/\/$/, '')
export const api = treaty<App>(apiOrigin, {fetch: {credentials: 'include'}})

export type SoloGameId = 'arrow-puzzle' | 'fruit-merge' | 'block-blast' | 'fruit-slice' | 'magic-bottles'

export type SoloRunSubmission = {
  gameId: SoloGameId
  result: 'won' | 'lost'
  durationMs: number
  score?: number
  level?: number
  moves?: number
  mistakes?: number
  largestKind?: number
  linesCleared?: number
  bestCombo?: number
  fruitsSliced?: number
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

const saveQueues = new Map<SoloGameId, Promise<unknown>>()

function queuedSave<T>(gameId: SoloGameId, operation: () => Promise<T>) {
  const previous = saveQueues.get(gameId) ?? Promise.resolve()
  const next = previous.catch(() => undefined).then(operation)
  saveQueues.set(gameId, next)
  return next.finally(() => {
    if (saveQueues.get(gameId) === next) saveQueues.delete(gameId)
  })
}

export async function loadSoloSave(gameId: SoloGameId) {
  const response = await api.api['solo-saves']({gameId}).get()
  if (response.error?.status === 401) return {authenticated: false as const, save: null}
  if (response.error) throw new Error('Save game belum dapat dimuat.')
  return {authenticated: true as const, save: response.data?.data ?? null}
}

export function saveSoloGame(gameId: SoloGameId, state: Record<string, unknown>) {
  return queuedSave(gameId, async () => {
    const response = await api.api['solo-saves']({gameId}).put({state})
    return !response.error
  })
}

export function archiveSoloGame(gameId: SoloGameId) {
  return queuedSave(gameId, async () => {
    const response = await api.api['solo-saves']({gameId}).archive.post()
    return !response.error
  })
}

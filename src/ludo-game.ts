export const ludoColors = ['red', 'blue', 'green', 'yellow'] as const
export type LudoColor = (typeof ludoColors)[number]

export const ludoColorNames: Record<LudoColor, string> = {
  red: 'Merah',
  blue: 'Biru',
  green: 'Hijau',
  yellow: 'Kuning',
}

export type LudoPlayer = {id: string; name: string; color: LudoColor | null; tokens: number[]}
export type LudoMove = {sequence: number; playerId: string; tokenIndex: number; from: number; to: number; capturedPlayerId?: string; capturedTokenIndex?: number}
export type LudoState = {
  gameId: 'ludo'
  phase: 'lobby' | 'playing' | 'finished'
  sequence: number
  hostId: string
  players: LudoPlayer[]
  currentPlayerId: string | null
  pendingRoll: number | null
  lastRoll: number | null
  lastMove: LudoMove | null
  winnerId: string | null
  log: string[]
}

export type LudoIntent =
  | {type: 'LUDO_SET_COLOR'; color: LudoColor}
  | {type: 'LUDO_START'}
  | {type: 'LUDO_ROLL'}
  | {type: 'LUDO_MOVE'; tokenIndex: number}

export const ludoTrackCells = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
] as const

export const ludoHomeCells: Record<LudoColor, readonly (readonly [number, number])[]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  blue: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  green: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
}

const colorOffsets: Record<LudoColor, number> = {red: 0, blue: 13, green: 26, yellow: 39}
const safeTrackCells = new Set(Object.values(colorOffsets))

export function createLudoLobby(hostId: string, hostName: string): LudoState {
  return {gameId: 'ludo', phase: 'lobby', sequence: 0, hostId, players: [player(hostId, hostName)], currentPlayerId: null, pendingRoll: null, lastRoll: null, lastMove: null, winnerId: null, log: []}
}

export function createLudoDemo(): LudoState {
  let state = createLudoLobby('demo-0', 'Raka')
  state = addLudoPlayer(state, 'demo-1', 'Sari')
  state = addLudoPlayer(state, 'demo-2', 'Bima')
  state = setLudoColor(state, 'demo-0', 'red')
  state = setLudoColor(state, 'demo-1', 'blue')
  state = setLudoColor(state, 'demo-2', 'green')
  return startLudo(state, 'demo-0')
}

export function addLudoPlayer(state: LudoState, id: string, name: string): LudoState {
  if (state.phase !== 'lobby' || state.players.some((item) => item.id === id) || state.players.length >= 4) return state
  return {...state, sequence: state.sequence + 1, players: [...state.players, player(id, name)]}
}

export function removeLudoPlayer(state: LudoState, id: string): LudoState {
  if (id === state.hostId || !state.players.some((item) => item.id === id)) return state
  const players = state.players.filter((item) => item.id !== id)
  const wasCurrent = state.currentPlayerId === id
  return {...state, sequence: state.sequence + 1, players, currentPlayerId: wasCurrent ? players[0]?.id ?? null : state.currentPlayerId, pendingRoll: wasCurrent ? null : state.pendingRoll}
}

export function setLudoColor(state: LudoState, requesterId: string, color: LudoColor): LudoState {
  if (state.phase !== 'lobby' || !ludoColors.includes(color) || state.players.some((item) => item.id !== requesterId && item.color === color)) return state
  const current = state.players.find((item) => item.id === requesterId)
  if (!current || current.color === color) return state
  return {...state, sequence: state.sequence + 1, players: state.players.map((item) => item.id === requesterId ? {...item, color} : item)}
}

export function startLudo(state: LudoState, requesterId: string): LudoState {
  if (state.phase !== 'lobby' || requesterId !== state.hostId || state.players.length < 2 || state.players.some((item) => !item.color)) return state
  return {...state, phase: 'playing', sequence: state.sequence + 1, currentPlayerId: state.players[0].id, log: ['Balapan Ludo dimulai.']}
}

export function movableLudoTokens(state: LudoState, playerId: string, roll = state.pendingRoll) {
  const current = state.players.find((item) => item.id === playerId)
  if (!current || roll === null) return []
  return current.tokens.flatMap((progress, index) => progress === -1 ? (roll === 6 ? [index] : []) : progress < 57 && progress + roll <= 57 ? [index] : [])
}

export function rollLudo(state: LudoState, requesterId: string, forcedRoll?: number): LudoState {
  if (state.phase !== 'playing' || state.currentPlayerId !== requesterId || state.pendingRoll !== null) return state
  const roll = forcedRoll ?? Math.floor(Math.random() * 6) + 1
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) return state
  const movable = movableLudoTokens(state, requesterId, roll)
  const current = state.players.find((item) => item.id === requesterId)!
  if (movable.length) return {...state, sequence: state.sequence + 1, pendingRoll: roll, lastRoll: roll, log: [...state.log, `${current.name} mendapat ${roll}.`].slice(-12)}
  return {...state, sequence: state.sequence + 1, lastRoll: roll, currentPlayerId: roll === 6 ? requesterId : nextPlayerId(state, requesterId), log: [...state.log, `${current.name} mendapat ${roll}, tetapi tidak ada pion yang dapat bergerak.`].slice(-12)}
}

export function moveLudoToken(state: LudoState, requesterId: string, tokenIndex: number): LudoState {
  if (state.phase !== 'playing' || state.currentPlayerId !== requesterId || state.pendingRoll === null || !movableLudoTokens(state, requesterId).includes(tokenIndex)) return state
  const roll = state.pendingRoll
  const current = state.players.find((item) => item.id === requesterId)!
  const from = current.tokens[tokenIndex]
  const to = from === -1 ? 0 : from + roll
  let capturedPlayerId: string | undefined
  let capturedTokenIndex: number | undefined
  let players = state.players.map((item) => item.id === requesterId ? {...item, tokens: item.tokens.map((progress, index) => index === tokenIndex ? to : progress)} : item)
  const landing = current.color && to <= 51 ? globalTrackIndex(current.color, to) : -1
  if (landing >= 0 && !safeTrackCells.has(landing)) {
    players = players.map((item) => {
      if (item.id === requesterId || !item.color) return item
      const hitIndex = item.tokens.findIndex((progress) => progress >= 0 && progress <= 51 && globalTrackIndex(item.color!, progress) === landing)
      if (hitIndex < 0) return item
      capturedPlayerId = item.id
      capturedTokenIndex = hitIndex
      return {...item, tokens: item.tokens.map((progress, index) => index === hitIndex ? -1 : progress)}
    })
  }
  const movedPlayer = players.find((item) => item.id === requesterId)!
  const winnerId = movedPlayer.tokens.every((progress) => progress === 57) ? requesterId : null
  const captured = capturedPlayerId ? ` dan memulangkan pion ${players.find((item) => item.id === capturedPlayerId)?.name}` : ''
  return {
    ...state,
    phase: winnerId ? 'finished' : 'playing',
    sequence: state.sequence + 1,
    players,
    currentPlayerId: winnerId ? null : roll === 6 ? requesterId : nextPlayerId(state, requesterId),
    pendingRoll: null,
    lastMove: {sequence: state.sequence + 1, playerId: requesterId, tokenIndex, from, to, capturedPlayerId, capturedTokenIndex},
    winnerId,
    log: [...state.log, `${current.name} menggerakkan pion ${tokenIndex + 1}${captured}.`].slice(-12),
  }
}

export function globalTrackIndex(color: LudoColor, progress: number) {
  return (colorOffsets[color] + progress) % 52
}

export function isLudoState(value: unknown): value is LudoState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<LudoState>
  return state.gameId === 'ludo' && (state.phase === 'lobby' || state.phase === 'playing' || state.phase === 'finished') && typeof state.sequence === 'number' && typeof state.hostId === 'string' && Array.isArray(state.players)
}

function player(id: string, name: string): LudoPlayer {
  return {id, name: name.trim().slice(0, 20) || 'Pemain', color: null, tokens: [-1, -1, -1, -1]}
}

function nextPlayerId(state: LudoState, currentId: string) {
  const index = state.players.findIndex((item) => item.id === currentId)
  return state.players[(index + 1) % state.players.length].id
}

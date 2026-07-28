export const snakeMapIds = ['forest', 'ocean', 'space', 'candy'] as const
export type SnakeMapId = (typeof snakeMapIds)[number]

export type SnakeMap = {
  id: SnakeMapId
  name: string
  tagline: string
  ladders: Record<number, number>
  snakes: Record<number, number>
}

export const snakeMaps: readonly SnakeMap[] = [
  {id: 'forest', name: 'Hutan Tropis', tagline: 'Rimbun, hangat, dan penuh jalur rahasia.', ladders: {3: 22, 18: 41, 36: 55, 62: 81, 79: 96}, snakes: {27: 8, 48: 26, 71: 52, 94: 73, 99: 77}},
  {id: 'ocean', name: 'Laut Nusantara', tagline: 'Arus biru, terumbu, dan ombak besar.', ladders: {5: 24, 12: 34, 33: 57, 54: 76, 72: 92}, snakes: {29: 9, 46: 25, 69: 49, 87: 65, 98: 78}},
  {id: 'space', name: 'Lintasan Angkasa', tagline: 'Orbit gelap dengan pintasan antarbintang.', ladders: {2: 19, 16: 38, 31: 53, 60: 83, 74: 95}, snakes: {28: 7, 45: 23, 67: 47, 89: 68, 97: 75}},
  {id: 'candy', name: 'Negeri Permen', tagline: 'Manis, cerah, tetapi tetap penuh jebakan.', ladders: {4: 23, 14: 37, 35: 58, 56: 78, 75: 93}, snakes: {26: 6, 44: 21, 66: 43, 86: 64, 99: 79}},
] as const

export type SnakePlayer = {id: string; name: string; position: number}
export type SnakeMove = {sequence: number; playerId: string; from: number; landed: number; to: number; roll: number; effect: 'ladder' | 'snake' | 'none'}
export type SnakesState = {
  gameId: 'snakes-ladders'
  phase: 'lobby' | 'playing' | 'finished'
  sequence: number
  hostId: string
  players: SnakePlayer[]
  mapId: SnakeMapId
  currentPlayerId: string | null
  lastRoll: number | null
  lastMove: SnakeMove | null
  winnerId: string | null
  log: string[]
}

export type SnakesIntent =
  | {type: 'SNAKES_SET_MAP'; mapId: SnakeMapId}
  | {type: 'SNAKES_START'}
  | {type: 'SNAKES_ROLL'}

export function snakeMap(id: SnakeMapId) {
  return snakeMaps.find((map) => map.id === id) ?? snakeMaps[0]
}

export function createSnakesLobby(hostId: string, hostName: string): SnakesState {
  return {gameId: 'snakes-ladders', phase: 'lobby', sequence: 0, hostId, players: [{id: hostId, name: cleanName(hostName), position: 1}], mapId: 'forest', currentPlayerId: null, lastRoll: null, lastMove: null, winnerId: null, log: []}
}

export function createSnakesDemo(): SnakesState {
  return startSnakes(addSnakesPlayer(addSnakesPlayer(createSnakesLobby('demo-0', 'Thoriq'), 'demo-1', 'Sari'), 'demo-2', 'Bima'), 'demo-0')
}

export function addSnakesPlayer(state: SnakesState, id: string, name: string): SnakesState {
  if (state.phase !== 'lobby' || state.players.some((player) => player.id === id) || state.players.length >= 4) return state
  return {...state, sequence: state.sequence + 1, players: [...state.players, {id, name: cleanName(name), position: 1}]}
}

export function removeSnakesPlayer(state: SnakesState, id: string): SnakesState {
  if (!state.players.some((player) => player.id === id) || id === state.hostId) return state
  const players = state.players.filter((player) => player.id !== id)
  const currentPlayerId = state.currentPlayerId === id ? players[0]?.id ?? null : state.currentPlayerId
  return {...state, sequence: state.sequence + 1, players, currentPlayerId}
}

export function setSnakesMap(state: SnakesState, requesterId: string, mapId: SnakeMapId): SnakesState {
  if (state.phase !== 'lobby' || requesterId !== state.hostId || !snakeMapIds.includes(mapId) || state.mapId === mapId) return state
  return {...state, sequence: state.sequence + 1, mapId}
}

export function startSnakes(state: SnakesState, requesterId: string): SnakesState {
  if (state.phase !== 'lobby' || requesterId !== state.hostId || state.players.length < 2) return state
  return {...state, phase: 'playing', sequence: state.sequence + 1, currentPlayerId: state.players[0].id, log: [`Peta ${snakeMap(state.mapId).name} dimulai.`]}
}

export function rollSnakes(state: SnakesState, requesterId: string, forcedRoll?: number): SnakesState {
  if (state.phase !== 'playing' || state.currentPlayerId !== requesterId) return state
  const roll = forcedRoll ?? Math.floor(Math.random() * 6) + 1
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) return state
  const player = state.players.find((item) => item.id === requesterId)!
  const landed = player.position + roll <= 100 ? player.position + roll : player.position
  const map = snakeMap(state.mapId)
  const ladder = map.ladders[landed]
  const snake = map.snakes[landed]
  const to = ladder ?? snake ?? landed
  const effect: SnakeMove['effect'] = ladder ? 'ladder' : snake ? 'snake' : 'none'
  const players = state.players.map((item) => item.id === requesterId ? {...item, position: to} : item)
  const winnerId = to === 100 ? requesterId : null
  const playerIndex = state.players.findIndex((item) => item.id === requesterId)
  const nextPlayerId = winnerId ? null : state.players[(playerIndex + 1) % state.players.length].id
  const effectText = effect === 'ladder' ? ` dan naik tangga ke ${to}` : effect === 'snake' ? ` lalu turun ke ${to}` : ''
  return {
    ...state,
    phase: winnerId ? 'finished' : 'playing',
    sequence: state.sequence + 1,
    players,
    currentPlayerId: nextPlayerId,
    lastRoll: roll,
    lastMove: {sequence: state.sequence + 1, playerId: requesterId, from: player.position, landed, to, roll, effect},
    winnerId,
    log: [...state.log, `${player.name} mendapat ${roll}, mendarat di ${landed}${effectText}.`].slice(-12),
  }
}

export function isSnakesState(value: unknown): value is SnakesState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<SnakesState>
  return state.gameId === 'snakes-ladders' && (state.phase === 'lobby' || state.phase === 'playing' || state.phase === 'finished') && typeof state.sequence === 'number' && typeof state.hostId === 'string' && Array.isArray(state.players) && snakeMapIds.includes(state.mapId as SnakeMapId)
}

function cleanName(name: string) {
  return name.trim().slice(0, 20) || 'Pemain'
}

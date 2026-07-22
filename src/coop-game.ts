export const COOP_MAX_HEALTH = 100
export const COOP_SESSION_MS = 180_000

export const coopRoles = ['navigation', 'engineering', 'defense', 'comms'] as const
export type CoopRole = (typeof coopRoles)[number]
export type CoopPhase = 'lobby' | 'playing' | 'finished'
export type CoopSignal = 'help' | 'check-panel' | 'ready' | 'repeat'

export type CoopPlayer = {
  id: string
  name: string
  role: CoopRole | null
  ready: boolean
}

export type CoopActionId =
  | 'align-course'
  | 'brake-burn'
  | 'scan-sector'
  | 'route-power'
  | 'seal-coolant'
  | 'vent-reactor'
  | 'charge-shield'
  | 'seal-hull'
  | 'suppress-fire'
  | 'lock-frequency'
  | 'decode-signal'
  | 'jam-transmission'

export type CoopActionDefinition = {
  id: CoopActionId
  role: CoopRole
  label: string
  hint: string
}

export const coopActions: CoopActionDefinition[] = [
  {id: 'align-course', role: 'navigation', label: 'Selaraskan arah', hint: 'Kunci haluan ke koordinat aman.'},
  {id: 'brake-burn', role: 'navigation', label: 'Rem pendorong', hint: 'Kurangi laju stasiun dengan cepat.'},
  {id: 'scan-sector', role: 'navigation', label: 'Pindai sektor', hint: 'Baca jalur ancaman terdekat.'},
  {id: 'route-power', role: 'engineering', label: 'Alihkan daya', hint: 'Pindahkan suplai ke modul prioritas.'},
  {id: 'seal-coolant', role: 'engineering', label: 'Tutup pendingin', hint: 'Isolasi jalur cairan yang bocor.'},
  {id: 'vent-reactor', role: 'engineering', label: 'Buang tekanan', hint: 'Lepaskan tekanan inti bertahap.'},
  {id: 'charge-shield', role: 'defense', label: 'Isi perisai', hint: 'Naikkan daya perisai luar.'},
  {id: 'seal-hull', role: 'defense', label: 'Kunci lambung', hint: 'Tutup sekat yang kehilangan tekanan.'},
  {id: 'suppress-fire', role: 'defense', label: 'Padamkan modul', hint: 'Aktifkan pemadam pada ruang terdampak.'},
  {id: 'lock-frequency', role: 'comms', label: 'Kunci frekuensi', hint: 'Stabilkan kanal komunikasi kru.'},
  {id: 'decode-signal', role: 'comms', label: 'Dekripsi sinyal', hint: 'Terjemahkan paket data yang masuk.'},
  {id: 'jam-transmission', role: 'comms', label: 'Putus transmisi', hint: 'Hentikan gangguan dari luar stasiun.'},
]

export type CoopCrisis = {
  id: string
  title: string
  prompt: string
  callout: string
  sourceRole: CoopRole
  targetRole: CoopRole
  action: CoopActionId
  createdAt: number
  expiresAt: number
}

export type CoopState = {
  gameId: 'panic-crew'
  phase: CoopPhase
  sequence: number
  hostId: string
  players: CoopPlayer[]
  health: number
  score: number
  wave: number
  activeCrises: CoopCrisis[]
  nextCrisisAt: number | null
  startedAt: number | null
  finishedAt: number | null
  outcome: 'survived' | 'failed' | 'crew-left' | null
  latestSignal: {playerId: string; signal: CoopSignal; sequence: number} | null
  log: string[]
}

export type CoopIntent =
  | {type: 'COOP_SET_ROLE'; role: CoopRole}
  | {type: 'COOP_TOGGLE_READY'}
  | {type: 'COOP_START'}
  | {type: 'COOP_ACTION'; action: CoopActionId}
  | {type: 'COOP_SIGNAL'; signal: CoopSignal}

type CrisisTemplate = Omit<CoopCrisis, 'id' | 'createdAt' | 'expiresAt'>

const crisisTemplates: CrisisTemplate[] = [
  {title: 'Lintasan meteor', prompt: 'Objek cepat masuk dari kanan. Minta Pertahanan mengisi perisai.', callout: 'METEOR KANAN', sourceRole: 'navigation', targetRole: 'defense', action: 'charge-shield'},
  {title: 'Putaran berlebih', prompt: 'Stasiun keluar dari sumbu aman. Minta Navigasi melakukan rem pendorong.', callout: 'ROTASI MERAH', sourceRole: 'engineering', targetRole: 'navigation', action: 'brake-burn'},
  {title: 'Tekanan reaktor', prompt: 'Tekanan inti melewati batas. Minta Mesin membuang tekanan.', callout: 'INTI 7', sourceRole: 'defense', targetRole: 'engineering', action: 'vent-reactor'},
  {title: 'Kanal terputus', prompt: 'Telemetri navigasi terpecah. Minta Komunikasi mengunci frekuensi.', callout: 'KANAL 42', sourceRole: 'navigation', targetRole: 'comms', action: 'lock-frequency'},
  {title: 'Bocoran pendingin', prompt: 'Jalur pendingin sisi bawah bocor. Minta Mesin menutup pendingin.', callout: 'PIPA BAWAH', sourceRole: 'comms', targetRole: 'engineering', action: 'seal-coolant'},
  {title: 'Retak lambung', prompt: 'Sensor membaca retakan di dek luar. Minta Pertahanan mengunci lambung.', callout: 'DEK LUAR', sourceRole: 'engineering', targetRole: 'defense', action: 'seal-hull'},
  {title: 'Paket asing', prompt: 'Sinyal tanpa identitas masuk ke sistem. Minta Komunikasi mendekripsi sinyal.', callout: 'PAKET VEGA', sourceRole: 'defense', targetRole: 'comms', action: 'decode-signal'},
  {title: 'Jalur tabrakan', prompt: 'Puing berada tepat di depan stasiun. Minta Navigasi menyelaraskan arah.', callout: 'HALUAN 18', sourceRole: 'comms', targetRole: 'navigation', action: 'align-course'},
]

export const coopRoleLabel: Record<CoopRole, string> = {
  navigation: 'Navigasi',
  engineering: 'Mesin',
  defense: 'Pertahanan',
  comms: 'Komunikasi',
}

export function createCoopLobby(hostId: string, hostName: string): CoopState {
  return {
    gameId: 'panic-crew', phase: 'lobby', sequence: 0, hostId,
    players: [{id: hostId, name: cleanName(hostName), role: null, ready: false}],
    health: COOP_MAX_HEALTH, score: 0, wave: 1, activeCrises: [], nextCrisisAt: null,
    startedAt: null, finishedAt: null, outcome: null, latestSignal: null,
    log: [`${cleanName(hostName)} membuka ruang kendali.`],
  }
}

export function addCoopPlayer(state: CoopState, id: string, name: string): CoopState {
  if (state.phase !== 'lobby' || state.players.length >= 4 || state.players.some((player) => player.id === id)) return state
  const player = {id, name: cleanName(name), role: null, ready: false} satisfies CoopPlayer
  return {...state, sequence: state.sequence + 1, players: [...state.players, player], log: addLog(state.log, `${player.name} bergabung.`)}
}

export function removeCoopPlayer(state: CoopState, id: string, now = Date.now()): CoopState {
  const leaving = state.players.find((player) => player.id === id)
  if (!leaving) return state
  const players = state.players.filter((player) => player.id !== id)
  if (state.phase === 'lobby') return {...state, sequence: state.sequence + 1, players, log: addLog(state.log, `${leaving.name} keluar.`)}
  if (state.phase === 'playing' && players.length < 2) {
    return {...state, sequence: state.sequence + 1, phase: 'finished', players, activeCrises: [], nextCrisisAt: null, finishedAt: now, outcome: 'crew-left', log: addLog(state.log, 'Kru tidak cukup untuk melanjutkan misi.')}
  }
  const activeCrises = leaving.role ? state.activeCrises.filter((crisis) => crisis.sourceRole !== leaving.role && crisis.targetRole !== leaving.role) : state.activeCrises
  return {...state, sequence: state.sequence + 1, players, activeCrises, log: addLog(state.log, `${leaving.name} terputus dari kru.`)}
}

export function setCoopRole(state: CoopState, requesterId: string, role: CoopRole): CoopState {
  if (state.phase !== 'lobby' || !coopRoles.includes(role) || state.players.some((player) => player.id !== requesterId && player.role === role)) return state
  const player = state.players.find((item) => item.id === requesterId)
  if (!player || player.role === role) return state
  const players = state.players.map((item) => item.id === requesterId ? {...item, role, ready: false} : item)
  return {...state, sequence: state.sequence + 1, players, log: addLog(state.log, `${player.name} memilih ${coopRoleLabel[role]}.`)}
}

export function toggleCoopReady(state: CoopState, requesterId: string): CoopState {
  if (state.phase !== 'lobby') return state
  const player = state.players.find((item) => item.id === requesterId)
  if (!player?.role) return state
  const players = state.players.map((item) => item.id === requesterId ? {...item, ready: !item.ready} : item)
  return {...state, sequence: state.sequence + 1, players, log: addLog(state.log, `${player.name} ${player.ready ? 'belum siap' : 'siap bertugas'}.`)}
}

export function canStartCoop(state: CoopState) {
  return state.phase === 'lobby' && state.players.length >= 2 && state.players.every((player) => player.role && player.ready) && new Set(state.players.map((player) => player.role)).size === state.players.length
}

export function startCoop(state: CoopState, requesterId: string, now = Date.now()): CoopState {
  if (requesterId !== state.hostId || !canStartCoop(state)) return state
  return {...state, phase: 'playing', sequence: state.sequence + 1, startedAt: now, nextCrisisAt: now + 1_500, log: addLog(state.log, 'Misi dimulai. Pantau panel dan dengarkan kru.')}
}

export function tickCoop(state: CoopState, requesterId: string, now = Date.now(), random: () => number = Math.random): CoopState {
  if (state.phase !== 'playing' || requesterId !== state.hostId || state.startedAt === null) return state
  const expired = state.activeCrises.filter((crisis) => crisis.expiresAt <= now)
  let activeCrises = state.activeCrises.filter((crisis) => crisis.expiresAt > now)
  let health = Math.max(0, state.health - expired.length * 20)
  const wave = Math.min(6, 1 + Math.floor((now - state.startedAt) / 30_000))
  let nextCrisisAt = state.nextCrisisAt
  let changed = expired.length > 0 || wave !== state.wave
  let log = expired.reduce((items, crisis) => addLog(items, `${crisis.title} gagal ditangani. Integritas turun.`), state.log)

  if (health === 0) {
    return {...state, phase: 'finished', sequence: state.sequence + 1, health, wave, activeCrises: [], nextCrisisAt: null, finishedAt: now, outcome: 'failed', log: addLog(log, 'Stasiun tidak dapat dipertahankan.')}
  }
  if (now - state.startedAt >= COOP_SESSION_MS) {
    return {...state, phase: 'finished', sequence: state.sequence + 1, health, wave, activeCrises: [], nextCrisisAt: null, finishedAt: now, outcome: 'survived', log: addLog(log, 'Kru mempertahankan stasiun sampai bantuan tiba.')}
  }

  const activeLimit = wave >= 5 ? 3 : wave >= 2 ? 2 : 1
  if (nextCrisisAt !== null && now >= nextCrisisAt && activeCrises.length < activeLimit) {
    const roles = new Set(state.players.flatMap((player) => player.role ? [player.role] : []))
    const eligible = crisisTemplates.filter((template) => roles.has(template.sourceRole) && roles.has(template.targetRole))
    if (eligible.length > 0) {
      const template = eligible[Math.min(eligible.length - 1, Math.floor(Math.max(0, random()) * eligible.length))]
      const duration = Math.max(8_000, 15_000 - (wave - 1) * 1_000)
      const crisis: CoopCrisis = {...template, id: `crisis-${state.sequence + 1}-${now}`, createdAt: now, expiresAt: now + duration}
      activeCrises = [...activeCrises, crisis]
      log = addLog(log, `Krisis baru: ${crisis.title}.`)
      changed = true
    }
    nextCrisisAt = now + Math.max(4_500, 10_000 - (wave - 1) * 1_000)
  }

  if (!changed && nextCrisisAt === state.nextCrisisAt) return state
  return {...state, sequence: state.sequence + 1, health, wave, activeCrises, nextCrisisAt, log}
}

export function performCoopAction(state: CoopState, requesterId: string, action: CoopActionId, now = Date.now()): CoopState {
  if (state.phase !== 'playing') return state
  const role = state.players.find((player) => player.id === requesterId)?.role
  const definition = coopActions.find((item) => item.id === action)
  if (!role || definition?.role !== role) return state
  const crisis = state.activeCrises.find((item) => item.action === action && item.targetRole === role && item.expiresAt > now)
  if (!crisis) return state
  const seconds = Math.max(0, Math.ceil((crisis.expiresAt - now) / 1_000))
  return {
    ...state,
    sequence: state.sequence + 1,
    score: state.score + 100 + seconds * 10,
    activeCrises: state.activeCrises.filter((item) => item.id !== crisis.id),
    log: addLog(state.log, `${crisis.title} diselesaikan oleh ${coopRoleLabel[role]}.`),
  }
}

export function sendCoopSignal(state: CoopState, requesterId: string, signal: CoopSignal): CoopState {
  if (state.phase !== 'playing' || !state.players.some((player) => player.id === requesterId)) return state
  return {...state, sequence: state.sequence + 1, latestSignal: {playerId: requesterId, signal, sequence: state.sequence + 1}}
}

export function createCoopDemo(now = Date.now()): CoopState {
  const names = ['Raka', 'Sari', 'Bima', 'Naya']
  let state = createCoopLobby('demo-0', names[0])
  for (let index = 1; index < names.length; index += 1) state = addCoopPlayer(state, `demo-${index}`, names[index])
  coopRoles.forEach((role, index) => {
    state = setCoopRole(state, `demo-${index}`, role)
    state = toggleCoopReady(state, `demo-${index}`)
  })
  return startCoop(state, 'demo-0', now)
}

export function isCoopState(value: unknown): value is CoopState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<CoopState>
  return state.gameId === 'panic-crew' && ['lobby', 'playing', 'finished'].includes(state.phase ?? '') && typeof state.sequence === 'number' && Array.isArray(state.players)
}

function cleanName(name: string) {
  return name.trim().slice(0, 20) || 'Kru'
}

function addLog(log: string[], message: string) {
  return [...log.slice(-7), message]
}

import {joinRoom, selfId} from 'trystero'
import type {DataPayload, JsonValue} from 'trystero'
import type {GameIntent, GameState} from '../games/monopoly/game'
import {isSnakesState, snakeMapIds, type SnakesIntent, type SnakesState} from '../games/snakes/snakes-game.ts'
import {isLudoState, ludoColors, type LudoIntent, type LudoState} from '../games/ludo/ludo-game.ts'

export type RoomGameId = 'monopoly' | 'snakes-ladders' | 'ludo'
export type RoomIntent = GameIntent | SnakesIntent | LudoIntent
export type RoomState = GameState | SnakesState | LudoState

type NetworkCallbacks = {
  onHello: (name: string, peerId: string) => void
  onIntent: (intent: RoomIntent, peerId: string) => void
  onSnapshot: (state: RoomState, peerId: string) => void
  onPeerJoin: (peerId: string, reconnected: boolean) => void
  onPeerDisconnect: (peerId: string, retryMs: number) => void
  onPeerLeave: (peerId: string) => void
  onError: (message: string) => void
}

export const PEER_RECONNECT_GRACE_MS = 12_000

type TimerApi<Timer> = {
  set: (callback: () => void, delayMs: number) => Timer
  clear: (timer: Timer) => void
}

export function createPeerLeaveGrace<Timer = ReturnType<typeof setTimeout>>(
  onExpired: (peerId: string) => void,
  delayMs = PEER_RECONNECT_GRACE_MS,
  timers: TimerApi<Timer> = {
    set: (callback, delay) => setTimeout(callback, delay),
    clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
  } as TimerApi<Timer>,
) {
  const pending = new Map<string, Timer>()
  return {
    disconnect(peerId: string) {
      if (pending.has(peerId)) return false
      const timer = timers.set(() => {
        pending.delete(peerId)
        onExpired(peerId)
      }, delayMs)
      pending.set(peerId, timer)
      return true
    },
    reconnect(peerId: string) {
      const timer = pending.get(peerId)
      if (timer === undefined) return false
      timers.clear(timer)
      pending.delete(peerId)
      return true
    },
    clear() {
      pending.forEach((timer) => timers.clear(timer))
      pending.clear()
    },
  }
}

export type NetworkSession = {
  selfId: string
  sendIntent: (intent: RoomIntent) => Promise<void>
  sendSnapshot: (state: RoomState) => Promise<void>
  leave: () => Promise<void>
}

export function connectRoom(roomCode: string, name: string, gameId: RoomGameId, callbacks: NetworkCallbacks): NetworkSession {
  const room = joinRoom(
    {appId: `mini-games-coop-${gameId}-v1`},
    roomCode,
    {onJoinError: ({error}) => callbacks.onError(`Koneksi P2P gagal: ${error}`)},
  )

  const hello = room.makeAction('hello')
  const intent = room.makeAction('intent')
  const snapshot = room.makeAction('snapshot')
  const peerLeaveGrace = createPeerLeaveGrace(callbacks.onPeerLeave)

  hello.onMessage = (payload, {peerId}) => {
    if (isObject(payload) && typeof payload.name === 'string') callbacks.onHello(payload.name.slice(0, 20), peerId)
  }

  intent.onMessage = (payload, {peerId}) => {
    if (isIntent(payload, gameId)) callbacks.onIntent(payload as unknown as RoomIntent, peerId)
  }

  snapshot.onMessage = (payload, {peerId}) => {
    if (isRoomState(payload, gameId)) callbacks.onSnapshot(payload as unknown as RoomState, peerId)
  }

  room.onPeerJoin = (peerId) => {
    const reconnected = peerLeaveGrace.reconnect(peerId)
    callbacks.onPeerJoin(peerId, reconnected)
    void hello.send({name}, {target: peerId})
  }
  room.onPeerLeave = (peerId) => {
    if (peerLeaveGrace.disconnect(peerId)) callbacks.onPeerDisconnect(peerId, PEER_RECONNECT_GRACE_MS)
  }

  return {
    selfId,
    sendIntent: (data) => intent.send(data as unknown as DataPayload),
    sendSnapshot: (state) => snapshot.send(state as unknown as DataPayload),
    leave: () => {
      peerLeaveGrace.clear()
      return room.leave()
    },
  }
}

export function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export function normalizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 16)
}

function isObject(value: DataPayload): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !ArrayBuffer.isView(value) && !(value instanceof ArrayBuffer) && !(value instanceof Blob)
}

function isIntent(value: DataPayload, gameId: RoomGameId) {
  if (!isObject(value) || typeof value.type !== 'string') return false
  if (gameId === 'snakes-ladders') {
    if (value.type === 'SNAKES_START' || value.type === 'SNAKES_ROLL') return true
    return value.type === 'SNAKES_SET_MAP' && typeof value.mapId === 'string' && snakeMapIds.includes(value.mapId as (typeof snakeMapIds)[number])
  }
  if (gameId === 'ludo') {
    if (value.type === 'LUDO_START' || value.type === 'LUDO_ROLL') return true
    if (value.type === 'LUDO_MOVE') return Number.isInteger(value.tokenIndex) && Number(value.tokenIndex) >= 0 && Number(value.tokenIndex) < 4
    return value.type === 'LUDO_SET_COLOR' && typeof value.color === 'string' && ludoColors.includes(value.color as (typeof ludoColors)[number])
  }
  if (['START_GAME', 'ROLL_DICE', 'RESOLVE_CARD', 'BUY_ASSET', 'PASS_ASSET', 'CLOSE_AUCTION', 'PAY_JAIL_FINE', 'DECLARE_BANKRUPTCY'].includes(value.type)) return true
  if (['BUILD', 'SELL_BUILDING', 'MORTGAGE', 'REDEEM_MORTGAGE'].includes(value.type)) return Number.isInteger(value.position)
  if (value.type === 'PLACE_BID') return Number.isSafeInteger(value.amount) && Number(value.amount) >= 0
  if (value.type === 'USE_JAIL_CARD') return value.deck === 'chance' || value.deck === 'community'
  if (value.type === 'RESPOND_TRADE') return typeof value.accept === 'boolean'
  if (value.type === 'PROPOSE_TRADE' && isObject(value.offer)) {
    const offer = value.offer
    return typeof offer.toId === 'string' && Number.isSafeInteger(offer.cashFrom) && Number.isSafeInteger(offer.cashTo) &&
      (offer.assetFrom === null || Number.isInteger(offer.assetFrom)) && (offer.assetTo === null || Number.isInteger(offer.assetTo)) &&
      (offer.jailCardFrom === null || offer.jailCardFrom === 'chance' || offer.jailCardFrom === 'community') &&
      (offer.jailCardTo === null || offer.jailCardTo === 'chance' || offer.jailCardTo === 'community')
  }
  return false
}

function isRoomState(value: DataPayload, gameId: RoomGameId) {
  if (gameId === 'snakes-ladders') return isSnakesState(value)
  if (gameId === 'ludo') return isLudoState(value)
  return (
    isObject(value) &&
    (value.phase === 'lobby' || value.phase === 'playing' || value.phase === 'finished') &&
    typeof value.sequence === 'number' &&
    Array.isArray(value.players)
  )
}

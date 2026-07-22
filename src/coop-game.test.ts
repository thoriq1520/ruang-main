import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addCoopPlayer,
  canStartCoop,
  createCoopLobby,
  performCoopAction,
  setCoopRole,
  startCoop,
  tickCoop,
  toggleCoopReady,
  type CoopState,
} from './coop-game.ts'

function readyLobby() {
  let state = addCoopPlayer(createCoopLobby('host', 'Raka'), 'peer', 'Sari')
  state = setCoopRole(state, 'host', 'navigation')
  state = setCoopRole(state, 'peer', 'defense')
  state = toggleCoopReady(state, 'host')
  return toggleCoopReady(state, 'peer')
}

test('peran harus unik dan semua kru siap sebelum host memulai', () => {
  let state = addCoopPlayer(createCoopLobby('host', 'Raka'), 'peer', 'Sari')
  state = setCoopRole(state, 'host', 'navigation')
  assert.equal(setCoopRole(state, 'peer', 'navigation'), state)
  assert.equal(canStartCoop(state), false)
  assert.equal(startCoop(state, 'host', 1_000), state)
  assert.equal(startCoop(readyLobby(), 'peer', 1_000).phase, 'lobby')
  assert.equal(startCoop(readyLobby(), 'host', 1_000).phase, 'playing')
})

test('host membuat krisis yang dapat ditangani oleh peran aktif', () => {
  const playing = startCoop(readyLobby(), 'host', 1_000)
  const state = tickCoop(playing, 'host', 2_500, () => 0)
  assert.equal(state.activeCrises.length, 1)
  assert.equal(state.activeCrises[0].sourceRole, 'navigation')
  assert.equal(state.activeCrises[0].targetRole, 'defense')
  assert.equal(state.activeCrises[0].action, 'charge-shield')
})

test('hanya pemain dengan panel tepat yang dapat menyelesaikan krisis', () => {
  const playing = tickCoop(startCoop(readyLobby(), 'host', 1_000), 'host', 2_500, () => 0)
  assert.equal(performCoopAction(playing, 'host', 'charge-shield', 3_000), playing)
  const solved = performCoopAction(playing, 'peer', 'charge-shield', 3_000)
  assert.equal(solved.activeCrises.length, 0)
  assert.equal(solved.score, 250)
})

test('krisis kedaluwarsa mengurangi integritas satu kali', () => {
  const playing = tickCoop(startCoop(readyLobby(), 'host', 1_000), 'host', 2_500, () => 0)
  const expiredAt = playing.activeCrises[0].expiresAt
  const damaged = tickCoop(playing, 'host', expiredAt, () => 0)
  assert.equal(damaged.health, 80)
  assert.notEqual(damaged.activeCrises[0]?.id, playing.activeCrises[0].id)
  assert.equal(tickCoop(damaged, 'host', expiredAt + 1, () => 0).health, 80)
})

test('integritas nol mengakhiri misi', () => {
  const playing = tickCoop(startCoop(readyLobby(), 'host', 1_000), 'host', 2_500, () => 0)
  const critical: CoopState = {...playing, health: 20}
  const failed = tickCoop(critical, 'host', playing.activeCrises[0].expiresAt, () => 0)
  assert.equal(failed.phase, 'finished')
  assert.equal(failed.outcome, 'failed')
})

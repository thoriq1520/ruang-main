import test from 'node:test'
import assert from 'node:assert/strict'
import {addLudoPlayer, createLudoLobby, globalTrackIndex, movableLudoTokens, moveLudoToken, rollLudo, setLudoColor, startLudo, type LudoState} from './ludo-game.ts'

function readyGame() {
  let state = addLudoPlayer(createLudoLobby('a', 'Thoriq'), 'b', 'Sari')
  state = setLudoColor(state, 'a', 'red')
  state = setLudoColor(state, 'b', 'blue')
  return startLudo(state, 'a')
}

test('warna harus unik dan semua pemain memilih warna sebelum mulai', () => {
  let state = addLudoPlayer(createLudoLobby('a', 'Thoriq'), 'b', 'Sari')
  state = setLudoColor(state, 'a', 'red')
  assert.equal(setLudoColor(state, 'b', 'red'), state)
  assert.equal(startLudo(state, 'a'), state)
  state = setLudoColor(state, 'b', 'blue')
  assert.equal(startLudo(state, 'a').phase, 'playing')
})

test('pion hanya dapat keluar dari markas dengan angka enam', () => {
  let state = readyGame()
  const rollSequence = state.sequence + 1
  state = rollLudo(state, 'a', 3)
  assert.equal(state.lastRollSequence, rollSequence)
  assert.deepEqual(state.players[0].tokens, [-1, -1, -1, -1])
  assert.equal(state.currentPlayerId, 'b')
  state = rollLudo(state, 'b', 6)
  state = moveLudoToken(state, 'b', 0)
  assert.equal(state.players[1].tokens[0], 0)
  assert.equal(state.currentPlayerId, 'b')
})

test('mendarat pada pion lawan memulangkannya ke markas dan memberi giliran tambahan', () => {
  let state = readyGame()
  state = {...state, players: [{...state.players[0], tokens: [10, -1, -1, -1]}, {...state.players[1], tokens: [50, -1, -1, -1]}], currentPlayerId: 'a'}
  assert.equal(globalTrackIndex('red', 11), globalTrackIndex('blue', 50))
  state = rollLudo(state, 'a', 1)
  state = moveLudoToken(state, 'a', 0)
  assert.equal(state.players[1].tokens[0], -1, 'pion lawan kembali ke markas')
  assert.equal(state.currentPlayerId, 'a', 'pemain yang menangkap mendapat giliran tambahan')
})

test('harus mendarat tepat dan empat pion selesai untuk menang', () => {
  let state: LudoState = {...readyGame(), players: [{...readyGame().players[0], tokens: [56, 57, 57, 57]}, readyGame().players[1]], currentPlayerId: 'a'}
  assert.equal(rollLudo(state, 'a', 2).pendingRoll, null)
  state = rollLudo(state, 'a', 1)
  state = moveLudoToken(state, 'a', 0)
  assert.equal(state.phase, 'finished')
  assert.equal(state.winnerId, 'a')
})

test('pion sendiri tidak boleh menempati petak non-safe yang sama', () => {
  let state = readyGame()
  // Place two red pawns: one at progress 5, one at progress 2
  state = {...state, players: [{...state.players[0], tokens: [5, 2, -1, -1]}, state.players[1]], currentPlayerId: 'a', pendingRoll: 3}
  // Pawn 1 (progress 2) wants to move +3 = 5, but pawn 0 is already at 5 (non-safe cell)
  const movable = movableLudoTokens(state, 'a')
  assert.ok(!movable.includes(1), 'pion 1 tidak bisa ke petak yang sudah ada pion sendiri (non-safe)')
  assert.ok(movable.includes(0), 'pion 0 tetap bisa bergerak ke petak lain')
})


import test from 'node:test'
import assert from 'node:assert/strict'
import {addLudoPlayer, createLudoLobby, globalTrackIndex, moveLudoToken, rollLudo, setLudoColor, startLudo, type LudoState} from './ludo-game.ts'

function readyGame() {
  let state = addLudoPlayer(createLudoLobby('a', 'Raka'), 'b', 'Sari')
  state = setLudoColor(state, 'a', 'red')
  state = setLudoColor(state, 'b', 'blue')
  return startLudo(state, 'a')
}

test('warna harus unik dan semua pemain memilih warna sebelum mulai', () => {
  let state = addLudoPlayer(createLudoLobby('a', 'Raka'), 'b', 'Sari')
  state = setLudoColor(state, 'a', 'red')
  assert.equal(setLudoColor(state, 'b', 'red'), state)
  assert.equal(startLudo(state, 'a'), state)
  state = setLudoColor(state, 'b', 'blue')
  assert.equal(startLudo(state, 'a').phase, 'playing')
})

test('pion hanya dapat keluar dari markas dengan angka enam', () => {
  let state = readyGame()
  state = rollLudo(state, 'a', 3)
  assert.deepEqual(state.players[0].tokens, [-1, -1, -1, -1])
  assert.equal(state.currentPlayerId, 'b')
  state = rollLudo(state, 'b', 6)
  state = moveLudoToken(state, 'b', 0)
  assert.equal(state.players[1].tokens[0], 0)
  assert.equal(state.currentPlayerId, 'b')
})

test('mendarat pada pion lawan memulangkannya ke markas', () => {
  let state = readyGame()
  state = {...state, players: [{...state.players[0], tokens: [10, -1, -1, -1]}, {...state.players[1], tokens: [50, -1, -1, -1]}], currentPlayerId: 'a'}
  assert.equal(globalTrackIndex('red', 11), globalTrackIndex('blue', 50))
  state = rollLudo(state, 'a', 1)
  state = moveLudoToken(state, 'a', 0)
  assert.equal(state.players[1].tokens[0], -1)
})

test('harus mendarat tepat dan empat pion selesai untuk menang', () => {
  let state: LudoState = {...readyGame(), players: [{...readyGame().players[0], tokens: [56, 57, 57, 57]}, readyGame().players[1]], currentPlayerId: 'a'}
  assert.equal(rollLudo(state, 'a', 2).pendingRoll, null)
  state = rollLudo(state, 'a', 1)
  state = moveLudoToken(state, 'a', 0)
  assert.equal(state.phase, 'finished')
  assert.equal(state.winnerId, 'a')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {addSnakesPlayer, createSnakesLobby, rollSnakes, setSnakesMap, snakeMaps, startSnakes} from './snakes-game.ts'

function game() {
  return startSnakes(addSnakesPlayer(createSnakesLobby('host', 'Thoriq'), 'peer', 'Sari'), 'host')
}

test('menyediakan empat peta dengan ular dan tangga berbeda', () => {
  assert.equal(snakeMaps.length, 4)
  assert.equal(new Set(snakeMaps.map((map) => JSON.stringify([map.ladders, map.snakes]))).size, 4)
})

test('host memilih peta lalu memulai dengan minimal dua pemain', () => {
  let state = createSnakesLobby('host', 'Thoriq')
  assert.equal(startSnakes(state, 'host').phase, 'lobby')
  state = addSnakesPlayer(state, 'peer', 'Sari')
  state = setSnakesMap(state, 'host', 'ocean')
  assert.equal(startSnakes(state, 'host').mapId, 'ocean')
})

test('tangga menaikkan pion dan ular menurunkannya', () => {
  let state = game()
  state = rollSnakes(state, 'host', 2)
  assert.equal(state.players[0].position, 22)
  state = {...state, currentPlayerId: 'host', players: state.players.map((player) => player.id === 'host' ? {...player, position: 45} : player)}
  state = rollSnakes(state, 'host', 3)
  assert.equal(state.players[0].position, 26)
})

test('harus tepat 100 untuk menang', () => {
  let state = game()
  state = {...state, players: state.players.map((player) => player.id === 'host' ? {...player, position: 98} : player)}
  assert.equal(rollSnakes(state, 'host', 3).players[0].position, 98)
  const won = rollSnakes(state, 'host', 2)
  assert.equal(won.phase, 'finished')
  assert.equal(won.winnerId, 'host')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {createArrowGame, hintArrow, isArrowFree, releaseArrow, type ArrowGameState} from './arrow-game.ts'

test('setiap level buatan generator dapat diselesaikan', () => {
  for (let level = 1; level <= 24; level += 1) {
    let state = createArrowGame(level)
    while (state.arrows.length) {
      const free = state.arrows.find((arrow) => isArrowFree(state, arrow.id))
      assert.ok(free, `level ${level} tidak memiliki langkah aman`)
      state = releaseArrow(state, free.id)
    }
    assert.equal(state.status, 'won')
  }
})

test('panah terhalang mengurangi nyawa', () => {
  const state: ArrowGameState = {
    level: 1,
    size: 3,
    lives: 3,
    maxLives: 3,
    moves: 0,
    mistakes: 0,
    status: 'playing',
    arrows: [
      {id: 'blocked', row: 1, column: 0, direction: 'right'},
      {id: 'blocker', row: 1, column: 2, direction: 'up'},
    ],
    hintId: null,
    lastAction: null,
  }
  const next = releaseArrow(state, 'blocked')
  assert.equal(next.lives, 2)
  assert.equal(next.arrows.length, 2)
  assert.equal(next.lastAction?.result, 'blocked')
})

test('petunjuk memilih panah yang dapat keluar', () => {
  const state = hintArrow(createArrowGame(7))
  assert.ok(state.hintId)
  assert.equal(isArrowFree(state, state.hintId!), true)
})

test('level yang sama dibuat deterministik', () => {
  assert.deepEqual(createArrowGame(5), createArrowGame(5))
})

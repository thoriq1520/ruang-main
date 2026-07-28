import assert from 'node:assert/strict'
import test from 'node:test'
import {arrowTravel, createArrowGame, hintArrow, isArrowFree, releaseArrow, type ArrowGameState} from './arrow-game.ts'

test('setiap level buatan generator dapat diselesaikan', () => {
  for (let level = 1; level <= 24; level += 1) {
    let state = createArrowGame(level)
    const cells = new Map(state.arrows.flatMap((arrow) => arrow.points).map((point) => [`${point.row}:${point.column}`, point]))
    const points = [...cells.values()]
    const width = Math.max(...points.map((point) => point.column)) - Math.min(...points.map((point) => point.column)) + 1
    const height = Math.max(...points.map((point) => point.row)) - Math.min(...points.map((point) => point.row)) + 1
    assert.ok(cells.size / (width * height) >= .45, `level ${level} terlalu renggang`)
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
      {id: 'blocked', points: [{row: 2, column: 0}, {row: 1, column: 0}, {row: 1, column: 1}], direction: 'right'},
      {id: 'blocker', points: [{row: 0, column: 2}, {row: 1, column: 2}, {row: 2, column: 2}], direction: 'down'},
    ],
    hintId: null,
    lastAction: null,
  }
  const next = releaseArrow(state, 'blocked')
  assert.deepEqual(arrowTravel(state, 'blocked'), {blocked: true, x: .7, y: 0})
  assert.equal(next.lives, 2)
  assert.equal(next.arrows.length, 2)
  assert.equal(next.lastAction?.result, 'blocked')
})

test('generator membuat jalur yang memiliki belokan', () => {
  for (let level = 1; level <= 12; level += 1) {
    for (const arrow of createArrowGame(level).arrows) {
      assert.ok(arrow.points.length >= 4)
      const horizontal = arrow.points.every((point) => point.row === arrow.points[0].row)
      const vertical = arrow.points.every((point) => point.column === arrow.points[0].column)
      assert.equal(horizontal || vertical, false, `panah ${arrow.id} masih lurus`)
    }
  }
})

test('petunjuk memilih panah yang dapat keluar', () => {
  const state = hintArrow(createArrowGame(7))
  assert.ok(state.hintId)
  assert.equal(isArrowFree(state, state.hintId!), true)
})

test('level yang sama dibuat deterministik', () => {
  assert.deepEqual(createArrowGame(5), createArrowGame(5))
})

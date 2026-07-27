import assert from 'node:assert/strict'
import test from 'node:test'
import {FRUIT_BOARD_WIDTH, FruitMergeGame, fruitSpecs} from './fruit-game.ts'

test('buah yang dijatuhkan tetap berada di dalam wadah', () => {
  const game = new FruitMergeGame(() => 0)
  assert.equal(game.drop(-100), true)
  assert.equal(game.fruits[0].x, fruitSpecs[0].radius + 5)
  game.dropCooldown = 0
  assert.equal(game.drop(FRUIT_BOARD_WIDTH + 100), true)
  assert.equal(game.fruits[1].x, FRUIT_BOARD_WIDTH - fruitSpecs[0].radius - 5)
})

test('dua buah sejenis bergabung menjadi buah berikutnya dan menambah skor', () => {
  const game = new FruitMergeGame(() => 0)
  game.spawn(1, 210, 300).age = 1
  game.spawn(1, 250, 300).age = 1
  game.update(.016)
  assert.equal(game.fruits.length, 1)
  assert.equal(game.fruits[0].kind, 2)
  assert.equal(game.score, 24)
})


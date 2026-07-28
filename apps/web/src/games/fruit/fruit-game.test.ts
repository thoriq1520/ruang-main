import assert from 'node:assert/strict'
import test from 'node:test'
import {FRUIT_BOARD_WIDTH, FRUIT_DANGER_Y, FruitMergeGame, fruitSpecs} from './fruit-game.ts'

test('buah yang dijatuhkan tetap berada di dalam wadah', () => {
  const game = new FruitMergeGame(() => 0)
  assert.equal(game.drop(-100), true)
  assert.equal(game.fruits[0].x, fruitSpecs[0].radius + 5)
  game.dropCooldown = 0
  assert.equal(game.drop(FRUIT_BOARD_WIDTH + 100), true)
  assert.equal(game.fruits[1].x, FRUIT_BOARD_WIDTH - fruitSpecs[0].radius - 5)
})

test('buah jatuh di posisi terakhir setelah bidikan digeser', () => {
  const game = new FruitMergeGame(() => 0)
  game.setAim(120)
  game.setAim(318)
  assert.equal(game.drop(), true)
  assert.equal(game.fruits[0].x, 318)
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

test('buah bergerak yang tetap melewati batas mengakhiri permainan', () => {
  const game = new FruitMergeGame(() => 0)
  const fruit = game.spawn(8, FRUIT_BOARD_WIDTH / 2, FRUIT_DANGER_Y - 20 + fruitSpecs[8].radius, 120)
  fruit.age = 1

  for (let frame = 0; frame < 20; frame += 1) {
    fruit.y = FRUIT_DANGER_Y - 20 + fruitSpecs[8].radius
    fruit.vx = 120
    fruit.vy = 0
    game.update(.05)
  }

  assert.equal(game.status, 'over')
  assert.equal(game.drop(), false)
})

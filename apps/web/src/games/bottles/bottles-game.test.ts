import assert from 'node:assert/strict'
import test from 'node:test'
import {BOTTLE_SESSION_LEVELS, BottleSortGame, bottleLevel, pourBottle} from './bottles-game.ts'

test('semua level Botol Warna memiliki urutan penyelesaian yang legal', () => {
  for (let level = 1; level <= BOTTLE_SESSION_LEVELS; level += 1) {
    const generated = bottleLevel(level)
    const bottles = generated.bottles.map((bottle) => [...bottle])
    for (const move of generated.solution) assert.equal(pourBottle(bottles, move.from, move.to), move.amount)
    assert.ok(bottles.every((bottle) => !bottle.length || (bottle.length === 4 && bottle.every((color) => color === bottle[0]))), `level ${level} tidak selesai`)
  }
})

test('cairan hanya dapat dituang ke botol kosong atau warna teratas yang sama', () => {
  const bottles = [[0, 1], [0], []]
  assert.equal(pourBottle(bottles, 0, 1), 0)
  assert.equal(pourBottle(bottles, 0, 2), 1)
  assert.deepEqual(bottles, [[0], [0], [1]])
})

test('undo dan save mengembalikan susunan permainan', () => {
  const game = new BottleSortGame()
  const before = game.bottles.map((bottle) => [...bottle])
  const legal = game.bottles.flatMap((_, from) => game.bottles.map((__, to) => ({from, to}))).find(({from, to}) => {
    const copy = game.bottles.map((bottle) => [...bottle])
    return pourBottle(copy, from, to) > 0
  })!
  assert.ok(game.pour(legal.from, legal.to))
  assert.equal(game.undo(), true)
  assert.deepEqual(game.bottles, before)

  const restored = BottleSortGame.fromSave(game.toSave(8_500))
  assert.equal(restored?.elapsedMs, 8_500)
  assert.deepEqual(restored?.game.bottles, before)
})

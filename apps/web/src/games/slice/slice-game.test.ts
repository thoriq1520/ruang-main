import assert from 'node:assert/strict'
import test from 'node:test'
import {FruitSliceGame, SLICE_HEIGHT, type SliceTarget} from './slice-game.ts'

const target = (id: number, kind: number | 'bomb', x: number, y: number): SliceTarget => ({
  id, kind, x, y, vx: 0, vy: 0, radius: 40, rotation: 0, spin: 0, sliced: false, cutAge: 0, cutAngle: 0,
})

test('satu sapuan membelah semua buah yang dilewati dan memberi combo', () => {
  const game = new FruitSliceGame(() => 0)
  game.targets = [target(1, 0, 180, 300), target(2, 1, 300, 300), target(3, 2, 420, 300)]

  const result = game.slice({x: 100, y: 300}, {x: 500, y: 300})
  const bonus = game.finishStroke(result.hits.length)

  assert.equal(result.hits.length, 3)
  assert.equal(bonus, 3)
  assert.equal(game.score, 6)
  assert.equal(game.bestCombo, 3)
})

test('menyentuh bom langsung mengakhiri permainan', () => {
  const game = new FruitSliceGame(() => 0)
  game.targets = [target(1, 'bomb', 300, 300)]

  assert.equal(game.slice({x: 200, y: 300}, {x: 400, y: 300}).bomb, true)
  assert.equal(game.status, 'over')
  assert.equal(game.endReason, 'bomb')
})

test('tiga buah terlewat menghabiskan nyawa', () => {
  const game = new FruitSliceGame(() => 0)
  game.targets = [1, 2, 3].map((id) => target(id, 0, id * 100, SLICE_HEIGHT + 60))

  game.update(.01)

  assert.equal(game.lives, 0)
  assert.equal(game.status, 'over')
  assert.equal(game.endReason, 'missed')
})

test('save Tebas Buah memulihkan target, skor, dan durasi', () => {
  const game = new FruitSliceGame(() => 0)
  game.targets = [target(7, 4, 240, 360)]
  game.score = 42

  const restored = FruitSliceGame.fromSave(game.toSave(9_500), () => 0)

  assert.equal(restored?.elapsedMs, 9_500)
  assert.equal(restored?.game.score, 42)
  assert.deepEqual(restored?.game.targets, game.targets)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {BlockBlastGame, blockColors} from './block-game.ts'

test('tiga balok baru memakai warna berbeda selama warna tersedia', () => {
  const game = new BlockBlastGame(() => 0)
  const colors = game.pieces.map((piece) => piece?.color)
  assert.equal(new Set(colors).size, 3)
  assert.ok(colors.every((color) => blockColors.includes(color as typeof blockColors[number])))
})

test('papan awal sudah memiliki balok dan tetap menyediakan langkah', () => {
  const game = new BlockBlastGame(() => .25)
  assert.ok(game.board.flat().filter(Boolean).length >= 14)
  assert.ok(game.pieces.some((piece, pieceIndex) => piece && game.board.some((row, rowIndex) => row.some((_, columnIndex) => game.canPlace(pieceIndex, rowIndex, columnIndex)))))
})

test('baris penuh dibersihkan dan memberi bonus skor', () => {
  const game = new BlockBlastGame(() => 0)
  game.board[0].fill('#test', 0, 6)
  game.pieces[0] = {id: 99, color: '#e5574f', cells: [{row: 0, column: 0}, {row: 0, column: 1}]}
  const move = game.place(0, 0, 6)
  assert.ok(move)
  assert.equal(move.clearedCells.length, 8)
  assert.ok(game.board[0].every((cell) => cell === null))
  assert.equal(game.linesCleared, 1)
  assert.equal(game.score, 120)
  assert.equal(move.perfect, false)
})

test('perfect hanya aktif ketika clear mengosongkan seluruh papan', () => {
  const game = new BlockBlastGame(() => 0)
  game.board.forEach((row) => row.fill(null))
  game.board[0].fill('#test', 0, 6)
  game.pieces[0] = {id: 99, color: '#e5574f', cells: [{row: 0, column: 0}, {row: 0, column: 1}]}

  const move = game.place(0, 0, 6)

  assert.ok(move)
  assert.equal(move.perfect, true)
})

test('balok tidak dapat ditumpuk pada petak yang sudah terisi', () => {
  const game = new BlockBlastGame(() => 0)
  game.board[2][2] = '#test'
  game.pieces[0] = {id: 99, color: '#e5574f', cells: [{row: 0, column: 0}]}
  assert.equal(game.place(0, 2, 2), false)
  assert.equal(game.score, 0)
})

test('combo berlanjut hanya jika clear berikutnya terjadi dalam tiga detik', () => {
  let now = 0
  const game = new BlockBlastGame(() => 0, () => now)
  game.board.forEach((row) => row.fill(null))

  const clearRow = (row: number) => {
    game.board[row].fill('#test', 0, 6)
    game.pieces[0] = {id: 99 + row, color: '#e5574f', cells: [{row: 0, column: 0}, {row: 0, column: 1}]}
    const move = game.place(0, row, 6)
    assert.ok(move)
    return move
  }

  assert.equal(clearRow(0).combo, 1)
  now = 2_500
  assert.equal(clearRow(1).combo, 2)
  now = 6_001
  assert.equal(clearRow(2).combo, 1)
})

import {describe, expect, test} from 'bun:test'
import {normalizeRun} from './runs'

describe('normalisasi hasil solo', () => {
  test('skor Arrow dihitung oleh server', () => {
    const run = normalizeRun({gameId: 'arrow-puzzle', result: 'won', level: 3, moves: 20, mistakes: 1, durationMs: 30_000, score: 9_999_999})
    expect(run.score).toBe(345_970)
    expect(run.stats).toEqual({moves: 20, mistakes: 1})
  })

  test('Fruit menyimpan skor dan buah terbesar', () => {
    const run = normalizeRun({gameId: 'fruit-merge', result: 'lost', score: 720, largestKind: 5, durationMs: 60_000})
    expect(run.score).toBe(720)
    expect(run.stats).toEqual({largestKind: 5})
  })

  test('Block Blast menyimpan skor dan jumlah garis', () => {
    const run = normalizeRun({gameId: 'block-blast', result: 'lost', score: 1_240, linesCleared: 8, durationMs: 75_000})
    expect(run.score).toBe(1_240)
    expect(run.stats).toEqual({linesCleared: 8})
  })

  test('nilai yang tidak masuk akal ditolak', () => {
    expect(() => normalizeRun({gameId: 'fruit-merge', result: 'lost', score: 99_000_000, largestKind: 1, durationMs: 1})).toThrow('score tidak valid')
  })
})

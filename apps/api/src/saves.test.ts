import {describe, expect, test} from 'bun:test'
import {normalizeSaveState} from './saves'

describe('validasi save solo', () => {
  test('menerima snapshot objek', () => {
    expect(normalizeSaveState({version: 1, game: {score: 20}})).toEqual({version: 1, game: {score: 20}})
  })

  test('menolak array dan payload terlalu besar', () => {
    expect(() => normalizeSaveState([])).toThrow('tidak valid')
    expect(() => normalizeSaveState({payload: 'x'.repeat(100_001)})).toThrow('terlalu besar')
  })
})

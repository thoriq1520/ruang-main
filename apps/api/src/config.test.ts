import {expect, test} from 'bun:test'
import {isAllowedWebOrigin} from './config'

test('menerima port Vite lokal tanpa membuka origin asing', () => {
  expect(isAllowedWebOrigin('http://localhost:5174')).toBe(true)
  expect(isAllowedWebOrigin('http://127.0.0.1:5175')).toBe(true)
  expect(isAllowedWebOrigin('https://evil.example')).toBe(false)
})

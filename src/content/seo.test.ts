import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {publicPageSlugs} from './site-content.ts'

test('sitemap memuat seluruh halaman publik dengan URL absolut', async () => {
  const sitemap = await readFile('public/sitemap.xml', 'utf8')
  assert.match(sitemap, /<loc>https:\/\/ruangmain\.web\.id\/<\/loc>/)
  for (const slug of publicPageSlugs) {
    assert.match(sitemap, new RegExp(`<loc>https://ruangmain\\.web\\.id/${slug}</loc>`))
  }
})

test('robots mengizinkan crawler dan menunjuk sitemap', async () => {
  const robots = await readFile('public/robots.txt', 'utf8')
  assert.match(robots, /User-agent: \*/)
  assert.match(robots, /Allow: \//)
  assert.match(robots, /Sitemap: https:\/\/ruangmain\.web\.id\/sitemap\.xml/)
})

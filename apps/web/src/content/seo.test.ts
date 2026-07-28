import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {publicPageSlugs} from './site-content.ts'
import {gameCatalog} from '../games/game-catalog.ts'

test('sitemap memuat seluruh halaman publik dengan URL absolut', async () => {
  const sitemap = await readFile('public/sitemap.xml', 'utf8')
  assert.match(sitemap, /<loc>https:\/\/ruangmain\.web\.id\/<\/loc>/)
  for (const slug of publicPageSlugs) {
    assert.match(sitemap, new RegExp(`<loc>https://ruangmain\\.web\\.id/${slug}</loc>`))
  }
  for (const game of gameCatalog) {
    assert.match(sitemap, new RegExp(`<loc>https://ruangmain\\.web\\.id/game/${game.slug}</loc>`))
  }
})

test('setiap game memiliki landing page SEO dan panduan asli', () => {
  for (const game of gameCatalog) {
    assert.match(game.seoTitle, /Ruang Main/)
    assert.ok(game.seoDescription.length > 80)
    assert.ok(game.guide.length >= 2)
  }
})

test('robots mengizinkan crawler dan menunjuk sitemap', async () => {
  const robots = await readFile('public/robots.txt', 'utf8')
  assert.match(robots, /User-agent: \*/)
  assert.match(robots, /Allow: \//)
  assert.match(robots, /Sitemap: https:\/\/ruangmain\.web\.id\/sitemap\.xml/)
})

test('Cloudflare memakai URL tanpa trailing slash dan 404 sungguhan', async () => {
  const config = JSON.parse(await readFile('../../wrangler.jsonc', 'utf8'))
  assert.equal(config.assets.html_handling, 'drop-trailing-slash')
  assert.equal(config.assets.not_found_handling, '404-page')
  assert.match(await readFile('public/404.html', 'utf8'), /noindex, follow/)
})

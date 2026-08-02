import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'
import {publicPageSlugs} from '../src/content/site-content.ts'
import {gameCatalog} from '../src/games/game-catalog.ts'

const routes = ['/', ...publicPageSlugs.map((slug) => `/${slug}`), ...gameCatalog.map((game) => `/game/${game.slug}`)]

test('setiap route hasil build memuat konten utama tanpa skeleton', async () => {
  for (const route of routes) {
    const file = route === '/' ? 'dist/index.html' : join('dist', route.slice(1), 'index.html')
    const html = await readFile(file, 'utf8')
    assert.match(html, /<main id="main-content"/, `${route} tidak memiliki konten utama`)
    assert.doesNotMatch(html, /class="app-loading"/, `${route} masih menyajikan skeleton`)
  }
})

test('landing game memuat visual produk dan build tidak menjalankan AdSense', async () => {
  for (const game of gameCatalog) {
    const html = await readFile(join('dist', 'game', game.slug, 'index.html'), 'utf8')
    assert.match(html, /class="game-guide-visual"/, `${game.slug} tidak memiliki visual game`)
    assert.match(html, new RegExp(game.coverImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${game.slug} tidak memuat cover yang tepat`)
  }

  const homeHtml = await readFile('dist/index.html', 'utf8')
  assert.doesNotMatch(homeHtml, /adsbygoogle|pagead2\.googlesyndication\.com/, 'build masih menjalankan AdSense')
})

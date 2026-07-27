import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {publicPages, publicPageSlugs, siteMeta, faqItems} from '../src/content/site-content.ts'
import {gameCatalog} from '../src/games/game-catalog.ts'

const origin = 'https://ruangmain.web.id'
const template = await readFile('dist/index.html', 'utf8')

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character])

function replaceMeta(html, attribute, key, value) {
  const tag = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}="${key}")[^>]*>`, 'i')
  return html.replace(tag, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`)
}

function pageShell(content) {
  return `<header class="site-header public-header"><a class="brand" href="/" aria-label="Ruang Main, halaman utama"><span>Ruang Main</span></a><nav class="public-nav" aria-label="Navigasi informasi"><a href="/tentang">Game</a><a href="/cara-bermain">Cara bermain</a><a href="/faq">FAQ</a></nav></header>${content}<footer class="site-footer"><div><a class="brand" href="/"><span>Ruang Main</span></a><p>Koleksi mini game solo dan P2P yang dimainkan langsung dari browser.</p></div><nav aria-label="Navigasi footer"><a href="/tentang">Tentang</a><a href="/cara-bermain">Cara bermain</a><a href="/faq">FAQ</a><a href="/kontak">Kontak</a><a href="/privasi">Privasi</a><a href="/ketentuan">Ketentuan</a></nav></footer>`
}

function sectionsHtml(sections) {
  return sections.map((section) => `<section class="public-content-section"><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`).join('')
}

async function writeRoute(path, title, description, body, schema) {
  const canonical = `${origin}${path === '/' ? '/' : path}`
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  html = replaceMeta(html, 'name', 'description', description)
  html = replaceMeta(html, 'property', 'og:site_name', siteMeta.name)
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', description)
  html = replaceMeta(html, 'property', 'og:url', canonical)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', description)
  html = html.replace(/<link\b(?=[^>]*\brel="canonical")[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
  html = html.replace('<div id="app"></div>', `<div id="app">${pageShell(body)}</div>`)

  const target = path === '/' ? 'dist/index.html' : join('dist', path.slice(1), 'index.html')
  await mkdir(dirname(target), {recursive: true})
  await writeFile(target, html)
}

const gameLinks = gameCatalog.map((game) => `<li><a href="/game/${game.slug}">${escapeHtml(game.name)}</a><p>${escapeHtml(game.description)}</p></li>`).join('')
const homeBody = `<main id="main-content" class="home-stage"><header class="home-intro"><div><h1>Mau main apa?</h1><p>${escapeHtml(siteMeta.description)}</p></div></header><section class="game-library" aria-labelledby="game-list-title"><h2 id="game-list-title">Mini game yang tersedia</h2><ul>${gameLinks}</ul></section></main>`
await writeRoute('/', siteMeta.title, siteMeta.description, homeBody, {
  '@context': 'https://schema.org',
  '@graph': [
    {'@type': 'WebSite', name: siteMeta.name, alternateName: siteMeta.alternateName, url: `${origin}/`, inLanguage: 'id-ID', description: siteMeta.description},
    {'@type': 'ItemList', name: 'Game di Ruang Main', itemListElement: gameCatalog.map((game, index) => ({'@type': 'ListItem', position: index + 1, name: game.name, url: `${origin}/game/${game.slug}`}))},
  ],
})

for (const slug of publicPageSlugs) {
  const page = publicPages[slug]
  const faqHtml = faqItems.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')
  const content = `<main id="main-content" class="public-page public-shell"><a class="back-link" href="/">Kembali ke permainan</a><header class="public-page-intro"><p class="step-label">Ruang Main</p><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p></header>${slug === 'faq' ? `<section class="public-content-section"><h2>Jawaban yang sering dicari</h2><div class="faq-list">${faqHtml}</div></section>` : sectionsHtml(page.sections)}</main>`
  const schema = slug === 'faq'
    ? {'@context': 'https://schema.org', '@type': 'FAQPage', name: page.title, url: `${origin}/${slug}`, mainEntity: faqItems.map((item) => ({'@type': 'Question', name: item.question, acceptedAnswer: {'@type': 'Answer', text: item.answer}}))}
    : {'@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: `${origin}/${slug}`, description: page.description, inLanguage: 'id-ID'}
  await writeRoute(`/${slug}`, `${page.title} | Ruang Main`, page.description, content, schema)
}

for (const game of gameCatalog) {
  const content = `<main id="main-content" class="public-page game-landing public-shell"><a class="back-link" href="/">Kembali ke semua game</a><header class="public-page-intro"><p class="step-label">${escapeHtml(game.genre)} · ${escapeHtml(game.playerLabel)} pemain</p><h1>${escapeHtml(game.name)}</h1><p>${escapeHtml(game.seoDescription)}</p><a class="button button-primary game-landing-cta" href="/?game=${game.id}#selected-game">${game.mode === 'solo' ? 'Main sekarang' : 'Buat atau gabung room'}</a></header>${sectionsHtml(game.guide)}<nav class="related-games" aria-label="Game lain di Ruang Main"><strong>Game lain</strong>${gameCatalog.filter((item) => item.id !== game.id).map((item) => `<a href="/game/${item.slug}">${escapeHtml(item.name)}</a>`).join('')}</nav></main>`
  const schema = {'@context': 'https://schema.org', '@type': 'VideoGame', name: game.name, url: `${origin}/game/${game.slug}`, description: game.seoDescription, gamePlatform: 'Web browser', playMode: game.mode === 'solo' ? 'SinglePlayer' : 'MultiPlayer', inLanguage: 'id-ID', isAccessibleForFree: true}
  await writeRoute(`/game/${game.slug}`, game.seoTitle, game.seoDescription, content, schema)
}

console.log(`Prerendered ${1 + publicPageSlugs.length + gameCatalog.length} SEO routes.`)

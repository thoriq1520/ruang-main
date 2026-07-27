import {faqItems, publicPages, publicPageSlugs, type PublicPageSlug} from '../content/site-content'
import {gameCatalog, type GameCatalogItem} from '../games/game-catalog'
import {escapeHtml, logoMark} from '../shared/ui'
import {updateDocumentMeta} from './seo'

export function publicPageFromPath(): PublicPageSlug | null {
  const slug = location.pathname.replace(/^\/+|\/+$/g, '') as PublicPageSlug
  return publicPageSlugs.includes(slug) ? slug : null
}

export function gamePageFromPath(): GameCatalogItem | null {
  const match = location.pathname.match(/^\/game\/([^/]+)\/?$/)
  return match ? gameCatalog.find((item) => item.slug === match[1]) ?? null : null
}

export function publicHeader(active?: PublicPageSlug) {
  const links: Array<[PublicPageSlug, string]> = [
    ['tentang', 'Game'],
    ['cara-bermain', 'Cara bermain'],
    ['faq', 'FAQ'],
  ]
  return `<header class="site-header public-header">
    <a class="brand" href="/" aria-label="Ruang Main, halaman utama">
      ${logoMark()}
      <span>Ruang Main</span>
    </a>
    <nav class="public-nav" aria-label="Navigasi informasi">
      ${links.map(([slug, label]) => `<a href="/${slug}" ${active === slug ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
  </header>`
}

export function homeSupport() {
  return `<div class="public-shell home-support">
    <aside class="ad-slot" data-ad-placement="home-content" aria-label="Iklan">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-4066128992268171"
        data-ad-slot="4940905838"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    </aside>

    <section class="session-guide" aria-labelledby="support-title">
      <header><h2 id="support-title">Tentang sesi ini</h2><p>Tidak ada akun dan progres permanen. Room multiplayer menghubungkan browser pemain secara langsung.</p></header>
      <dl>
        <div><dt>Masuk</dt><dd>Satu kode room</dd></div>
        <div><dt>Koneksi</dt><dd>Peer to peer</dd></div>
        <div><dt>Penyimpanan</dt><dd>Hanya di memori</dd></div>
      </dl>
      <nav class="game-guide-links" aria-label="Panduan setiap game">
        <span>Panduan game</span>
        ${gameCatalog.map((item) => `<a href="/game/${item.slug}">${escapeHtml(item.name)}</a>`).join('')}
      </nav>
      <nav class="session-links" aria-label="Informasi sesi"><a href="/cara-bermain">Cara bermain</a><a href="/privasi">Privasi</a><a href="/kontak">Laporkan masalah</a></nav>
    </section>

    <section class="faq-preview" aria-labelledby="faq-preview-title">
      <div class="section-copy">
        <h2 id="faq-preview-title">Sebelum masuk room</h2>
        <p>Jawaban singkat untuk hal yang paling sering ditanyakan.</p>
      </div>
      <div class="faq-list">${faqItems.slice(0, 4).map(faqItem).join('')}</div>
      <a class="inline-link" href="/faq">Lihat semua FAQ</a>
    </section>
  </div>`
}

export function renderPublicPage(root: HTMLElement, slug: PublicPageSlug) {
  const page = publicPages[slug]
  updateDocumentMeta(`${page.title} | Ruang Main`, page.description, `/${slug}`)
  root.innerHTML = `
    ${publicHeader(slug)}
    <main id="main-content" class="public-page public-shell">
      <a class="back-link" href="/">Kembali ke permainan</a>
      <header class="public-page-intro">
        <p class="step-label">Ruang Main</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
      </header>
      <aside class="ad-slot" data-ad-placement="information-content" aria-label="Iklan"></aside>
      ${slug === 'faq'
        ? `<section class="public-content-section" aria-labelledby="all-faq-title"><h2 id="all-faq-title">Jawaban yang sering dicari</h2><div class="faq-list">${faqItems.map(faqItem).join('')}</div></section>`
        : page.sections.map(publicSection).join('')}
      ${page.action ? `<div class="public-action"><a class="button button-primary" href="${escapeHtml(page.action.href)}" ${page.action.external ? 'target="_blank" rel="noreferrer"' : ''}>${escapeHtml(page.action.label)}</a></div>` : ''}
    </main>
    ${publicFooter()}`
  window.scrollTo({top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'})
}

export function renderGameLandingPage(root: HTMLElement, item: GameCatalogItem) {
  updateDocumentMeta(item.seoTitle, item.seoDescription, `/game/${item.slug}`)
  root.innerHTML = `
    ${publicHeader()}
    <main id="main-content" class="public-page game-landing public-shell">
      <a class="back-link" href="/">Kembali ke semua game</a>
      <header class="public-page-intro">
        <p class="step-label">${escapeHtml(item.genre)} · ${escapeHtml(item.playerLabel)} pemain</p>
        <h1>${escapeHtml(item.name)}</h1>
        <p>${escapeHtml(item.seoDescription)}</p>
        <a class="button button-primary game-landing-cta" href="/?game=${item.id}#selected-game">${item.mode === 'solo' ? 'Main sekarang' : 'Buat atau gabung room'}</a>
      </header>
      ${item.guide.map((section) => `<section class="public-content-section"><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></section>`).join('')}
      <nav class="related-games" aria-label="Game lain di Ruang Main"><strong>Game lain</strong>${gameCatalog.filter((gameItem) => gameItem.id !== item.id).map((gameItem) => `<a href="/game/${gameItem.slug}">${escapeHtml(gameItem.name)}</a>`).join('')}</nav>
    </main>
    ${publicFooter()}`
  window.scrollTo({top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'})
}

function publicSection(section: (typeof publicPages)[PublicPageSlug]['sections'][number]) {
  return `<section class="public-content-section"><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`
}

function faqItem(item: (typeof faqItems)[number]) {
  return `<details class="faq-item"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`
}

export function publicFooter() {
  return `<footer class="site-footer">
    <div><a class="brand" href="/">${logoMark()}<span>Ruang Main</span></a><p>Koleksi mini game solo dan P2P yang dimainkan langsung dari browser.</p></div>
    <nav aria-label="Navigasi footer"><a href="/tentang">Tentang</a><a href="/cara-bermain">Cara bermain</a><a href="/faq">FAQ</a><a href="/kontak">Kontak</a><a href="/privasi">Privasi</a><a href="/ketentuan">Ketentuan</a></nav>
    <p class="footer-note">© ${new Date().getFullYear()} Ruang Main. Dibuat untuk hiburan bersama.</p>
  </footer>`
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

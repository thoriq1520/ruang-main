import assert from 'node:assert/strict'
import test from 'node:test'
import {faqItems, publicPages, publicPageSlugs} from './site-content.ts'

test('halaman publik penting tersedia untuk transparansi situs', () => {
  assert.deepEqual(publicPageSlugs, ['tentang', 'cara-bermain', 'faq', 'kontak', 'privasi', 'ketentuan'])
  for (const slug of publicPageSlugs) {
    const page = publicPages[slug]
    assert.ok(page.title.length > 3)
    assert.ok(page.description.length > 40)
    assert.ok(page.sections.length >= 2)
  }
})

test('identitas produk memisahkan hub dan game pertama', () => {
  const about = `${publicPages.tentang.title} ${publicPages.tentang.description} ${publicPages.tentang.sections.flatMap((section) => section.paragraphs).join(' ')}`
  assert.match(about, /Mini Games Coop/)
  assert.match(about, /Kota Raya/)
})

test('FAQ menjelaskan koneksi, data, biaya, dan batas sesi', () => {
  assert.ok(faqItems.length >= 6)
  const faqText = faqItems.map(({question, answer}) => `${question} ${answer}`).join(' ').toLowerCase()
  for (const topic of ['p2p', 'data', 'gratis', 'host', 'room']) assert.match(faqText, new RegExp(topic))
})

test('halaman privasi menjelaskan teknologi pihak ketiga dan iklan', () => {
  const privacyText = publicPages.privasi.sections.flatMap((section) => [section.heading, ...section.paragraphs]).join(' ').toLowerCase()
  assert.match(privacyText, /webrtc/)
  assert.match(privacyText, /trystero/)
  assert.match(privacyText, /google adsense/)
  assert.match(privacyText, /cookie/)
})

test('halaman kontak menyediakan kanal publik nyata', () => {
  const contact = publicPages.kontak
  assert.equal(contact.action?.href, 'https://github.com/thoriq1520/ruang-main/issues')
  assert.equal(contact.action?.external, true)
})

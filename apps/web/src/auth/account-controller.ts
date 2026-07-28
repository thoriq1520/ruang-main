import {apiOrigin, leaderboard, soloHistory} from '../api/client'
import {escapeHtml} from '../shared/ui'
import {authClient} from './auth-client'

type AuthMode = 'login' | 'register'

export function bindAccountUi(root: HTMLElement) {
  const accountButton = root.querySelector<HTMLButtonElement>('[data-account-button]')
  const rankingButton = root.querySelector<HTMLButtonElement>('[data-ranking-button]')
  const accountDialog = root.querySelector<HTMLDialogElement>('#account-dialog')
  const rankingDialog = root.querySelector<HTMLDialogElement>('#ranking-dialog')
  if (!accountButton || !accountDialog || !rankingButton || !rankingDialog) return

  accountDialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => accountDialog.close())
  rankingDialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => rankingDialog.close())
  rankingButton.addEventListener('click', () => {
    rankingDialog.showModal()
    void renderRankings(rankingDialog)
  })

  accountButton.addEventListener('click', async () => {
    accountDialog.showModal()
    try {
      const session = await authClient.getSession()
      if (session.data?.user) await renderSignedIn(accountDialog, session.data.user)
      else renderAuthChoice(accountDialog)
    } catch {
      renderAuthChoice(accountDialog)
    }
  })

  void authClient.getSession().then(({data}) => {
    if (data?.user) accountButton.textContent = data.user.name.split(/\s+/)[0]
  }).catch(() => undefined)
}

function content(dialog: HTMLDialogElement) {
  return dialog.querySelector<HTMLElement>('[data-dialog-content]')!
}

function renderAuthChoice(dialog: HTMLDialogElement) {
  content(dialog).innerHTML = `
    <p class="step-label">AKUN OPSIONAL</p>
    <h2>Catat hasil mainmu</h2>
    <p class="muted">Game tetap bisa dimainkan tanpa akun. Masuk hanya diperlukan untuk riwayat dan peringkat solo.</p>
    <div class="account-choice">
      <button class="button button-primary" type="button" data-auth-mode="login">Masuk</button>
      <button class="button button-secondary" type="button" data-auth-mode="register">Buat akun</button>
    </div>
    <button class="google-auth-button" type="button" data-google-auth hidden>
      <svg aria-hidden="true" viewBox="0 0 18 18">
        <path fill="#4285f4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.613Z"/>
        <path fill="#34a853" d="M9 18c2.43 0 4.467-.806 5.956-2.182l-2.91-2.258c-.805.54-1.835.86-3.046.86-2.344 0-4.328-1.585-5.037-3.715H.955v2.333A9 9 0 0 0 9 18Z"/>
        <path fill="#fbbc05" d="M3.963 10.705A5.42 5.42 0 0 1 3.682 9c0-.592.102-1.168.281-1.705V4.962H.955A9 9 0 0 0 0 9c0 1.452.347 2.827.955 4.038l3.008-2.333Z"/>
        <path fill="#ea4335" d="M9 3.58c1.321 0 2.507.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0A9 9 0 0 0 .955 4.962l3.008 2.333C4.672 5.165 6.656 3.58 9 3.58Z"/>
      </svg>
      Masuk dengan Google
    </button>
    <p class="form-error" role="alert" data-auth-error></p>`

  content(dialog).querySelectorAll<HTMLButtonElement>('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => renderAuthForm(dialog, button.dataset.authMode as AuthMode)))
  const googleButton = content(dialog).querySelector<HTMLButtonElement>('[data-google-auth]')!
  void fetch(`${apiOrigin}/api/auth-options`).then((response) => response.json()).then((response: {data?: {google?: boolean}}) => {
    googleButton.hidden = !response.data?.google
  }).catch(() => undefined)
  googleButton.addEventListener('click', () => void authClient.signIn.social({provider: 'google', callbackURL: location.href}))
}

function renderAuthForm(dialog: HTMLDialogElement, mode: AuthMode) {
  const registering = mode === 'register'
  content(dialog).innerHTML = `
    <button class="account-back" type="button" data-auth-back>← Kembali</button>
    <p class="step-label">${registering ? 'AKUN BARU' : 'SELAMAT DATANG'}</p>
    <h2>${registering ? 'Buat akun' : 'Masuk'}</h2>
    <form class="account-form" data-auth-form novalidate>
      ${registering ? '<label>Nama<input name="name" maxlength="50" autocomplete="name" required></label>' : ''}
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" minlength="8" autocomplete="current-password" required></label>
      <button class="button button-primary" type="submit">${registering ? 'Daftar' : 'Masuk'}</button>
      <p class="form-error" role="alert" data-auth-error></p>
    </form>`
  content(dialog).querySelector('[data-auth-back]')?.addEventListener('click', () => renderAuthChoice(dialog))
  content(dialog).querySelector<HTMLFormElement>('[data-auth-form]')!.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
    const error = form.querySelector<HTMLElement>('[data-auth-error]')!
    const data = new FormData(form)
    submit.disabled = true
    error.textContent = ''
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    const result = registering
      ? await authClient.signUp.email({name: String(data.get('name') || '').trim(), email, password})
      : await authClient.signIn.email({email, password})
    submit.disabled = false
    if (result.error) {
      error.textContent = result.error.message || 'Tidak dapat masuk. Periksa kembali datamu.'
      return
    }
    const session = await authClient.getSession()
    if (session.data?.user) await renderSignedIn(dialog, session.data.user)
  })
}

async function renderSignedIn(dialog: HTMLDialogElement, user: {name: string; email: string; image?: string | null}) {
  content(dialog).innerHTML = `
    <p class="step-label">AKUN KAMU</p>
    <div class="account-identity">${user.image ? `<img src="${escapeHtml(user.image)}" alt="">` : `<span>${escapeHtml(user.name.charAt(0).toUpperCase())}</span>`}<div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.email)}</p></div></div>
    <div class="history-heading"><h3>Riwayat solo</h3><span>20 permainan terakhir</span></div>
    <div class="account-history" data-history><p class="muted">Memuat riwayat…</p></div>
    <button class="button button-secondary" type="button" data-sign-out>Keluar dari akun</button>`
  content(dialog).querySelector('[data-sign-out]')?.addEventListener('click', async () => {
    await authClient.signOut()
    renderAuthChoice(dialog)
  })
  const target = content(dialog).querySelector<HTMLElement>('[data-history]')!
  try {
    const rows = await soloHistory()
    const gameNames = {'arrow-puzzle': 'Arrow Puzzle', 'fruit-merge': 'Fruit Merge', 'block-blast': 'Blok Brak', 'fruit-slice': 'Tebas Buah'} as const
    target.innerHTML = rows.length ? rows.map((run) => `<div class="history-row"><div><strong>${gameNames[run.gameId]}</strong><span>${new Date(run.createdAt).toLocaleDateString('id-ID')}</span></div><strong>${run.score.toLocaleString('id-ID')}</strong></div>`).join('') : '<p class="muted">Belum ada hasil solo yang tersimpan.</p>'
  } catch (error) {
    target.innerHTML = `<p class="form-error">${escapeHtml(error instanceof Error ? error.message : 'Riwayat belum dapat dimuat.')}</p>`
  }
}

async function renderRankings(dialog: HTMLDialogElement) {
  const target = content(dialog)
  target.innerHTML = '<p class="muted">Memuat peringkat…</p>'
  try {
    const [arrow, fruit, block, slice] = await Promise.all([leaderboard('arrow-puzzle'), leaderboard('fruit-merge'), leaderboard('block-blast'), leaderboard('fruit-slice')])
    target.innerHTML = `<div class="ranking-columns">${rankingTable('Arrow Puzzle', arrow)}${rankingTable('Fruit Merge', fruit)}${rankingTable('Blok Brak', block)}${rankingTable('Tebas Buah', slice)}</div>`
  } catch (error) {
    target.innerHTML = `<p class="form-error">${escapeHtml(error instanceof Error ? error.message : 'Peringkat belum dapat dimuat.')}</p>`
  }
}

function rankingTable(title: string, rows: Awaited<ReturnType<typeof leaderboard>>) {
  return `<section class="ranking-list"><h3>${title}</h3>${rows.length ? rows.slice(0, 10).map((row) => `<div class="ranking-row"><span>${row.rank}</span><strong>${escapeHtml(row.name)}</strong><b>${row.score.toLocaleString('id-ID')}</b></div>`).join('') : '<p class="muted">Belum ada skor.</p>'}</section>`
}

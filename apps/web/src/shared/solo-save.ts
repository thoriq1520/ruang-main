import {archiveSoloGame, loadSoloSave, type SoloGameId} from '../api/client'
import {escapeHtml, logoMark} from './ui'

export type SoloStart = {
  authenticated: boolean
  state: Record<string, unknown> | null
}

export function soloSaveLoadingScreen(gameName: string) {
  return `<main id="main-content" class="solo-load-shell" aria-busy="true" aria-label="Memuat ${escapeHtml(gameName)}">
    <div class="solo-load-brand">${logoMark()}<span>Ruang Main</span></div>
    <section class="solo-load-card">
      <span class="solo-load-line solo-load-kicker"></span>
      <span class="solo-load-line solo-load-title"></span>
      <span class="solo-load-line solo-load-copy"></span>
      <span class="solo-load-board"></span>
    </section>
  </main>`
}

export async function prepareSoloStart(gameId: SoloGameId, gameName: string): Promise<SoloStart> {
  try {
    const loaded = await loadSoloSave(gameId)
    if (!loaded.authenticated || !loaded.save) return {authenticated: loaded.authenticated, state: null}
    const choice = await resumeChoice(gameName, new Date(loaded.save.updatedAt))
    if (choice === 'continue') return {authenticated: true, state: loaded.save.state as Record<string, unknown>}
    await archiveSoloGame(gameId)
    return {authenticated: true, state: null}
  } catch {
    return {authenticated: false, state: null}
  }
}

function resumeChoice(gameName: string, updatedAt: Date) {
  let dialog = document.querySelector<HTMLDialogElement>('#solo-save-dialog')
  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="asset-dialog solo-save-dialog" id="solo-save-dialog" aria-labelledby="solo-save-title" aria-describedby="solo-save-copy">
      <form method="dialog">
        <p class="step-label">Permainan tersimpan</p>
        <h2 id="solo-save-title"></h2>
        <p class="solo-save-copy" id="solo-save-copy"></p>
        <p class="solo-save-time" id="solo-save-time"></p>
        <div class="solo-save-actions">
          <button class="button button-secondary" type="submit" value="new">Mulai baru</button>
          <button class="button button-primary" type="submit" value="continue" autofocus>Lanjutkan</button>
        </div>
        <p class="solo-save-note">Mulai baru tetap menyimpan sesi lama sebagai riwayat.</p>
      </form>
    </dialog>`)
    dialog = document.querySelector<HTMLDialogElement>('#solo-save-dialog')!
  }
  dialog.querySelector('#solo-save-title')!.textContent = `Lanjut ${gameName}?`
  dialog.querySelector('#solo-save-copy')!.textContent = 'Kami menemukan permainan yang belum selesai di akunmu.'
  dialog.querySelector('#solo-save-time')!.textContent = `Terakhir dimainkan ${updatedAt.toLocaleString('id-ID', {dateStyle: 'medium', timeStyle: 'short'})}`
  dialog.returnValue = 'continue'
  dialog.showModal()
  return new Promise<'continue' | 'new'>((resolve) => dialog!.addEventListener('close', () => resolve(dialog!.returnValue === 'new' ? 'new' : 'continue'), {once: true}))
}

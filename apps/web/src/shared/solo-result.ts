import {soloRunQualification, submitSoloRun, type SoloRunSubmission} from '../api/client'

export async function finishSoloRun(run: SoloRunSubmission, authenticated: boolean) {
  try {
    if (authenticated) {
      const result = await submitSoloRun(run)
      if (result.saved && result.qualifies && result.rank) showTopFive(result.rank)
      return
    }

    const qualification = await soloRunQualification(run)
    if (!qualification.qualifies) return
    const guestName = await requestGuestName(qualification.rank)
    if (!guestName) return
    const result = await submitSoloRun({...run, guestName})
    if (result.saved && result.rank) showTopFive(result.rank)
  } catch {
    // Kegagalan leaderboard tidak boleh menghentikan layar game over.
  }
}

function requestGuestName(rank: number) {
  let dialog = document.querySelector<HTMLDialogElement>('#guest-score-dialog')
  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="asset-dialog guest-score-dialog" id="guest-score-dialog" aria-labelledby="guest-score-title">
      <form method="dialog">
        <p class="step-label">Top 5 hari ini</p>
        <h2 id="guest-score-title">Skormu layak masuk peringkat.</h2>
        <p class="guest-score-copy"></p>
        <label class="field" for="guest-score-name"><span>Nama di papan skor</span><input id="guest-score-name" maxlength="20" pattern=".*\S.*" autocomplete="nickname" placeholder="Nama kamu" required /></label>
        <p class="form-error guest-score-error" role="alert"></p>
        <div class="name-dialog-actions"><button class="button button-secondary" type="submit" value="cancel" formnovalidate>Lewati</button><button class="button button-primary" type="submit" value="save">Masuk Top 5</button></div>
      </form>
    </dialog>`)
    dialog = document.querySelector<HTMLDialogElement>('#guest-score-dialog')!
  }
  dialog.querySelector<HTMLElement>('.guest-score-copy')!.textContent = `Posisi sementara #${rank}. Masukkan nama agar skor tampil di leaderboard.`
  const input = dialog.querySelector<HTMLInputElement>('#guest-score-name')!
  const error = dialog.querySelector<HTMLElement>('.guest-score-error')!
  input.value = ''
  error.textContent = ''
  dialog.returnValue = 'cancel'
  dialog.showModal()
  input.focus()
  return new Promise<string | null>((resolve) => dialog!.addEventListener('close', () => {
    const name = input.value.trim().replace(/\s+/g, ' ')
    if (dialog!.returnValue === 'save' && name && name.length <= 20) resolve(name)
    else resolve(null)
  }, {once: true}))
}

function showTopFive(rank: number) {
  let toast = document.querySelector<HTMLElement>('#top-five-notice')
  if (!toast) {
    document.body.insertAdjacentHTML('beforeend', '<aside class="top-five-notice" id="top-five-notice" role="status" aria-live="polite"><small>Skor baru</small><strong></strong><span>Namamu sekarang tampil di leaderboard.</span></aside>')
    toast = document.querySelector<HTMLElement>('#top-five-notice')!
  }
  toast.querySelector('strong')!.textContent = `Masuk Top 5 · Peringkat #${rank}`
  toast.classList.remove('is-visible')
  requestAnimationFrame(() => toast?.classList.add('is-visible'))
  window.setTimeout(() => toast?.classList.remove('is-visible'), 4_500)
}

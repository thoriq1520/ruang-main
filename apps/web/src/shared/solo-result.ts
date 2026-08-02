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
  } catch (error) {
    console.error('Pencatatan skor leaderboard gagal:', error)
  }
}

export function requestGuestName(rank: number): Promise<string | null> {
  let dialog = document.querySelector<HTMLDialogElement>('#guest-score-dialog')
  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="asset-dialog guest-score-dialog" id="guest-score-dialog" aria-labelledby="guest-score-title">
      <form method="dialog" id="guest-score-form">
        <p class="step-label">Top 5 hari ini</p>
        <h2 id="guest-score-title">Skormu layak masuk peringkat.</h2>
        <p class="guest-score-copy"></p>
        <label class="field" for="guest-score-name"><span>Nama di papan skor</span><input id="guest-score-name" maxlength="20" autocomplete="nickname" placeholder="Nama kamu" required /></label>
        <p class="form-error guest-score-error" role="alert"></p>
        <div class="name-dialog-actions">
          <button class="button button-secondary" type="button" id="guest-score-cancel">Lewati</button>
          <button class="button button-primary" type="submit" value="save">Masuk Top 5</button>
        </div>
      </form>
    </dialog>`)
    dialog = document.querySelector<HTMLDialogElement>('#guest-score-dialog')!
  }

  const form = dialog.querySelector<HTMLFormElement>('#guest-score-form')!
  const input = dialog.querySelector<HTMLInputElement>('#guest-score-name')!
  const error = dialog.querySelector<HTMLElement>('.guest-score-error')!
  const cancelBtn = dialog.querySelector<HTMLButtonElement>('#guest-score-cancel')!

  dialog.querySelector<HTMLElement>('.guest-score-copy')!.textContent = `Posisi sementara #${rank}. Masukkan nama agar skor tampil di leaderboard.`
  input.value = ''
  error.textContent = ''

  return new Promise<string | null>((resolve) => {
    let resolved = false
    const finish = (result: string | null) => {
      if (resolved) return
      resolved = true
      form.onsubmit = null
      cancelBtn.onclick = null
      dialog?.removeEventListener('close', onClose)
      resolve(result)
    }

    form.onsubmit = (event) => {
      const name = input.value.trim().replace(/\s+/g, ' ')
      if (!name) {
        event.preventDefault()
        error.textContent = 'Nama pemain wajib diisi.'
        input.focus()
        return
      }
      if (name.length > 20) {
        event.preventDefault()
        error.textContent = 'Nama maksimal 20 karakter.'
        input.focus()
        return
      }
      error.textContent = ''
      dialog!.returnValue = 'save'
    }

    cancelBtn.onclick = () => {
      dialog!.returnValue = 'cancel'
      dialog!.close('cancel')
    }

    const onClose = () => {
      const name = input.value.trim().replace(/\s+/g, ' ')
      if (dialog!.returnValue === 'save' && name && name.length <= 20) {
        finish(name)
      } else {
        finish(null)
      }
    }

    dialog!.addEventListener('close', onClose, {once: true})
    dialog!.showModal()
    input.focus()
  })
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

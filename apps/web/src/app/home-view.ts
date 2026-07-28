import {gameById, gameCard, gameCatalog, type GameId} from '../games/game-catalog'
import {escapeHtml} from '../shared/ui'
import {homeSupport, publicFooter, publicHeader} from './public-pages'

export function homeScreen(selectedGameId: GameId, notice = '') {
  const selectedGame = gameById(selectedGameId)
  const isSolo = selectedGame.mode === 'solo'
  return {
    selectedGame,
    isSolo,
    html: `
      ${publicHeader()}
      <main id="main-content" class="home-stage">
        <header class="home-intro">
          <div><h1>Mau main apa?</h1><p>Lima game langsung dari browser. Main bebas tanpa akun, atau masuk untuk mencatat hasil solo.</p></div>
          <p class="home-session-note"><strong>${gameCatalog.length} game</strong><span>Room multiplayer tetap privat dan peer to peer.</span></p>
        </header>
        <section class="game-library" aria-labelledby="library-title">
          <div class="library-heading"><h2 id="library-title">Pilih game</h2><p>${isSolo ? 'Solo, langsung mulai.' : `${selectedGame.playerLabel} pemain, room privat.`}</p></div>
          <div class="game-shelf" aria-label="Koleksi game Ruang Main">${gameCatalog.map((item) => gameCard(item, item.id === selectedGameId)).join('')}</div>
        </section>
        <section class="play-dock" id="selected-game" aria-labelledby="join-title">
          <div class="play-summary">
            <span class="play-number" aria-hidden="true">${String(gameCatalog.findIndex((item) => item.id === selectedGameId) + 1).padStart(2, '0')}</span>
            <div><p>${isSolo ? 'Main sendiri' : 'Main bareng'}</p><h2 id="join-title">${selectedGame.name}</h2><p>${selectedGame.description}</p>${notice ? `<p class="notice" role="alert">${escapeHtml(notice)}</p>` : ''}</div>
          </div>
          ${isSolo ? `
            <div class="play-actions solo-start">
              <button class="button button-primary" type="button" id="start-solo">Mulai bermain</button>
              <p>Akun opsional menyimpan hasil, bukan posisi permainan.</p>
            </div>` : `
            <form class="play-actions" id="room-form" novalidate>
              <button class="button button-primary" type="button" id="create-room">Buat room</button>
              <div class="quick-join"><label for="room-code">Sudah punya kode?</label><div><input id="room-code" name="room" class="code-input" maxlength="16" autocomplete="off" placeholder="ABCD2345" spellcheck="false" /><button class="button button-secondary" type="submit" id="join-room">Gabung</button></div></div>
              <button class="text-button" type="button" id="open-demo">Buka mode demo</button>
              <p id="form-error" class="form-error" role="alert"></p>
            </form>`}
        </section>
      </main>
      ${homeSupport()}
      ${publicFooter()}
      ${isSolo ? '' : nameDialog()}`,
  }
}

function nameDialog() {
  return `<dialog class="asset-dialog name-dialog" id="name-dialog" aria-labelledby="name-dialog-title">
    <form id="name-form" novalidate>
      <p class="step-label" id="name-dialog-mode">Buat room baru</p>
      <h2 id="name-dialog-title">Nama pemain</h2>
      <p class="muted">Nama ini hanya tampil selama permainan.</p>
      <div class="field">
        <label for="player-name">Nama kamu</label>
        <input id="player-name" name="name" maxlength="20" autocomplete="nickname" placeholder="Contoh: Thoriq" required />
        <p class="field-hint">Maksimal 20 karakter.</p>
        <p id="name-error" class="form-error" role="alert"></p>
      </div>
      <div class="name-dialog-actions"><button class="button button-secondary" type="button" id="cancel-name">Batal</button><button class="button button-primary" type="submit" id="confirm-name">Buat room</button></div>
    </form>
  </dialog>`
}

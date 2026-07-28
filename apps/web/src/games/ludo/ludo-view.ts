import {globalTrackIndex, ludoColorNames, ludoColors, ludoHomeCells, ludoTrackCells, type LudoColor, type LudoState} from './ludo-game'
import {copyIcon, dieView, escapeHtml, gameHeader, initial} from '../../shared/ui'

const baseTokenCells: Record<LudoColor, readonly (readonly [number, number])[]> = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  blue: [[1, 10], [1, 13], [4, 10], [4, 13]],
  green: [[10, 10], [10, 13], [13, 10], [13, 13]],
  yellow: [[10, 1], [10, 4], [13, 1], [13, 4]],
}

export function ludoLobbyScreen(state: LudoState | null, roomCode: string, host: boolean, localPeerId: string) {
  const players = state?.players ?? []
  const local = players.find((player) => player.id === localPeerId)
  const ready = players.length >= 2 && players.every((player) => player.color)
  return `
    ${gameHeader({title: 'Ludo', className: 'ludo-header'})}
    <main id="main-content" class="ludo-lobby-shell">
      <section class="ludo-lobby-card">
        <div class="ludo-lobby-heading">
          <div><p class="eyebrow">ROOM PRIVATE</p><h1>${state ? 'Pilih warna pion' : 'Mencari host...'}</h1><p>Satu warna untuk satu pemain. Pilihanmu akan langsung terlihat oleh semua teman di room.</p></div>
          <div class="snakes-room-code"><span>Kode room</span><strong>${escapeHtml(roomCode)}</strong><button class="icon-button" type="button" id="copy-code" aria-label="Salin kode room">${copyIcon()}</button></div>
        </div>
        ${state ? `
          <fieldset class="ludo-color-picker"><legend>Warna kamu</legend><div>
            ${ludoColors.map((color) => {
              const owner = players.find((player) => player.color === color)
              const selected = local?.color === color
              return `<button class="ludo-color-option color-${color} ${selected ? 'is-selected' : ''}" type="button" data-ludo-color="${color}" aria-pressed="${selected}" ${owner && owner.id !== localPeerId ? 'disabled' : ''}><i aria-hidden="true"></i><span>${ludoColorNames[color]}</span><small>${owner ? owner.id === localPeerId ? 'Pilihanmu' : escapeHtml(owner.name) : 'Tersedia'}</small></button>`
            }).join('')}
          </div></fieldset>
          <div class="ludo-lobby-bottom">
            <div class="ludo-roster" aria-label="Daftar pemain">${players.map((player) => `<div><span class="ludo-player-mark ${player.color ? `color-${player.color}` : ''}">${initial(player.name)}</span><p><strong>${escapeHtml(player.name)}</strong><small>${player.id === state.hostId ? 'Host' : player.id === localPeerId ? 'Kamu' : player.color ? ludoColorNames[player.color] : 'Belum memilih'}</small></p></div>`).join('')}</div>
            ${host ? `<div class="ludo-start-area"><button class="button button-primary" id="start-ludo" type="button" ${ready ? '' : 'disabled'}>Mulai Ludo</button><p>${ready ? `${players.length} pemain siap.` : players.length < 2 ? 'Minimal dua pemain.' : 'Semua pemain harus memilih warna.'}</p></div>` : '<p class="waiting-note"><span class="status-dot"></span> Menunggu host memulai.</p>'}
          </div>
        ` : '<div class="connecting-state"><span class="spinner"></span><p>Menemukan peer melalui jaringan Nostr...</p></div>'}
      </section>
    </main>`
}

export function ludoGameScreen(state: LudoState, roomCode: string, canRoll: boolean, canChoose: boolean, movableTokens: number[], demo: boolean, animateDice: boolean) {
  const current = state.players.find((player) => player.id === state.currentPlayerId)
  const winner = state.players.find((player) => player.id === state.winnerId)
  return `
    ${gameHeader({title: 'Ludo', compact: false, roomCode, status: demo ? 'Mode demo' : 'Room aktif', className: 'ludo-header'})}
    <main id="main-content" class="ludo-game-shell">
      <aside class="ludo-side-panel">
        <div><p class="game-panel-label">Permainan</p><h1>Ludo</h1><p>Keluarkan pion dengan angka enam. Bawa keempat pion tepat ke rumah untuk menang.</p></div>
        <div class="ludo-turn-card ${current?.color ? `color-${current.color}` : ''}"><span>Giliran sekarang</span><strong>${escapeHtml(current?.name ?? winner?.name ?? 'Selesai')}</strong><div class="single-die dice-row" role="status" aria-live="polite">${dieView(state.lastRoll, 0, animateDice)}</div>
          ${state.pendingRoll !== null && canChoose ? `<p>Pilih pion untuk bergerak ${state.pendingRoll} langkah.</p><div class="ludo-token-choices">${movableTokens.map((index) => `<button type="button" data-ludo-token="${index}"><i aria-hidden="true"></i>Pion ${index + 1}</button>`).join('')}</div>` : `<button class="button button-primary" id="roll-ludo" type="button" ${canRoll ? '' : 'disabled'}>${canRoll ? 'Lempar dadu' : state.pendingRoll !== null ? 'Memilih pion...' : 'Menunggu giliran'}</button>`}
        </div>
        <div class="ludo-player-list">${state.players.map((player) => `<div class="${player.id === state.currentPlayerId ? 'is-current' : ''}"><span class="ludo-player-mark color-${player.color}">${initial(player.name)}</span><p><strong>${escapeHtml(player.name)}</strong><small>${player.tokens.filter((token) => token === 57).length}/4 pion pulang</small></p></div>`).join('')}</div>
        <ol class="snakes-log">${state.log.slice(-4).reverse().map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ol>
      </aside>
      <section class="ludo-board-wrap" aria-label="Papan Ludo">
        <div class="ludo-board">
          ${ludoColors.map((color) => `<div class="ludo-base color-${color}"><div></div><i></i><i></i><i></i><i></i></div>`).join('')}
          ${ludoTrackCells.map(([row, column], index) => `<div class="ludo-cell ludo-track ${[0, 13, 26, 39].includes(index) ? `is-safe color-${ludoColors[[0, 13, 26, 39].indexOf(index)]}` : ''}" style="--row:${row + 1};--column:${column + 1}" aria-hidden="true"></div>`).join('')}
          ${ludoColors.flatMap((color) => ludoHomeCells[color].map(([row, column]) => `<div class="ludo-cell ludo-home color-${color}" style="--row:${row + 1};--column:${column + 1}" aria-hidden="true"></div>`)).join('')}
          <div class="ludo-center" aria-label="Rumah akhir"></div>
          ${state.players.flatMap((player) => player.tokens.map((progress, tokenIndex) => tokenView(player.id, player.color!, progress, tokenIndex, player.name))).join('')}
        </div>
      </section>
      ${state.phase === 'finished' ? `<section class="snakes-result" role="dialog" aria-modal="true"><p class="eyebrow">PERMAINAN SELESAI</p><h2>${escapeHtml(winner?.name ?? 'Pemain')} menang!</h2><p>Keempat pion berhasil tiba di rumah.</p><button class="button button-primary" type="button" data-leave>Kembali ke beranda</button></section>` : ''}
    </main>`
}

function tokenView(playerId: string, color: LudoColor, progress: number, tokenIndex: number, name: string) {
  const [row, column] = progress === -1
    ? baseTokenCells[color][tokenIndex]
    : progress <= 51
      ? ludoTrackCells[globalTrackIndex(color, progress)]
      : ludoHomeCells[color][progress - 52]
  return `<span class="ludo-token color-${color}" data-ludo-player="${escapeHtml(playerId)}" data-ludo-token="${tokenIndex}" style="--row:${row + 1};--column:${column + 1};--token-offset:${tokenIndex}" title="${escapeHtml(name)}, pion ${tokenIndex + 1}" aria-label="${escapeHtml(name)}, pion ${tokenIndex + 1}"><i></i></span>`
}

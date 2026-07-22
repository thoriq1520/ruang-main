import {snakeMap, snakeMaps, type SnakeMap, type SnakesState} from './snakes-game'
import {copyIcon, escapeHtml, initial, logoMark} from './ui'

const playerClasses = ['pawn-0', 'pawn-1', 'pawn-2', 'pawn-3']

export function snakesLobbyScreen(state: SnakesState | null, roomCode: string, host: boolean, localPeerId: string) {
  const players = state?.players ?? []
  return `
    <header class="site-header compact-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Mini Games Coop</span></a>
      <span class="game-id">Ular Tangga</span>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>
    <main id="main-content" class="snakes-lobby-shell">
      <section class="snakes-lobby-card">
        <div class="snakes-lobby-heading">
          <div><p class="eyebrow">ROOM PRIVATE</p><h1>${state ? 'Pilih petualangan' : 'Mencari host...'}</h1><p>Host memilih peta. Semua pemain memakai aturan yang sama, tetapi jalur ular dan tangganya berbeda.</p></div>
          <div class="snakes-room-code"><span>Kode room</span><strong>${escapeHtml(roomCode)}</strong><button class="icon-button" type="button" id="copy-code" aria-label="Salin kode room">${copyIcon()}</button></div>
        </div>
        ${state ? `
          <fieldset class="snake-map-picker" ${host ? '' : 'disabled'}><legend>Pilih peta</legend>
            <div class="snake-map-grid">${snakeMaps.map((map) => mapOption(map, state.mapId === map.id)).join('')}</div>
            ${host ? '' : '<p>Menunggu host menentukan peta.</p>'}
          </fieldset>
          <div class="snakes-lobby-bottom">
            <div class="snakes-roster" aria-label="Daftar pemain">${players.map((player, index) => `<div><span class="snake-player-dot ${playerClasses[index]}">${initial(player.name)}</span><p><strong>${escapeHtml(player.name)}</strong><small>${player.id === state.hostId ? 'Host' : player.id === localPeerId ? 'Kamu' : 'Siap'}</small></p></div>`).join('')}</div>
            ${host ? `<button class="button button-primary" id="start-snakes" type="button" ${players.length >= 2 ? '' : 'disabled'}>Mulai di ${escapeHtml(snakeMap(state.mapId).name)}</button>` : '<p class="waiting-note"><span class="status-dot"></span> Menunggu host memulai.</p>'}
          </div>
        ` : '<div class="connecting-state"><span class="spinner"></span><p>Menemukan peer melalui jaringan Nostr...</p></div>'}
      </section>
    </main>`
}

export function snakesGameScreen(state: SnakesState, roomCode: string, canRoll: boolean, demo: boolean, animateMove: boolean) {
  const map = snakeMap(state.mapId)
  const current = state.players.find((player) => player.id === state.currentPlayerId)
  const winner = state.players.find((player) => player.id === state.winnerId)
  return `
    <header class="game-header snakes-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Mini Games Coop</span></a>
      <div class="game-meta"><span class="live-badge"><span class="status-dot"></span>${demo ? 'Mode demo' : 'Room aktif'}</span><span class="room-mini">${escapeHtml(roomCode)}</span></div>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>
    <main id="main-content" class="snakes-game-shell theme-${map.id}">
      <aside class="snakes-side-panel">
        <div><p class="eyebrow">ULAR TANGGA</p><h1>${escapeHtml(map.name)}</h1><p>${escapeHtml(map.tagline)}</p></div>
        <div class="snakes-turn-card"><span>Giliran sekarang</span><strong>${escapeHtml(current?.name ?? winner?.name ?? 'Selesai')}</strong><div class="snakes-die" aria-label="Hasil dadu terakhir">${state.lastRoll ?? '?'}</div><button class="button button-primary" id="roll-snakes" type="button" ${canRoll ? '' : 'disabled'}>${canRoll ? 'Lempar dadu' : 'Menunggu giliran'}</button></div>
        <div class="snakes-player-list">${state.players.map((player, index) => `<div class="${player.id === state.currentPlayerId ? 'is-current' : ''}"><span class="snake-player-dot ${playerClasses[index]}">${initial(player.name)}</span><p><strong>${escapeHtml(player.name)}</strong><small>Petak ${player.position}</small></p></div>`).join('')}</div>
        <ol class="snakes-log">${state.log.slice(-4).reverse().map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ol>
      </aside>
      <section class="snakes-board-wrap" aria-label="Papan ${escapeHtml(map.name)}">
        <div class="snakes-board">
          ${boardNumbers().map((number) => boardCell(number, state, map, animateMove)).join('')}
          <svg class="snakes-links" viewBox="0 0 1000 1000" aria-hidden="true">${links(map)}</svg>
        </div>
      </section>
      ${state.phase === 'finished' ? `<section class="snakes-result" role="dialog" aria-modal="true"><p class="eyebrow">PERMAINAN SELESAI</p><h2>${escapeHtml(winner?.name ?? 'Pemain')} mencapai puncak!</h2><p>Petak 100 berhasil dicapai di peta ${escapeHtml(map.name)}.</p><button class="button button-primary" type="button" data-leave>Kembali ke beranda</button></section>` : ''}
    </main>`
}

function mapOption(map: SnakeMap, selected: boolean) {
  return `<button type="button" class="snake-map-option theme-${map.id} ${selected ? 'is-selected' : ''}" data-snake-map="${map.id}" aria-pressed="${selected}"><span class="snake-map-preview" aria-hidden="true"><i></i><i></i><i></i></span><strong>${escapeHtml(map.name)}</strong><small>${escapeHtml(map.tagline)}</small></button>`
}

function boardNumbers() {
  return Array.from({length: 10}, (_, visualRow) => {
    const row = 9 - visualRow
    const numbers = Array.from({length: 10}, (_, index) => row * 10 + index + 1)
    return row % 2 ? numbers.reverse() : numbers
  }).flat()
}

function boardCell(number: number, state: SnakesState, map: SnakeMap, animateMove: boolean) {
  const players = state.players.map((player, index) => ({player, index})).filter(({player}) => player.position === number)
  const destination = map.ladders[number] ?? map.snakes[number]
  const effect = map.ladders[number] ? `Tangga ke ${destination}` : map.snakes[number] ? `Ular ke ${destination}` : ''
  return `<div class="snakes-cell ${number === 1 || number === 100 ? 'is-corner' : ''}" aria-label="Petak ${number}${effect ? `, ${effect}` : ''}"><span>${number}</span><div class="snakes-cell-tokens">${players.map(({player, index}) => `<i class="snake-token ${animateMove && player.id === state.lastMove?.playerId ? 'is-latest' : ''} ${playerClasses[index]}" title="${escapeHtml(player.name)}">${initial(player.name)}</i>`).join('')}</div></div>`
}

function cellCenter(number: number) {
  const row = Math.floor((number - 1) / 10)
  const offset = (number - 1) % 10
  const column = row % 2 ? 9 - offset : offset
  return {x: (column + .5) * 100, y: (9 - row + .5) * 100}
}

function links(map: SnakeMap) {
  const ladders = Object.entries(map.ladders).map(([from, to]) => {
    const a = cellCenter(Number(from)); const b = cellCenter(to)
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    const offset = {x: (-(b.y - a.y) / length) * 9, y: ((b.x - a.x) / length) * 9}
    const rungs = Array.from({length: 6}, (_, index) => {
      const progress = (index + 1) / 7
      const x = a.x + (b.x - a.x) * progress
      const y = a.y + (b.y - a.y) * progress
      return `<line class="ladder-rung" x1="${x + offset.x}" y1="${y + offset.y}" x2="${x - offset.x}" y2="${y - offset.y}"/>`
    }).join('')
    return `<g class="ladder-link"><line x1="${a.x + offset.x}" y1="${a.y + offset.y}" x2="${b.x + offset.x}" y2="${b.y + offset.y}"/><line x1="${a.x - offset.x}" y1="${a.y - offset.y}" x2="${b.x - offset.x}" y2="${b.y - offset.y}"/>${rungs}</g>`
  }).join('')
  const snakes = Object.entries(map.snakes).map(([from, to]) => {
    const a = cellCenter(Number(from)); const b = cellCenter(to); const cx = (a.x + b.x) / 2 + 45; const cy = (a.y + b.y) / 2
    return `<g class="snake-link"><path d="M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}"/><circle cx="${a.x}" cy="${a.y}" r="13"/></g>`
  }).join('')
  return ladders + snakes
}

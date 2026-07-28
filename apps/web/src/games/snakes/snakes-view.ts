import {snakeMap, snakeMaps, type SnakeMap, type SnakesState} from './snakes-game'
import {copyIcon, dieView, escapeHtml, gameHeader, initial} from '../../shared/ui'

const playerClasses = ['pawn-0', 'pawn-1', 'pawn-2', 'pawn-3']

export function snakesLobbyScreen(state: SnakesState | null, roomCode: string, host: boolean, localPeerId: string) {
  const players = state?.players ?? []
  return `
    ${gameHeader({title: 'Ular Tangga', className: 'snakes-header'})}
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

export function snakesGameScreen(state: SnakesState, roomCode: string, canRoll: boolean, demo: boolean, animateDice: boolean) {
  const map = snakeMap(state.mapId)
  const current = state.players.find((player) => player.id === state.currentPlayerId)
  const winner = state.players.find((player) => player.id === state.winnerId)
  return `
    ${gameHeader({title: 'Ular Tangga', compact: false, roomCode, status: demo ? 'Mode demo' : 'Room aktif', className: 'snakes-header'})}
    <main id="main-content" class="snakes-game-shell theme-${map.id}">
      <aside class="snakes-side-panel">
        <div><p class="game-panel-label">Ular Tangga</p><h1>${escapeHtml(map.name)}</h1><p>${escapeHtml(map.tagline)}</p></div>
        <div class="snakes-turn-card"><span>Giliran sekarang</span><strong>${escapeHtml(current?.name ?? winner?.name ?? 'Selesai')}</strong><div class="single-die dice-row" role="status" aria-live="polite">${dieView(state.lastRoll, 0, animateDice)}</div><button class="button button-primary" id="roll-snakes" type="button" ${canRoll ? '' : 'disabled'}>${canRoll ? 'Lempar dadu' : 'Menunggu giliran'}</button></div>
        <div class="snakes-player-list">${state.players.map((player, index) => `<div class="${player.id === state.currentPlayerId ? 'is-current' : ''}"><span class="snake-player-dot ${playerClasses[index]}">${initial(player.name)}</span><p><strong>${escapeHtml(player.name)}</strong><small>Petak ${player.position}</small></p></div>`).join('')}</div>
        <ol class="snakes-log">${state.log.slice(-4).reverse().map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ol>
      </aside>
      <section class="snakes-board-wrap" aria-label="Papan ${escapeHtml(map.name)}">
        <div class="snakes-board">
          ${boardNumbers().map((number) => boardCell(number, state, map)).join('')}
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

function boardCell(number: number, state: SnakesState, map: SnakeMap) {
  const players = state.players.map((player, index) => ({player, index})).filter(({player}) => player.position === number)
  const destination = map.ladders[number] ?? map.snakes[number]
  const effect = map.ladders[number] ? `Tangga ke ${destination}` : map.snakes[number] ? `Ular ke ${destination}` : ''
  return `<div class="snakes-cell ${number === 1 || number === 100 ? 'is-corner' : ''}" data-snake-cell="${number}" aria-label="Petak ${number}${effect ? `, ${effect}` : ''}"><span>${number}</span><div class="snakes-cell-tokens">${players.map(({player, index}) => `<i class="snake-token ${playerClasses[index]}" data-snake-player="${escapeHtml(player.id)}" title="${escapeHtml(player.name)}">${initial(player.name)}</i>`).join('')}</div></div>`
}

function cellCenter(number: number) {
  const row = Math.floor((number - 1) / 10)
  const offset = (number - 1) % 10
  const column = row % 2 ? 9 - offset : offset
  return {x: (column + .5) * 100, y: (9 - row + .5) * 100}
}

function links(map: SnakeMap) {
  const ladders = Object.entries(map.ladders).map(([from, to]) => {
    const a = cellCenter(Number(from))
    const b = cellCenter(to)
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    const nx = -(b.y - a.y) / length
    const ny = (b.x - a.x) / length
    const w = 11

    const rungCount = Math.max(3, Math.floor(length / 38))
    const rungs = Array.from({length: rungCount}, (_, index) => {
      const progress = (index + 1) / (rungCount + 1)
      const rx = a.x + (b.x - a.x) * progress
      const ry = a.y + (b.y - a.y) * progress
      const lx = rx + nx * w
      const ly = ry + ny * w
      const rxPos = rx - nx * w
      const ryPos = ry - ny * w
      return `
        <line class="ladder-rung" x1="${lx}" y1="${ly}" x2="${rxPos}" y2="${ryPos}"/>
        <line class="ladder-rung-core" x1="${lx}" y1="${ly}" x2="${rxPos}" y2="${ryPos}"/>
        <circle class="ladder-joint" cx="${lx}" cy="${ly}" r="3"/>
        <circle class="ladder-joint" cx="${rxPos}" cy="${ryPos}" r="3"/>
      `
    }).join('')

    return `<g class="ladder-link">
      <line class="ladder-rail" x1="${a.x + nx * w}" y1="${a.y + ny * w}" x2="${b.x + nx * w}" y2="${b.y + ny * w}"/>
      <line class="ladder-rail" x1="${a.x - nx * w}" y1="${a.y - ny * w}" x2="${b.x - nx * w}" y2="${b.y - ny * w}"/>
      <line class="ladder-rail-core" x1="${a.x + nx * w}" y1="${a.y + ny * w}" x2="${b.x + nx * w}" y2="${b.y + ny * w}"/>
      <line class="ladder-rail-core" x1="${a.x - nx * w}" y1="${a.y - ny * w}" x2="${b.x - nx * w}" y2="${b.y - ny * w}"/>
      ${rungs}
    </g>`
  }).join('')

  const snakes = Object.entries(map.snakes).map(([from, to], index) => {
    const a = cellCenter(Number(from))
    const b = cellCenter(to)
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    const nx = -(b.y - a.y) / length
    const ny = (b.x - a.x) / length

    const waveAmp = (index % 2 === 0 ? 1 : -1) * Math.min(48, length * 0.26)
    const c1x = a.x + (b.x - a.x) * 0.3 + nx * waveAmp
    const c1y = a.y + (b.y - a.y) * 0.3 + ny * waveAmp
    const c2x = a.x + (b.x - a.x) * 0.7 - nx * waveAmp
    const c2y = a.y + (b.y - a.y) * 0.7 - ny * waveAmp

    const pathD = `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`
    const headAngleDeg = (Math.atan2(c1y - a.y, c1x - a.x) * 180) / Math.PI

    return `<g class="snake-link">
      <path class="snake-shadow" d="${pathD}"/>
      <path class="snake-outline" d="${pathD}"/>
      <path class="snake-body" d="${pathD}"/>
      <path class="snake-pattern" d="${pathD}"/>
      <circle class="snake-tail" cx="${b.x}" cy="${b.y}" r="6.5"/>
      <g transform="translate(${a.x}, ${a.y}) rotate(${headAngleDeg})">
        <path class="snake-tongue" d="M 12 0 L 23 0 L 27 -4 M 23 0 L 27 4"/>
        <ellipse class="snake-head" cx="2" cy="0" rx="16" ry="12"/>
        <circle class="snake-eye-white" cx="6" cy="-5" r="4"/>
        <circle class="snake-eye-pupil" cx="7.2" cy="-5" r="2"/>
        <circle class="snake-eye-white" cx="6" cy="5" r="4"/>
        <circle class="snake-eye-pupil" cx="7.2" cy="5" r="2"/>
        <circle class="snake-cheek" cx="-1" cy="-6" r="2.8" opacity="0.45"/>
        <circle class="snake-cheek" cx="-1" cy="6" r="2.8" opacity="0.45"/>
      </g>
    </g>`
  }).join('')

  return ladders + snakes
}

import {arrowTravel, type ArrowDirection, type ArrowGameState, type ArrowPiece} from './arrow-game'
import {logoMark} from '../../ui'

const directionLabel: Record<ArrowDirection, string> = {
  up: 'atas',
  right: 'kanan',
  down: 'bawah',
  left: 'kiri',
}

function arrowHead(arrow: ArrowPiece) {
  const head = arrow.points.at(-1)!
  const x = head.column + .5
  const y = head.row + .5
  if (arrow.direction === 'right') return `M ${x - .21} ${y - .16} L ${x} ${y} L ${x - .21} ${y + .16}`
  if (arrow.direction === 'left') return `M ${x + .21} ${y - .16} L ${x} ${y} L ${x + .21} ${y + .16}`
  if (arrow.direction === 'down') return `M ${x - .16} ${y - .21} L ${x} ${y} L ${x + .16} ${y - .21}`
  return `M ${x - .16} ${y + .21} L ${x} ${y} L ${x + .16} ${y + .21}`
}

function arrowLine(state: ArrowGameState, arrow: ArrowPiece, hinted: boolean) {
  const size = state.size
  const points = arrow.points.map((point) => `${point.column + .5},${point.row + .5}`).join(' ')
  const head = arrow.points.at(-1)!
  const x = head.column + .5
  const y = head.row + .5
  const exit = arrow.direction === 'right' ? {x: size + .6, y}
    : arrow.direction === 'left' ? {x: -.6, y}
      : arrow.direction === 'down' ? {x, y: size + .6}
        : {x, y: -.6}
  const travel = arrowTravel(state, arrow.id)!
  const collision = {x: x + travel.x, y: y + travel.y}
  const reboundTail = Math.min(.8, Math.hypot(travel.x, travel.y) / Math.max(1, arrow.points.length - 1))
  return `<g
    class="arrow-piece ${hinted ? 'is-hinted' : ''}"
    data-arrow-id="${arrow.id}"
    data-direction="${arrow.direction}"
    style="--arrow-rebound-tail:${reboundTail}"
    role="button"
    tabindex="0"
    aria-label="Panah berbelit dengan kepala di baris ${head.row + 1}, kolom ${head.column + 1}, mengarah ke ${directionLabel[arrow.direction]}"
  >
    <polyline class="arrow-hit" points="${points}" />
    <polyline class="arrow-visible" pathLength="1" points="${points}" />
    <line class="arrow-exit" x1="${x}" y1="${y}" x2="${x}" y2="${y}">
      <animate class="arrow-safe-motion" attributeName="x2" from="${x}" to="${exit.x}" begin="indefinite" dur="480ms" calcMode="spline" keySplines=".2 .8 .2 1" fill="freeze" />
      <animate class="arrow-safe-motion" attributeName="y2" from="${y}" to="${exit.y}" begin="indefinite" dur="480ms" calcMode="spline" keySplines=".2 .8 .2 1" fill="freeze" />
    </line>
    <line class="arrow-collision-run" pathLength="1" x1="${x}" y1="${y}" x2="${collision.x}" y2="${collision.y}" />
    <g class="arrow-head-track">
      <path class="arrow-head" d="${arrowHead(arrow)}" />
      <animateTransform class="arrow-safe-motion" attributeName="transform" type="translate" from="0 0" to="${exit.x - x} ${exit.y - y}" begin="indefinite" dur="480ms" calcMode="spline" keySplines=".2 .8 .2 1" fill="freeze" />
      <animateTransform class="arrow-blocked-motion" attributeName="transform" type="translate" values="0 0;${travel.x} ${travel.y};0 0" begin="indefinite" dur="480ms" keyTimes="0;.48;1" calcMode="spline" keySplines=".35 0 .65 1;.35 0 .4 1" />
    </g>
  </g>`
}

export function arrowGameScreen(state: ArrowGameState) {
  const remaining = state.arrows.length
  const result = state.status === 'won'
    ? `<section class="arrow-result" role="dialog" aria-modal="true" aria-labelledby="arrow-result-title"><p class="step-label">Papan bersih</p><h2 id="arrow-result-title">Level ${state.level} selesai</h2><p>${state.moves} langkah dengan ${state.mistakes} kesalahan.</p><button class="button button-primary" id="next-arrow-level" type="button">Level berikutnya</button></section>`
    : state.status === 'lost'
      ? `<section class="arrow-result" role="dialog" aria-modal="true" aria-labelledby="arrow-result-title"><p class="step-label">Kesempatan habis</p><h2 id="arrow-result-title">Coba jalur lain</h2><p>Mulai ulang papan ini dan perhatikan ruang di depan setiap kepala panah.</p><button class="button button-primary" data-restart-arrow type="button">Ulang level</button></section>`
      : ''

  return `
    <header class="site-header compact-header arrow-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Ruang Main</span></a>
      <span class="game-id">Arrow Puzzle</span>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>
    <main id="main-content" class="arrow-shell">
      <section class="arrow-game-panel" aria-labelledby="arrow-title">
        <div class="arrow-game-copy">
          <p class="eyebrow">PUZZLE SOLO</p>
          <h1 id="arrow-title">Urai jalurnya.</h1>
          <p>Ketuk garis yang kepala panahnya punya jalan kosong hingga tepi. Garis yang salah akan menabrak dan mengurangi nyawa.</p>
          <dl class="arrow-stats">
            <div><dt>Level</dt><dd>${state.level}</dd></div>
            <div><dt>Tersisa</dt><dd>${remaining}</dd></div>
            <div><dt>Nyawa</dt><dd>${state.lives} / ${state.maxLives}</dd></div>
          </dl>
          <div class="arrow-actions">
            <button class="button button-primary" id="hint-arrow" type="button" ${state.status === 'playing' ? '' : 'disabled'}>Petunjuk</button>
            <button class="button button-secondary" data-restart-arrow type="button">Ulang level</button>
          </div>
          <p class="arrow-session-note">Progres hanya berlaku selama tab ini terbuka.</p>
        </div>
        <div class="arrow-board-wrap">
          <div class="arrow-board" style="--arrow-grid-size:${state.size}" role="group" aria-label="Papan Arrow Puzzle level ${state.level}">
            <svg class="arrow-lines" viewBox="0 0 ${state.size} ${state.size}" aria-label="${remaining} jalur panah tersisa">
              ${state.arrows.map((arrow) => arrowLine(state, arrow, state.hintId === arrow.id)).join('')}
            </svg>
          </div>
          ${result}
        </div>
      </section>
    </main>`
}

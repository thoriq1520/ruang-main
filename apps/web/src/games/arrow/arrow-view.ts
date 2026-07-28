import {arrowTravel, type ArrowDirection, type ArrowGameState, type ArrowPiece} from './arrow-game'
import {gameHeader} from '../../shared/ui'

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
  const columns = arrow.points.map((point) => point.column + .5)
  const rows = arrow.points.map((point) => point.row + .5)
  const exit = arrow.direction === 'right' ? {x: size + .8 - Math.min(...columns), y: 0}
    : arrow.direction === 'left' ? {x: -.8 - Math.max(...columns), y: 0}
      : arrow.direction === 'down' ? {x: 0, y: size + .8 - Math.min(...rows)}
        : {x: 0, y: -.8 - Math.max(...rows)}
  const travel = arrowTravel(state, arrow.id)!
  return `<g
    class="arrow-piece ${hinted ? 'is-hinted' : ''}"
    data-arrow-id="${arrow.id}"
    data-direction="${arrow.direction}"
    role="button"
    tabindex="0"
    aria-label="Panah berbelit dengan kepala di baris ${head.row + 1}, kolom ${head.column + 1}, mengarah ke ${directionLabel[arrow.direction]}"
  >
    <animateTransform class="arrow-safe-motion" attributeName="transform" type="translate" from="0 0" to="${exit.x} ${exit.y}" begin="indefinite" dur="440ms" calcMode="spline" keySplines=".2 .8 .2 1" fill="freeze" />
    <animateTransform class="arrow-blocked-motion" attributeName="transform" type="translate" values="0 0;${travel.x} ${travel.y};0 0" begin="indefinite" dur="420ms" keyTimes="0;.48;1" calcMode="spline" keySplines=".35 0 .65 1;.35 0 .4 1" />
    <polyline class="arrow-hit" points="${points}" />
    <polyline class="arrow-visible" points="${points}" />
    <path class="arrow-head" d="${arrowHead(arrow)}" />
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
    ${gameHeader({title: 'Arrow Puzzle', className: 'arrow-header'})}
    <main id="main-content" class="arrow-shell">
      <section class="arrow-game-panel" aria-labelledby="arrow-title">
        <div class="arrow-game-copy">
          <p class="arrow-game-label">Arrow Puzzle</p>
          <h1 id="arrow-title">Level ${state.level}</h1>
          <p class="arrow-objective">Pilih panah dengan jalur kosong menuju tepi.</p>
          <dl class="arrow-stats">
            <div><dt>Tersisa</dt><dd>${remaining}</dd></div>
            <div><dt>Nyawa</dt><dd>${state.lives}/${state.maxLives}</dd></div>
            <div><dt>Langkah</dt><dd>${state.moves}</dd></div>
          </dl>
          <div class="arrow-actions">
            <button class="button button-primary" id="hint-arrow" type="button" ${state.status === 'playing' ? '' : 'disabled'}>Petunjuk</button>
            <button class="button button-secondary" data-restart-arrow type="button">Mulai ulang</button>
          </div>
          <div class="arrow-rule">
            <strong>Cara bermain</strong>
            <p>Ketuk kepala panah. Jika terhalang, panah memantul dan satu nyawa berkurang.</p>
          </div>
          <p class="arrow-session-note">Hasil tersimpan jika kamu sudah masuk.</p>
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

import type {ArrowDirection, ArrowGameState} from './arrow-game'
import {logoMark} from './ui'

const directionLabel: Record<ArrowDirection, string> = {
  up: 'atas',
  right: 'kanan',
  down: 'bawah',
  left: 'kiri',
}

const directionGlyph: Record<ArrowDirection, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
}

export function arrowGameScreen(state: ArrowGameState) {
  const remaining = state.arrows.length
  const result = state.status === 'won'
    ? `<section class="arrow-result" role="dialog" aria-modal="true" aria-labelledby="arrow-result-title"><p class="step-label">Papan bersih</p><h2 id="arrow-result-title">Level ${state.level} selesai</h2><p>${state.moves} langkah dengan ${state.mistakes} kesalahan.</p><button class="button button-primary" id="next-arrow-level" type="button">Level berikutnya</button></section>`
    : state.status === 'lost'
      ? `<section class="arrow-result" role="dialog" aria-modal="true" aria-labelledby="arrow-result-title"><p class="step-label">Kesempatan habis</p><h2 id="arrow-result-title">Coba jalur lain</h2><p>Mulai ulang papan ini dan baca arah panah dari tepi.</p><button class="button button-primary" data-restart-arrow type="button">Ulang level</button></section>`
      : ''

  return `
    <header class="site-header compact-header arrow-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Mini Games Coop</span></a>
      <span class="game-id">Arrow Puzzle</span>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>
    <main id="main-content" class="arrow-shell">
      <section class="arrow-game-panel" aria-labelledby="arrow-title">
        <div class="arrow-game-copy">
          <p class="eyebrow">PUZZLE SOLO</p>
          <h1 id="arrow-title">Kosongkan papan.</h1>
          <p>Pilih panah yang memiliki jalur kosong sampai keluar dari papan. Salah pilih mengurangi satu nyawa.</p>
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
        <div class="arrow-board-wrap ${state.lastAction?.result === 'blocked' ? 'is-wrong' : ''}">
          <div class="arrow-board" style="--arrow-grid-size:${state.size}" aria-label="Papan Arrow Puzzle level ${state.level}">
            <canvas id="arrow-canvas" width="720" height="720" aria-hidden="true"></canvas>
            ${state.arrows.map((arrow) => `<button
              class="arrow-piece ${state.hintId === arrow.id ? 'is-hinted' : ''}"
              type="button"
              data-arrow-id="${arrow.id}"
              data-direction="${arrow.direction}"
              style="--arrow-row:${arrow.row};--arrow-column:${arrow.column}"
              aria-label="Panah baris ${arrow.row + 1} kolom ${arrow.column + 1}, arah ${directionLabel[arrow.direction]}"
            >${directionGlyph[arrow.direction]}</button>`).join('')}
          </div>
          ${result}
        </div>
      </section>
    </main>`
}

export function drawArrowBoard(state: ArrowGameState) {
  const canvas = document.querySelector<HTMLCanvasElement>('#arrow-canvas')
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return
  const unit = canvas.width / state.size
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#f5efdf'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#d7cdb8'
  context.lineWidth = 2
  for (let index = 1; index < state.size; index += 1) {
    const position = index * unit
    context.beginPath()
    context.moveTo(position, 0)
    context.lineTo(position, canvas.height)
    context.moveTo(0, position)
    context.lineTo(canvas.width, position)
    context.stroke()
  }
  context.fillStyle = '#c3b7a0'
  for (let row = 0; row < state.size; row += 1) {
    for (let column = 0; column < state.size; column += 1) {
      context.beginPath()
      context.arc((column + .5) * unit, (row + .5) * unit, Math.max(3, 6 - state.size / 2), 0, Math.PI * 2)
      context.fill()
    }
  }
}

import {gameHeader} from '../../shared/ui'
import {BOTTLE_CAPACITY, BOTTLE_SESSION_LEVELS, bottleColors, type BottleMove, type BottleSortGame} from './bottles-game'

export function bottlesGameScreen(game: BottleSortGame, selected: number | null, lastMove: BottleMove | null, message = '') {
  const empty = game.bottles.filter((bottle) => !bottle.length).length
  return `
    ${gameHeader({title: 'Botol Warna', className: 'bottles-header'})}
    <main id="main-content" class="bottles-shell">
      <section class="bottles-game-panel" aria-labelledby="bottles-title">
        <aside class="bottles-game-copy">
          <p class="bottles-game-label">Puzzle warna</p>
          <h1 id="bottles-title">Pisahkan sampai rapi.</h1>
          <p class="bottles-objective">Pindahkan cairan sampai setiap botol hanya berisi satu warna.</p>
          <dl class="bottles-stats">
            <div><dt>Level</dt><dd>${game.level}/${BOTTLE_SESSION_LEVELS}</dd></div>
            <div><dt>Langkah</dt><dd>${game.moves}</dd></div>
            <div><dt>Kosong</dt><dd>${empty}</dd></div>
          </dl>
          <p class="bottles-message" role="status" aria-live="polite">${message || (selected === null ? 'Pilih botol sumber.' : 'Sekarang pilih botol tujuan.')}</p>
          <div class="bottles-actions">
            <button class="button button-secondary" data-undo-bottles type="button" ${game.canUndo ? '' : 'disabled'}>Undo</button>
            <button class="button button-secondary" data-restart-bottles-level type="button">Ulang level</button>
          </div>
          <p class="bottles-session-note">Progres tersimpan jika kamu sudah masuk.</p>
        </aside>
        <section class="bottles-play-area" aria-label="Area permainan Botol Warna">
          <div class="bottles-board" aria-label="Susunan ${game.bottles.length} botol">
            ${game.bottles.map((bottle, index) => bottleMarkup(bottle, index, selected, lastMove)).join('')}
          </div>
          <p class="bottles-hint">Ketuk botol, lalu ketuk tujuan. Cairan hanya menyatu dengan warna yang sama.</p>
          ${resultOverlay(game)}
        </section>
      </section>
    </main>`
}

function bottleMarkup(bottle: number[], index: number, selected: number | null, lastMove: BottleMove | null) {
  const layers = bottle.map((color, layer) => `<i class="bottle-liquid ${layer === bottle.length - 1 ? 'is-top' : ''}" style="--liquid:${bottleColors[color]};--layer:${layer}"></i>`).join('')
  const stateClass = selected === index ? 'is-selected' : lastMove?.from === index ? 'is-pouring' : lastMove?.to === index ? 'is-receiving' : ''
  const description = bottle.length ? `${bottle.length} dari ${BOTTLE_CAPACITY} lapisan` : 'kosong'
  return `<button class="bottle-button ${stateClass}" type="button" data-bottle-index="${index}" aria-label="Botol ${index + 1}, ${description}" aria-pressed="${selected === index}">
    <span class="bottle-rim" aria-hidden="true"></span>
    <span class="bottle-glass" aria-hidden="true">${layers}<b></b></span>
  </button>`
}

function resultOverlay(game: BottleSortGame) {
  if (game.status === 'playing') return ''
  const complete = game.status === 'complete'
  return `<div class="bottles-result" role="dialog" aria-modal="true" aria-labelledby="bottles-result-title">
    <p class="step-label">${complete ? 'Sesi selesai' : `Level ${game.level} rapi`}</p>
    <h2 id="bottles-result-title">${complete ? 'Semua warna beres.' : 'Tuangan tepat.'}</h2>
    <p>${complete ? `${game.totalMoves} langkah untuk menyelesaikan 10 level.` : `Selesai dalam ${game.moves} langkah.`}</p>
    <button class="button button-primary" ${complete ? 'data-restart-bottles' : 'data-next-bottles'} type="button">${complete ? 'Main lagi' : 'Level berikutnya'}</button>
  </div>`
}

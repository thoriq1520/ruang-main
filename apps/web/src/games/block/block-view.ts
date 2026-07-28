import {BLOCK_BOARD_SIZE, blockPieceSize, type BlockBlastGame, type BlockPiece} from './block-game'
import {gameHeader} from '../../shared/ui'

export function blockGameScreen(game: BlockBlastGame) {
  return `
    ${gameHeader({title: 'Blok Brak', className: 'block-header'})}
    <main id="main-content" class="block-shell">
      <section class="block-game-panel" aria-labelledby="block-title">
        <aside class="block-game-copy">
          <p class="block-game-label">Blok Brak</p>
          <h1 id="block-title">Isi. Hancurkan. Ulangi.</h1>
          <p class="block-objective">Susun tiga balok di papan. Baris atau kolom penuh akan langsung hilang.</p>
          <dl class="block-stats">
            <div><dt>Skor</dt><dd>${game.score.toLocaleString('id-ID')}</dd></div>
            <div><dt>Garis</dt><dd>${game.linesCleared}</dd></div>
            <div><dt>Combo</dt><dd data-block-combo>${game.combo ? `×${game.combo}` : '-'}</dd></div>
          </dl>
          <div class="block-rule"><strong>Cara bermain</strong><p>Tarik balok ke papan. Kamu juga bisa memilih balok lalu memilih petak. Permainan selesai saat tidak ada balok yang muat.</p></div>
          <button class="button button-secondary" data-restart-block type="button">Ulang game</button>
          <p class="block-session-note">Skor tersimpan jika kamu sudah masuk.</p>
        </aside>
        <section class="block-play-area" aria-label="Area permainan Blok Brak">
          <div class="block-board-wrap">
            <div class="block-board" id="block-board" role="grid" tabindex="0" aria-label="Papan Blok Brak 8 kali 8">${boardMarkup(game)}</div>
            <div class="block-promo" role="status" aria-live="polite" aria-atomic="true"></div>
            <div class="block-result" role="dialog" aria-modal="true" aria-labelledby="block-result-title" ${game.status === 'over' ? '' : 'hidden'}>
              <p class="step-label">Tidak ada ruang</p>
              <h2 id="block-result-title">Skor ${game.score.toLocaleString('id-ID')}</h2>
              <p>Papan sudah penuh untuk semua balok yang tersisa.</p>
              <button class="button button-primary" data-restart-block type="button">Main lagi</button>
            </div>
          </div>
          <div class="block-tray" aria-label="Tiga balok yang tersedia">${game.pieces.map((piece, index) => piece ? blockPieceMarkup(piece, index) : '<span class="block-piece-slot is-used" aria-hidden="true"></span>').join('')}</div>
          <p class="block-drag-hint">Tahan dan geser balok ke papan</p>
        </section>
      </section>
    </main>`
}

export function blockPieceMarkup(piece: BlockPiece, index: number) {
  const size = blockPieceSize(piece)
  const cells = Array.from({length: size.rows * size.columns}, (_, cellIndex) => {
    const row = Math.floor(cellIndex / size.columns)
    const column = cellIndex % size.columns
    const filled = piece.cells.some((cell) => cell.row === row && cell.column === column)
    return `<i class="block-piece-cell ${filled ? 'is-filled' : ''}" ${filled ? `style="--block-color:${piece.color}"` : ''}></i>`
  }).join('')
  return `<button class="block-piece" type="button" data-piece-index="${index}" aria-label="Balok ${index + 1}, ${piece.cells.length} petak" aria-pressed="false"><span style="--piece-rows:${size.rows};--piece-columns:${size.columns}">${cells}</span></button>`
}

function boardMarkup(game: BlockBlastGame) {
  return game.board.flatMap((row, rowIndex) => row.map((color, columnIndex) => `<span class="block-board-cell ${color ? 'is-filled' : ''}" role="gridcell" data-row="${rowIndex}" data-column="${columnIndex}" ${color ? `style="--block-color:${color}"` : ''} aria-label="Baris ${rowIndex + 1}, kolom ${columnIndex + 1}, ${color ? 'terisi' : 'kosong'}"></span>`)).join('')
}

export function centeredPlacement(piece: BlockPiece, row: number, column: number) {
  const size = blockPieceSize(piece)
  return {row: row - Math.floor(size.rows / 2), column: column - Math.floor(size.columns / 2)}
}

export {BLOCK_BOARD_SIZE}

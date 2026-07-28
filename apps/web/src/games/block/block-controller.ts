import {submitSoloRun} from '../../api/client'
import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {BlockBlastGame, blockPieceSize, type BlockPiece, type BlockPlacement} from './block-game'
import {BLOCK_BOARD_SIZE, blockGameScreen, centeredPlacement} from './block-view'

export function createBlockController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: BlockBlastGame | null = null
  let startedAt = 0
  let submitted = false
  let comboTimer: number | null = null

  const showMoveEffect = (move: BlockPlacement) => {
    if (!move.clearedCells.length) return
    const cells = [...root.querySelectorAll<HTMLElement>('.block-board-cell')]
    move.clearedCells.forEach((cleared, index) => {
      const cell = cells[cleared.row * BLOCK_BOARD_SIZE + cleared.column]
      cell?.classList.add('is-clearing')
      cell?.style.setProperty('--block-color', cleared.color)
      cell?.style.setProperty('--clear-order', String(index))
    })
    const promo = root.querySelector<HTMLElement>('.block-promo')
    if (promo && (move.perfect || move.combo > 1)) {
      promo.innerHTML = `<strong>+${move.points.toLocaleString('id-ID')}</strong>${move.perfect ? '<em>Perfect</em>' : `<span>Combo ×${move.combo}</span>`}`
      promo.classList.add('is-visible')
      window.setTimeout(() => promo.classList.remove('is-visible'), 1_000)
    }
    window.setTimeout(() => move.clearedCells.forEach((cleared) => {
      const cell = cells[cleared.row * BLOCK_BOARD_SIZE + cleared.column]
      cell?.classList.remove('is-clearing')
      cell?.style.removeProperty('--block-color')
      cell?.style.removeProperty('--clear-order')
    }), 650)
    if (comboTimer !== null) window.clearTimeout(comboTimer)
    comboTimer = window.setTimeout(() => {
      game?.expireCombo()
      const combo = root.querySelector<HTMLElement>('[data-block-combo]')
      if (combo) combo.textContent = game?.combo ? `×${game.combo}` : '-'
      comboTimer = null
    }, 3_000)
  }

  const render = (move?: BlockPlacement) => {
    if (!game) return start()
    updateDocumentMeta('Main Block Blast Gratis | Ruang Main', 'Main Block Blast gratis langsung dari browser. Susun balok warna-warni, bersihkan baris dan kolom, lalu kejar skor tertinggi.', '/game/block-blast')
    root.innerHTML = blockGameScreen(game)
    bindLeaveButtons()
    bindInteraction()
    if (move) showMoveEffect(move)
    root.querySelectorAll('[data-restart-block]').forEach((button) => button.addEventListener('click', start))
    if (game.status === 'over' && !submitted) {
      submitted = true
      void submitSoloRun({gameId: 'block-blast', result: 'lost', score: game.score, linesCleared: game.linesCleared, durationMs: Math.round(performance.now() - startedAt)})
    }
  }

  const bindInteraction = () => {
    if (!game) return
    const board = root.querySelector<HTMLElement>('#block-board')!
    const boardCells = [...board.querySelectorAll<HTMLElement>('.block-board-cell')]
    const pieceButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-piece-index]')]
    let selectedIndex: number | null = null
    let preview: {row: number; column: number; valid: boolean} | null = null
    let ghost: HTMLElement | null = null
    let dragPointerId: number | null = null
    let dragStart: {x: number; y: number} | null = null

    const clearPreview = () => {
      for (const cell of boardCells) {
        cell.classList.remove('is-preview')
        cell.style.removeProperty('--preview-color')
      }
      preview = null
    }
    const selectPiece = (index: number) => {
      clearPreview()
      selectedIndex = index
      pieceButtons.forEach((button) => {
        const active = Number(button.dataset.pieceIndex) === index
        button.classList.toggle('is-selected', active)
        button.setAttribute('aria-pressed', String(active))
      })
    }
    const showPreview = (pieceIndex: number, row: number, column: number) => {
      clearPreview()
      const piece = game?.pieces[pieceIndex]
      if (!game || !piece) return
      const valid = game.canPlace(pieceIndex, row, column)
      preview = {row, column, valid}
      if (!valid) return
      for (const pieceCell of piece.cells) {
        const targetRow = row + pieceCell.row
        const targetColumn = column + pieceCell.column
        if (targetRow < 0 || targetRow >= BLOCK_BOARD_SIZE || targetColumn < 0 || targetColumn >= BLOCK_BOARD_SIZE) continue
        const cell = boardCells[targetRow * BLOCK_BOARD_SIZE + targetColumn]
        cell.classList.add('is-preview')
        cell.style.setProperty('--preview-color', piece.color)
      }
    }
    const boardMetrics = () => {
      const firstCell = boardCells[0].getBoundingClientRect()
      const style = getComputedStyle(board)
      const gap = Number.parseFloat(style.columnGap) || 0
      return {cell: firstCell.width, gap, step: firstCell.width + gap, left: firstCell.left, top: firstCell.top}
    }
    const placementFromPointer = (piece: BlockPiece, clientX: number, clientY: number) => {
      const boardPosition = boardMetrics()
      const size = blockPieceSize(piece)
      const pieceWidth = size.columns * boardPosition.cell + (size.columns - 1) * boardPosition.gap
      const pieceHeight = size.rows * boardPosition.cell + (size.rows - 1) * boardPosition.gap
      return {
        row: Math.round((clientY - boardPosition.top - pieceHeight / 2) / boardPosition.step),
        column: Math.round((clientX - boardPosition.left - pieceWidth / 2) / boardPosition.step),
      }
    }
    const moveGhost = (clientX: number, clientY: number, lift: number) => {
      if (!ghost) return
      ghost.style.left = `${clientX}px`
      ghost.style.top = `${clientY - lift}px`
    }
    const finishDrag = (button: HTMLButtonElement, event: PointerEvent, place: boolean) => {
      if (event.pointerId !== dragPointerId) return
      dragPointerId = null
      dragStart = null
      const wasDragging = Boolean(ghost)
      ghost?.remove()
      ghost = null
      button.classList.remove('is-dragging')
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
      const target = preview
      clearPreview()
      if (place && wasDragging && target?.valid) {
        const move = game?.place(Number(button.dataset.pieceIndex), target.row, target.column)
        if (move) render(move)
      }
    }

    pieceButtons.forEach((button) => {
      const pieceIndex = Number(button.dataset.pieceIndex)
      button.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0 || dragPointerId !== null || !game?.pieces[pieceIndex]) return
        event.preventDefault()
        dragPointerId = event.pointerId
        dragStart = {x: event.clientX, y: event.clientY}
        selectPiece(pieceIndex)
        button.setPointerCapture(event.pointerId)
      })
      button.addEventListener('pointermove', (event) => {
        if (event.pointerId !== dragPointerId || !button.hasPointerCapture(event.pointerId) || !game) return
        event.preventDefault()
        if (!ghost && dragStart && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) < 6) return
        if (!ghost) {
          button.classList.add('is-dragging')
          ghost = button.querySelector('span')!.cloneNode(true) as HTMLElement
          ghost.classList.add('block-drag-ghost')
          const {cell, gap} = boardMetrics()
          ghost.style.setProperty('--drag-cell-size', `${cell}px`)
          ghost.style.setProperty('--drag-cell-gap', `${gap}px`)
          document.body.append(ghost)
        }
        const piece = game.pieces[pieceIndex]!
        const lift = event.pointerType === 'touch' ? Math.max(64, ghost.offsetHeight / 2 + 28) : 0
        moveGhost(event.clientX, event.clientY, lift)
        const target = placementFromPointer(piece, event.clientX, event.clientY - lift)
        showPreview(pieceIndex, target.row, target.column)
      })
      button.addEventListener('pointerup', (event) => finishDrag(button, event, true))
      button.addEventListener('pointercancel', (event) => finishDrag(button, event, false))
      button.addEventListener('click', () => selectPiece(pieceIndex))
    })

    board.addEventListener('click', (event) => {
      if (selectedIndex === null || !game) return
      const cell = (event.target as HTMLElement).closest<HTMLElement>('.block-board-cell')
      const piece = game.pieces[selectedIndex]
      if (!cell || !piece) return
      const target = centeredPlacement(piece, Number(cell.dataset.row), Number(cell.dataset.column))
      const move = game.place(selectedIndex, target.row, target.column)
      if (move) render(move)
      else showPreview(selectedIndex, target.row, target.column)
    })
    board.addEventListener('keydown', (event) => {
      if (selectedIndex === null || !game?.pieces[selectedIndex]) return
      const current = preview ?? {row: 3, column: 3, valid: false}
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        showPreview(selectedIndex, current.row + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0), current.column + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0))
      } else if ((event.key === 'Enter' || event.key === ' ') && preview?.valid) {
        event.preventDefault()
        const move = game.place(selectedIndex, preview.row, preview.column)
        if (move) render(move)
      }
    })
  }

  const start = () => {
    if (comboTimer !== null) window.clearTimeout(comboTimer)
    comboTimer = null
    game = new BlockBlastGame()
    startedAt = performance.now()
    submitted = false
    render()
  }

  return {
    get active() { return game !== null },
    start,
    render,
    reset() {
      if (comboTimer !== null) window.clearTimeout(comboTimer)
      comboTimer = null
      game = null
      submitted = false
    },
  }
}

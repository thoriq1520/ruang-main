import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {createArrowGame, hintArrow, isArrowFree, releaseArrow, type ArrowGameState} from './arrow-game'
import {arrowGameScreen} from './arrow-view'
import {submitSoloRun} from '../../api/client'

export function createArrowController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: ArrowGameState | null = null
  let startedAt = 0
  let submitted = false

  const startLevel = (level = 1) => {
    game = createArrowGame(level)
    startedAt = performance.now()
    submitted = false
  }

  const submitResult = (state: ArrowGameState) => {
    if (submitted || state.status === 'playing') return
    submitted = true
    void submitSoloRun({gameId: 'arrow-puzzle', result: state.status, level: state.level, moves: state.moves, mistakes: state.mistakes, durationMs: Math.round(performance.now() - startedAt)})
  }

  const render = () => {
    if (!game) return start()
    updateDocumentMeta('Main Arrow Puzzle Gratis | Ruang Main', 'Main Arrow Puzzle gratis langsung dari browser. Masuk secara opsional untuk mencatat hasil dan peringkat.', '/game/arrow-puzzle')
    root.innerHTML = arrowGameScreen(game)
    bindLeaveButtons()

    let moving = false
    const activateArrow = (piece: SVGGElement) => {
      const id = piece.dataset.arrowId!
      if (moving || !game) return
      const boardElement = root.querySelector('.arrow-board')
      moving = true
      boardElement?.classList.add('is-busy')
      root.querySelectorAll<SVGGElement>('[data-arrow-id]').forEach((arrowPiece) => arrowPiece.setAttribute('aria-disabled', 'true'))

      if (!isArrowFree(game, id)) {
        piece.classList.add('is-blocked')
        boardElement?.classList.add('is-wrong')
        piece.querySelector<SVGAnimateTransformElement>('.arrow-blocked-motion')?.beginElement()
      } else {
        piece.classList.add('is-releasing')
        piece.querySelectorAll<SVGAnimationElement>('.arrow-safe-motion').forEach((animation) => animation.beginElement())
      }

      window.setTimeout(() => {
        if (!game) return
        game = releaseArrow(game, id)
        submitResult(game)
        render()
      }, reducedMotion() ? 0 : 500)
    }

    root.querySelectorAll<SVGGElement>('[data-arrow-id]').forEach((piece) => {
      piece.addEventListener('click', () => activateArrow(piece))
      piece.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        activateArrow(piece)
      })
    })
    root.querySelector('#hint-arrow')?.addEventListener('click', () => {
      if (!game) return
      game = hintArrow(game)
      render()
    })
    root.querySelectorAll('[data-restart-arrow]').forEach((button) => button.addEventListener('click', () => {
      if (!game) return
      startLevel(game.level)
      render()
    }))
    root.querySelector('#next-arrow-level')?.addEventListener('click', () => {
      if (!game) return
      startLevel(game.level + 1)
      render()
    })
  }

  const start = () => {
    startLevel()
    render()
  }

  return {
    get active() { return game !== null },
    start,
    render,
    reset() { game = null; submitted = false },
  }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

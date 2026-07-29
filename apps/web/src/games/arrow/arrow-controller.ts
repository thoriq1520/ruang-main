import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {createArrowGame, hintArrow, isArrowFree, releaseArrow, restoreArrowGame, saveArrowGame, type ArrowGameState} from './arrow-game'
import {arrowGameScreen} from './arrow-view'
import {archiveSoloGame, saveSoloGame, submitSoloRun} from '../../api/client'
import {prepareSoloStart, soloSaveLoadingScreen} from '../../shared/solo-save'

export function createArrowController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: ArrowGameState | null = null
  let startedAt = 0
  let submitted = false
  let authenticated = false
  let startToken = 0

  const startLevel = (level = 1, resetTimer = true) => {
    game = createArrowGame(level)
    if (resetTimer) startedAt = performance.now()
    submitted = false
  }

  const persist = () => {
    if (authenticated && game?.status === 'playing') void saveSoloGame('arrow-puzzle', saveArrowGame(game, performance.now() - startedAt))
  }

  const submitResult = (state: ArrowGameState) => {
    if (submitted || state.status !== 'lost') return
    submitted = true
    if (authenticated) void archiveSoloGame('arrow-puzzle')
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
        persist()
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
      persist()
      render()
    })
    root.querySelectorAll('[data-restart-arrow]').forEach((button) => button.addEventListener('click', () => {
      if (!game) return
      void startFresh(game.level)
    }))
    root.querySelector('#next-arrow-level')?.addEventListener('click', () => {
      if (!game) return
      startLevel(game.level + 1, false)
      persist()
      render()
    })
  }

  const startFresh = async (level: number) => {
    if (authenticated) await archiveSoloGame('arrow-puzzle').catch(() => false)
    startLevel(level)
    persist()
    render()
  }

  const start = () => {
    const token = ++startToken
    root.innerHTML = soloSaveLoadingScreen('Arrow Puzzle')
    void prepareSoloStart('arrow-puzzle', 'Arrow Puzzle').then(async (prepared) => {
      if (token !== startToken) return
      authenticated = prepared.authenticated
      const restored = prepared.state ? restoreArrowGame(prepared.state) : null
      if (prepared.state && !restored && authenticated) await archiveSoloGame('arrow-puzzle').catch(() => false)
      if (token !== startToken) return
      if (restored) {
        game = restored.game
        startedAt = performance.now() - restored.elapsedMs
        submitted = false
      } else startLevel()
      persist()
      render()
    })
  }

  return {
    get active() { return game !== null },
    start,
    render,
    reset() { startToken += 1; game = null; submitted = false; authenticated = false },
  }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

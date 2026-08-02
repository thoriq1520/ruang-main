import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {FRUIT_BOARD_WIDTH, FruitMergeGame, fruitSpecs} from './fruit-game'
import {drawFruitBoard, drawFruitPreview, fruitGameScreen} from './fruit-view'
import {archiveSoloGame, saveSoloGame} from '../../api/client'
import {prepareSoloStart, soloSaveLoadingScreen} from '../../shared/solo-save'
import {finishSoloRun} from '../../shared/solo-result'

export function createFruitController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: FruitMergeGame | null = null
  let stopLoop: (() => void) | null = null
  let startedAt = 0
  let submitted = false
  let authenticated = false
  let startToken = 0
  let lastAutosaveAt = 0
  let dirtyUntil = 0

  const newGame = () => {
    game = new FruitMergeGame()
    startedAt = performance.now()
    submitted = false
    dirtyUntil = performance.now() + 1_500
  }

  const persist = () => {
    if (!authenticated || !game || game.status !== 'playing') return
    lastAutosaveAt = performance.now()
    void saveSoloGame('fruit-merge', game.toSave(lastAutosaveAt - startedAt))
  }

  const stop = () => {
    stopLoop?.()
    stopLoop = null
  }

  const render = () => {
    if (!game) return start()
    stop()
    updateDocumentMeta('Main Fruit Merge Gratis | Ruang Main', 'Main Fruit Merge gratis langsung dari browser. Masuk secara opsional untuk mencatat skor dan peringkat.', '/game/fruit-merge')
    root.innerHTML = fruitGameScreen(game)
    bindLeaveButtons()

    const canvas = root.querySelector<HTMLCanvasElement>('#fruit-canvas')!
    const context = canvas.getContext('2d')!
    const preview = root.querySelector<HTMLCanvasElement>('#fruit-preview')!
    const previewContext = preview.getContext('2d')!
    const score = root.querySelector<HTMLElement>('#fruit-score')!
    const largest = root.querySelector<HTMLElement>('#fruit-largest')!
    const dropButton = root.querySelector<HTMLButtonElement>('#drop-fruit')!
    const result = root.querySelector<HTMLElement>('#fruit-result')!
    const finalScore = root.querySelector<HTMLElement>('#fruit-final-score')!
    const boardWrap = root.querySelector<HTMLElement>('.fruit-board-wrap')!
    let previousTime = performance.now()
    let frame = 0
    let lastScore = -1
    let lastLargest = -1
    let lastStatus = ''

    const dropCurrentFruit = () => {
      if (game?.drop()) {
        dirtyUntil = performance.now() + 2_500
        persist()
      }
      canvas.focus({preventScroll: true})
    }
    const setAimFromPointer = (clientX: number) => {
      if (!game) return
      const rectangle = canvas.getBoundingClientRect()
      game.setAim((clientX - rectangle.left) / rectangle.width * FRUIT_BOARD_WIDTH)
    }

    let dragPointerId: number | null = null
    canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || dragPointerId !== null) return
      event.preventDefault()
      dragPointerId = event.pointerId
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('is-dragging')
      setAimFromPointer(event.clientX)
    })
    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== dragPointerId) return
      event.preventDefault()
      setAimFromPointer(event.clientX)
    })
    canvas.addEventListener('pointerup', (event) => {
      if (event.pointerId !== dragPointerId) return
      event.preventDefault()
      setAimFromPointer(event.clientX)
      dragPointerId = null
      canvas.classList.remove('is-dragging')
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      dropCurrentFruit()
    })
    canvas.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== dragPointerId) return
      dragPointerId = null
      canvas.classList.remove('is-dragging')
    })
    canvas.addEventListener('keydown', (event) => {
      if (!game) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        game.setAim(game.aimX + (event.key === 'ArrowLeft' ? -24 : 24))
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        dropCurrentFruit()
      }
    })
    dropButton.addEventListener('click', dropCurrentFruit)
    root.querySelectorAll('[data-restart-fruit]').forEach((button) => button.addEventListener('click', () => {
      void startFresh()
    }))

    const animate = (time: number) => {
      if (!game) return
      game.update((time - previousTime) / 1000)
      previousTime = time
      drawFruitBoard(context, game)
      drawFruitPreview(previewContext, game.nextKinds)
      if (game.score !== lastScore) {
        score.textContent = String(game.score)
        finalScore.textContent = String(game.score)
        lastScore = game.score
        dirtyUntil = time + 2_500
      }
      if (game.largestKind !== lastLargest) {
        largest.textContent = fruitSpecs[game.largestKind].name
        lastLargest = game.largestKind
      }
      if (game.status !== lastStatus) {
        result.hidden = game.status !== 'over'
        if (game.status === 'over' && !submitted) {
          submitted = true
          if (authenticated) void archiveSoloGame('fruit-merge')
          void finishSoloRun({gameId: 'fruit-merge', result: 'lost', score: game.score, largestKind: game.largestKind, durationMs: Math.round(performance.now() - startedAt)}, authenticated)
        }
        lastStatus = game.status
      }
      dropButton.disabled = game.status !== 'playing' || game.dropCooldown > 0
      boardWrap.classList.toggle('is-danger', game.dangerProgress > .35)
      if (authenticated && time <= dirtyUntil && time - lastAutosaveAt >= 700) persist()
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    stopLoop = () => cancelAnimationFrame(frame)
  }

  const startFresh = async () => {
    if (authenticated) await archiveSoloGame('fruit-merge').catch(() => false)
    stop()
    newGame()
    persist()
    render()
  }

  const start = () => {
    const token = ++startToken
    stop()
    root.innerHTML = soloSaveLoadingScreen('Fruit Merge')
    void prepareSoloStart('fruit-merge', 'Fruit Merge').then(async (prepared) => {
      if (token !== startToken) return
      authenticated = prepared.authenticated
      const restored = prepared.state ? FruitMergeGame.fromSave(prepared.state) : null
      if (prepared.state && !restored && authenticated) await archiveSoloGame('fruit-merge').catch(() => false)
      if (token !== startToken) return
      if (restored) {
        game = restored.game
        startedAt = performance.now() - restored.elapsedMs
        submitted = false
        dirtyUntil = performance.now() + 1_500
      } else newGame()
      persist()
      render()
    })
  }

  return {
    get active() { return game !== null },
    snapshot: () => game ? game.toSave(performance.now() - startedAt) : null,
    start,
    render,
    reset() {
      stop()
      startToken += 1
      game = null
      submitted = false
      authenticated = false
    },
  }
}

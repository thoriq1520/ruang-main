import {archiveSoloGame, saveSoloGame, submitSoloRun} from '../../api/client'
import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {prepareSoloStart, soloSaveLoadingScreen} from '../../shared/solo-save'
import {BOTTLE_SESSION_LEVELS, BottleSortGame, type BottleMove} from './bottles-game'
import {bottlesGameScreen} from './bottles-view'

export function createBottlesController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: BottleSortGame | null = null
  let selected: number | null = null
  let lastMove: BottleMove | null = null
  let message = ''
  let startedAt = 0
  let submitted = false
  let authenticated = false
  let startToken = 0

  const persist = () => {
    const current = game
    if (authenticated && current && current.status !== 'complete') void saveSoloGame('magic-bottles', current.toSave(performance.now() - startedAt))
  }

  const render = () => {
    if (!game) return start()
    updateDocumentMeta('Main Botol Warna Gratis | Ruang Main', 'Main puzzle Botol Warna gratis di browser. Tuang lapisan cairan sampai setiap botol berisi satu warna.', '/game/botol-warna')
    root.innerHTML = bottlesGameScreen(game, selected, lastMove, message)
    bindLeaveButtons()
    root.querySelectorAll<HTMLButtonElement>('[data-bottle-index]').forEach((button) => button.addEventListener('click', () => chooseBottle(Number(button.dataset.bottleIndex))))
    root.querySelector('[data-undo-bottles]')?.addEventListener('click', () => {
      if (!game?.undo()) return
      selected = null
      lastMove = null
      message = 'Langkah terakhir dibatalkan.'
      persist()
      render()
    })
    root.querySelector('[data-restart-bottles-level]')?.addEventListener('click', () => {
      game?.restartLevel()
      selected = null
      lastMove = null
      message = 'Level diulang dari susunan awal.'
      persist()
      render()
    })
    root.querySelector('[data-next-bottles]')?.addEventListener('click', () => {
      if (!game?.nextLevel()) return
      selected = null
      lastMove = null
      message = ''
      persist()
      render()
    })
    root.querySelector('[data-restart-bottles]')?.addEventListener('click', () => void startFresh())

    if (game.status === 'complete' && !submitted) {
      submitted = true
      if (authenticated) void archiveSoloGame('magic-bottles')
      void submitSoloRun({gameId: 'magic-bottles', result: 'won', level: BOTTLE_SESSION_LEVELS, moves: game.totalMoves, durationMs: Math.round(performance.now() - startedAt)})
    }
  }

  const chooseBottle = (index: number) => {
    if (!game || game.status !== 'playing') return
    if (selected === null) {
      if (!game.bottles[index].length) {
        message = 'Botol kosong tidak dapat menjadi sumber.'
        render()
        return
      }
      selected = index
      message = ''
      render()
      return
    }
    if (selected === index) {
      selected = null
      message = ''
      render()
      return
    }
    const move = game.pour(selected, index)
    if (!move) {
      message = 'Tujuan harus kosong atau memiliki warna teratas yang sama.'
      navigator.vibrate?.(20)
      selected = null
      lastMove = null
      render()
      return
    }
    selected = null
    lastMove = move
    message = game.status === 'playing' ? `${move.amount} lapisan dipindahkan.` : ''
    navigator.vibrate?.(10)
    persist()
    render()
  }

  const startFresh = async () => {
    if (authenticated) await archiveSoloGame('magic-bottles').catch(() => false)
    game = new BottleSortGame()
    selected = null
    lastMove = null
    message = ''
    startedAt = performance.now()
    submitted = false
    persist()
    render()
  }

  const start = () => {
    const token = ++startToken
    root.innerHTML = soloSaveLoadingScreen('Botol Warna')
    void prepareSoloStart('magic-bottles', 'Botol Warna').then(async (prepared) => {
      if (token !== startToken) return
      authenticated = prepared.authenticated
      const restored = prepared.state ? BottleSortGame.fromSave(prepared.state) : null
      if (prepared.state && !restored && authenticated) await archiveSoloGame('magic-bottles').catch(() => false)
      if (token !== startToken) return
      game = restored?.game ?? new BottleSortGame()
      startedAt = performance.now() - (restored?.elapsedMs ?? 0)
      selected = null
      lastMove = null
      message = ''
      submitted = false
      persist()
      render()
    })
  }

  return {
    get active() { return game !== null },
    start,
    render,
    reset() {
      startToken += 1
      game = null
      selected = null
      lastMove = null
      submitted = false
      authenticated = false
    },
  }
}

import {archiveSoloGame, saveSoloGame, submitSoloRun} from '../../api/client'
import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {prepareSoloStart, soloSaveLoadingScreen} from '../../shared/solo-save'
import {BOTTLE_SESSION_LEVELS, BottleSortGame, pourBottle, type BottleMove} from './bottles-game'
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
  let animating = false

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

  const chooseBottle = async (index: number) => {
    if (!game || game.status !== 'playing' || animating) return
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
    const from = selected
    const preview = game.bottles.map((bottle) => [...bottle])
    if (!pourBottle(preview, from, index)) {
      message = 'Tujuan harus kosong atau memiliki warna teratas yang sama.'
      navigator.vibrate?.(20)
      selected = null
      lastMove = null
      render()
      return
    }
    const currentGame = game
    animating = true
    await animateBottlePour(root, from, index)
    animating = false
    if (game !== currentGame || game.status !== 'playing') return
    const move = game.pour(from, index)
    if (!move) return
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
      animating = false
    },
  }
}

async function animateBottlePour(root: HTMLElement, from: number, to: number) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const source = root.querySelector<HTMLElement>(`[data-bottle-index="${from}"]`)
  const target = root.querySelector<HTMLElement>(`[data-bottle-index="${to}"]`)
  if (!source || !target || typeof source.animate !== 'function') return

  const sourceBox = source.getBoundingClientRect()
  const targetBox = target.getBoundingClientRect()
  const x = targetBox.left + targetBox.width / 2 - sourceBox.left - sourceBox.width / 2
  const y = targetBox.top - sourceBox.top - 42
  const direction = x >= 0 ? 1 : -1
  const hovering = `translate3d(${x}px, ${y}px, 0) rotate(0deg)`
  const tilted = `translate3d(${x}px, ${y}px, 0) rotate(${direction * 68}deg)`

  source.style.zIndex = '5'
  source.style.pointerEvents = 'none'
  source.style.transformOrigin = '50% 8%'
  const sourceMotion = source.animate([
    {transform: 'translate3d(0, -16px, 0) rotate(0deg)', offset: 0},
    {transform: hovering, offset: .34},
    {transform: tilted, offset: .5},
    {transform: tilted, offset: .68},
    {transform: hovering, offset: .8},
    {transform: 'translate3d(0, -16px, 0) rotate(0deg)', offset: 1},
  ], {duration: 820, easing: 'cubic-bezier(.22,.61,.36,1)'})
  const targetMotion = target.animate([
    {transform: 'scale(1)'},
    {transform: 'scale(1.045)', offset: .55},
    {transform: 'scale(1)'},
  ], {duration: 420, delay: 330, easing: 'cubic-bezier(.16,1,.3,1)'})

  await Promise.allSettled([sourceMotion.finished, targetMotion.finished])
  source.style.removeProperty('z-index')
  source.style.removeProperty('pointer-events')
  source.style.removeProperty('transform-origin')
}

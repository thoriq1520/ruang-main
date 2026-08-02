import type {SoloRoomGameId} from '../network/network'
import {restoreArrowGame} from './arrow/arrow-game'
import {arrowGameScreen} from './arrow/arrow-view'
import {FruitMergeGame, fruitSpecs} from './fruit/fruit-game'
import {drawFruitBoard, fruitGameScreen} from './fruit/fruit-view'
import {BlockBlastGame} from './block/block-game'
import {blockGameScreen} from './block/block-view'
import {FruitSliceGame} from './slice/slice-game'
import {drawSliceBoard, fruitSliceScreen} from './slice/slice-view'
import {BottleSortGame} from './bottles/bottles-game'
import {bottlesGameScreen} from './bottles/bottles-view'

export function renderSoloSpectator(root: HTMLElement, gameId: SoloRoomGameId, state: unknown) {
  const source = document.createElement('div')
  let selector = ''
  let summary = 'Sedang bermain'

  if (gameId === 'arrow-puzzle') {
    const restored = restoreArrowGame(state)
    if (!restored) return waiting(root)
    source.innerHTML = arrowGameScreen(restored.game)
    selector = '.arrow-board-wrap'
    summary = `Level ${restored.game.level} · ${restored.game.arrows.length} tersisa`
  } else if (gameId === 'fruit-merge') {
    const restored = FruitMergeGame.fromSave(state)
    if (!restored) return waiting(root)
    source.innerHTML = fruitGameScreen(restored.game)
    selector = '.fruit-board-wrap'
    summary = `${restored.game.score} poin · ${fruitSpecs[restored.game.largestKind].name}`
    mount(root, source, selector, summary)
    const context = root.querySelector<HTMLCanvasElement>('.fruit-canvas')?.getContext('2d')
    if (context) drawFruitBoard(context, restored.game)
    return
  } else if (gameId === 'block-blast') {
    const restored = BlockBlastGame.fromSave(state)
    if (!restored) return waiting(root)
    source.innerHTML = blockGameScreen(restored.game)
    selector = '.block-play-area'
    summary = `${restored.game.score.toLocaleString('id-ID')} poin · ${restored.game.linesCleared} garis`
  } else if (gameId === 'fruit-slice') {
    const restored = FruitSliceGame.fromSave(state)
    if (!restored) return waiting(root)
    source.innerHTML = fruitSliceScreen(restored.game)
    selector = '.slice-play-area'
    summary = `${restored.game.score} poin · ${restored.game.lives} nyawa`
    mount(root, source, selector, summary)
    const context = root.querySelector<HTMLCanvasElement>('.slice-canvas')?.getContext('2d')
    if (context) drawSliceBoard(context, restored.game, [], [])
    return
  } else {
    const restored = BottleSortGame.fromSave(state)
    if (!restored) return waiting(root)
    source.innerHTML = bottlesGameScreen(restored.game, null, null)
    selector = '.bottles-play-area'
    summary = `Level ${restored.game.level} · ${restored.game.totalMoves + restored.game.moves} langkah`
  }

  mount(root, source, selector, summary)
}

function mount(root: HTMLElement, source: HTMLElement, selector: string, summary: string) {
  const board = source.querySelector<HTMLElement>(selector)
  if (!board) return waiting(root)
  board.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
  board.querySelectorAll<HTMLElement>('button, [tabindex]').forEach((element) => {
    element.removeAttribute('tabindex')
    element.setAttribute('aria-disabled', 'true')
  })
  root.replaceChildren(board)
  root.dataset.summary = summary
}

function waiting(root: HTMLElement) {
  root.innerHTML = '<div class="solo-peer-waiting"><span></span><p>Menunggu papan…</p></div>'
  root.dataset.summary = 'Menunggu snapshot'
}

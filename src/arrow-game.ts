export type ArrowDirection = 'up' | 'right' | 'down' | 'left'
export type ArrowStatus = 'playing' | 'won' | 'lost'

export type ArrowPiece = {
  id: string
  row: number
  column: number
  direction: ArrowDirection
}

export type ArrowGameState = {
  level: number
  size: number
  lives: number
  maxLives: number
  moves: number
  mistakes: number
  status: ArrowStatus
  arrows: ArrowPiece[]
  hintId: string | null
  lastAction: {id: string; result: 'released' | 'blocked'} | null
}

const vectors: Record<ArrowDirection, readonly [number, number]> = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1],
}

const directions = Object.keys(vectors) as ArrowDirection[]

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function cellKey(row: number, column: number) {
  return `${row}:${column}`
}

function pathIsClear(arrows: ArrowPiece[], size: number, row: number, column: number, direction: ArrowDirection) {
  const occupied = new Set(arrows.map((arrow) => cellKey(arrow.row, arrow.column)))
  const [rowStep, columnStep] = vectors[direction]
  let nextRow = row + rowStep
  let nextColumn = column + columnStep
  while (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) {
    if (occupied.has(cellKey(nextRow, nextColumn))) return false
    nextRow += rowStep
    nextColumn += columnStep
  }
  return true
}

function generateArrows(level: number, size: number) {
  const random = seededRandom(level * 7919 + 17)
  const target = Math.min(size * size - 4, 7 + level * 2)
  const arrows: ArrowPiece[] = []

  while (arrows.length < target) {
    const occupied = new Set(arrows.map((arrow) => cellKey(arrow.row, arrow.column)))
    const candidates: Omit<ArrowPiece, 'id'>[] = []
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (occupied.has(cellKey(row, column))) continue
        for (const direction of directions) {
          if (pathIsClear(arrows, size, row, column, direction)) candidates.push({row, column, direction})
        }
      }
    }
    if (!candidates.length) break
    const candidate = candidates[Math.floor(random() * candidates.length)]
    arrows.push({...candidate, id: `arrow-${level}-${arrows.length}`})
  }

  return arrows
}

export function createArrowGame(level = 1): ArrowGameState {
  const safeLevel = Math.max(1, Math.floor(level))
  const size = Math.min(7, 4 + Math.floor((safeLevel - 1) / 3))
  return {
    level: safeLevel,
    size,
    lives: 3,
    maxLives: 3,
    moves: 0,
    mistakes: 0,
    status: 'playing',
    arrows: generateArrows(safeLevel, size),
    hintId: null,
    lastAction: null,
  }
}

export function isArrowFree(state: ArrowGameState, id: string) {
  const arrow = state.arrows.find((piece) => piece.id === id)
  return Boolean(arrow && pathIsClear(state.arrows.filter((piece) => piece.id !== id), state.size, arrow.row, arrow.column, arrow.direction))
}

export function releaseArrow(state: ArrowGameState, id: string): ArrowGameState {
  if (state.status !== 'playing' || !state.arrows.some((arrow) => arrow.id === id)) return state
  if (!isArrowFree(state, id)) {
    const lives = Math.max(0, state.lives - 1)
    return {...state, lives, moves: state.moves + 1, mistakes: state.mistakes + 1, status: lives ? 'playing' : 'lost', hintId: null, lastAction: {id, result: 'blocked'}}
  }

  const arrows = state.arrows.filter((arrow) => arrow.id !== id)
  return {...state, arrows, moves: state.moves + 1, status: arrows.length ? 'playing' : 'won', hintId: null, lastAction: {id, result: 'released'}}
}

export function hintArrow(state: ArrowGameState): ArrowGameState {
  if (state.status !== 'playing') return state
  const arrow = state.arrows.find((piece) => isArrowFree(state, piece.id))
  return arrow ? {...state, hintId: arrow.id, lastAction: null} : state
}

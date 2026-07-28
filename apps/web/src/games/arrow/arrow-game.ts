export type ArrowDirection = 'up' | 'right' | 'down' | 'left'
export type ArrowStatus = 'playing' | 'won' | 'lost'

export type ArrowPoint = {
  row: number
  column: number
}

export type ArrowPiece = {
  id: string
  points: ArrowPoint[]
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

function cellKey(point: ArrowPoint) {
  return `${point.row}:${point.column}`
}

function insideBoard(point: ArrowPoint, size: number) {
  return point.row >= 0 && point.row < size && point.column >= 0 && point.column < size
}

function directionBetween(from: ArrowPoint, to: ArrowPoint): ArrowDirection {
  if (to.row < from.row) return 'up'
  if (to.row > from.row) return 'down'
  if (to.column < from.column) return 'left'
  return 'right'
}

function headPathClears(occupied: Set<string>, size: number, arrow: ArrowPiece) {
  const head = arrow.points.at(-1)!
  const [rowStep, columnStep] = vectors[arrow.direction]
  let next = {row: head.row + rowStep, column: head.column + columnStep}
  while (insideBoard(next, size)) {
    if (occupied.has(cellKey(next))) return false
    next = {row: next.row + rowStep, column: next.column + columnStep}
  }
  return true
}

function headPathIsClear(arrows: ArrowPiece[], size: number, arrow: ArrowPiece) {
  return headPathClears(new Set(arrows.flatMap((piece) => piece.points.map(cellKey))), size, arrow)
}

function patternCells(size: number, level: number) {
  const middle = (size - 1) / 2
  const cells: ArrowPoint[] = []
  const pattern = (level - 1) % 4

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const x = (column - middle) / middle
      const y = (middle - row) / middle
      const heart = (x * x + y * y - .72) ** 3 - x * x * y * y * y <= 0
      const included = pattern === 0 ? Math.abs(x) <= .84 && Math.abs(y) <= .84
        : pattern === 1 ? Math.abs(y) <= .72
          : pattern === 2 ? Math.abs(x) + Math.abs(y) <= 1.35
            : heart
      if (included) cells.push({row, column})
    }
  }
  return cells
}

function makeBentPath(size: number, occupied: Set<string>, allowed: Set<string>, allowedCells: ArrowPoint[], maxPoints: number, random: () => number) {
  const points: ArrowPoint[] = [allowedCells[Math.floor(random() * allowedCells.length)]]
  if (occupied.has(cellKey(points[0]))) return null

  const target = 6 + Math.floor(random() * Math.max(1, maxPoints - 5))
  let previousDirection: ArrowDirection | null = null
  let turns = 0

  while (points.length < target) {
    const current = points.at(-1)!
    const used = new Set(points.map(cellKey))
    const options: {direction: ArrowDirection; point: ArrowPoint}[] = directions
      .map((direction) => {
        const [rowStep, columnStep] = vectors[direction]
        return {direction, point: {row: current.row + rowStep, column: current.column + columnStep}}
      })
      .filter(({point}) => insideBoard(point, size) && allowed.has(cellKey(point)) && !occupied.has(cellKey(point)) && !used.has(cellKey(point)))

    if (!options.length) return null
    const straight = options.filter(({direction}) => direction === previousDirection)
    const turning = options.filter(({direction}) => direction !== previousDirection)
    const pool: {direction: ArrowDirection; point: ArrowPoint}[] = previousDirection && straight.length && random() < .62
      ? straight
      : turning.length ? turning : options
    const choice: {direction: ArrowDirection; point: ArrowPoint} = pool[Math.floor(random() * pool.length)]
    if (previousDirection && choice.direction !== previousDirection) turns += 1
    previousDirection = choice.direction
    points.push(choice.point)
  }

  if (turns < 2) return null
  const direction = directionBetween(points.at(-2)!, points.at(-1)!)
  const bodyBeforeHead = new Set(points.slice(0, -1).map(cellKey))
  const [rowStep, columnStep] = vectors[direction]
  let ray = {row: points.at(-1)!.row + rowStep, column: points.at(-1)!.column + columnStep}
  while (insideBoard(ray, size)) {
    if (bodyBeforeHead.has(cellKey(ray))) return null
    ray = {row: ray.row + rowStep, column: ray.column + columnStep}
  }
  return {points, direction}
}

function generateArrows(level: number, size: number) {
  const allowedCells = patternCells(size, level)
  const allowed = new Set(allowedCells.map(cellKey))
  const target = Math.min(28, Math.max(18, Math.floor(allowedCells.length / 7)))
  const maxPoints = Math.min(11, 8 + Math.floor((level - 1) / 6))
  let best: ArrowPiece[] = []

  for (let layout = 0; layout < 4 && best.length < target; layout += 1) {
    const random = seededRandom(level * 7919 + layout * 104729 + 17)
    const arrows: ArrowPiece[] = []
    const occupied = new Set<string>()
    let attempts = 0
    while (arrows.length < target && attempts < target * 350) {
      attempts += 1
      const candidate = makeBentPath(size, occupied, allowed, allowedCells, maxPoints, random)
      if (!candidate) continue
      const arrow = {...candidate, id: `arrow-${level}-${arrows.length}`}
      if (!headPathClears(occupied, size, arrow)) continue
      arrows.push(arrow)
      arrow.points.forEach((point) => occupied.add(cellKey(point)))
    }
    if (arrows.length > best.length) best = arrows
  }
  return best
}

export function createArrowGame(level = 1): ArrowGameState {
  const safeLevel = Math.max(1, Math.floor(level))
  const size = Math.min(17, 15 + Math.floor((safeLevel - 1) / 6))
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
  return Boolean(arrow && headPathIsClear(state.arrows.filter((piece) => piece.id !== id), state.size, arrow))
}

export function arrowTravel(state: ArrowGameState, id: string) {
  const arrow = state.arrows.find((piece) => piece.id === id)
  if (!arrow) return null
  const occupied = new Set(state.arrows.filter((piece) => piece.id !== id).flatMap((piece) => piece.points.map(cellKey)))
  const [rowStep, columnStep] = vectors[arrow.direction]
  const head = arrow.points.at(-1)!
  let steps = 1
  let next = {row: head.row + rowStep, column: head.column + columnStep}
  while (insideBoard(next, state.size) && !occupied.has(cellKey(next))) {
    steps += 1
    next = {row: next.row + rowStep, column: next.column + columnStep}
  }
  const blocked = insideBoard(next, state.size)
  const distance = blocked ? Math.max(.35, steps - .3) : steps
  return {blocked, x: columnStep * distance, y: rowStep * distance}
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
  const arrow = [...state.arrows].reverse().find((piece) => isArrowFree(state, piece.id))
  return arrow ? {...state, hintId: arrow.id, lastAction: null} : state
}

export const BOTTLE_CAPACITY = 4
export const BOTTLE_SESSION_LEVELS = 10

export const bottleColors = ['#ef5b70', '#f3a531', '#49af72', '#3c92cc', '#8067cf', '#d95caa', '#35a8a5', '#e46945'] as const

export type BottleMove = {from: number; to: number; amount: number}
export type BottleStatus = 'playing' | 'level-won' | 'complete'

export type BottleGameSave = {
  version: 1
  elapsedMs: number
  game: {
    level: number
    bottles: number[][]
    moves: number
    totalMoves: number
    levelsCompleted: number
    status: BottleStatus
  }
}

type Snapshot = Pick<BottleGameSave['game'], 'bottles' | 'moves' | 'totalMoves' | 'status'>

export function pourBottle(bottles: number[][], from: number, to: number) {
  const source = bottles[from]
  const target = bottles[to]
  if (!source?.length || !target || from === to || target.length >= BOTTLE_CAPACITY) return 0
  const color = source[source.length - 1]
  if (target.length && target[target.length - 1] !== color) return 0
  let run = 1
  while (run < source.length && source[source.length - 1 - run] === color) run += 1
  const amount = Math.min(run, BOTTLE_CAPACITY - target.length)
  target.push(...source.splice(source.length - amount, amount))
  return amount
}

export function bottleLevel(level: number) {
  const colorCount = Math.min(bottleColors.length, 3 + Math.floor((level - 1) / 2))
  const random = seededRandom(level * 97_409 + 31)
  let bottles = [...Array.from({length: colorCount}, (_, color) => Array(BOTTLE_CAPACITY).fill(color)), [], []] as number[][]
  const solution: BottleMove[] = []
  const seen = new Set([signature(bottles)])
  const targetSteps = 16 + colorCount * 5 + level

  for (let step = 0; step < targetSteps; step += 1) {
    const candidates: Array<{bottles: number[][]; inverse: BottleMove; disorder: number}> = []
    for (let from = 0; from < bottles.length; from += 1) {
      const source = bottles[from]
      if (!source.length) continue
      const color = source[source.length - 1]
      let run = 1
      while (run < source.length && source[source.length - 1 - run] === color) run += 1
      for (let to = 0; to < bottles.length; to += 1) {
        if (to === from || bottles[to].length >= BOTTLE_CAPACITY) continue
        for (let amount = 1; amount <= Math.min(run, BOTTLE_CAPACITY - bottles[to].length); amount += 1) {
          const next = cloneBottles(bottles)
          next[to].push(...next[from].splice(next[from].length - amount, amount))
          const restored = cloneBottles(next)
          if (pourBottle(restored, to, from) !== amount || signature(restored) !== signature(bottles) || seen.has(signature(next))) continue
          candidates.push({bottles: next, inverse: {from: to, to: from, amount}, disorder: disorder(next)})
        }
      }
    }
    if (!candidates.length) break
    const currentDisorder = disorder(bottles)
    const useful = candidates.filter((candidate) => candidate.disorder >= currentDisorder)
    const pool = useful.length ? useful : candidates
    const picked = pool[Math.floor(random() * pool.length)]
    bottles = picked.bottles
    seen.add(signature(bottles))
    solution.unshift(picked.inverse)
  }

  return {bottles, solution}
}

export class BottleSortGame {
  level = 1
  bottles: number[][] = []
  moves = 0
  totalMoves = 0
  levelsCompleted = 0
  status: BottleStatus = 'playing'
  private history: Snapshot[] = []

  constructor(level = 1) {
    this.level = level
    this.loadLevel()
  }

  get canUndo() { return this.history.length > 0 && this.status === 'playing' }

  pour(from: number, to: number): BottleMove | null {
    if (this.status !== 'playing') return null
    const before = this.snapshot()
    const amount = pourBottle(this.bottles, from, to)
    if (!amount) return null
    this.history.push(before)
    this.moves += 1
    this.totalMoves += 1
    if (this.solved()) {
      this.levelsCompleted += 1
      this.status = this.level >= BOTTLE_SESSION_LEVELS ? 'complete' : 'level-won'
    }
    return {from, to, amount}
  }

  undo() {
    const previous = this.history.pop()
    if (!previous) return false
    this.bottles = cloneBottles(previous.bottles)
    this.moves = previous.moves
    this.totalMoves = previous.totalMoves
    this.status = previous.status
    return true
  }

  restartLevel() {
    this.totalMoves = Math.max(0, this.totalMoves - this.moves)
    this.moves = 0
    this.status = 'playing'
    this.loadLevel()
  }

  nextLevel() {
    if (this.status !== 'level-won') return false
    this.level += 1
    this.moves = 0
    this.status = 'playing'
    this.loadLevel()
    return true
  }

  toSave(elapsedMs: number): BottleGameSave {
    return {version: 1, elapsedMs: Math.max(0, Math.round(elapsedMs)), game: {...this.snapshot(), level: this.level, levelsCompleted: this.levelsCompleted}}
  }

  static fromSave(value: unknown) {
    if (!value || typeof value !== 'object') return null
    const save = value as Partial<BottleGameSave>
    const state = save.game
    const validBottle = (bottle: unknown) => Array.isArray(bottle) && bottle.length <= BOTTLE_CAPACITY && bottle.every((color) => Number.isInteger(color) && color >= 0 && color < bottleColors.length)
    if (save.version !== 1 || typeof save.elapsedMs !== 'number' || !Number.isFinite(save.elapsedMs) || !state) return null
    if (!Number.isInteger(state.level) || state.level! < 1 || state.level! > BOTTLE_SESSION_LEVELS || !Array.isArray(state.bottles) || !state.bottles.every(validBottle)) return null
    if (![state.moves, state.totalMoves, state.levelsCompleted].every((value) => Number.isInteger(value) && Number(value) >= 0)) return null
    if (!['playing', 'level-won', 'complete'].includes(String(state.status))) return null
    const game = new BottleSortGame(state.level)
    game.bottles = cloneBottles(state.bottles)
    game.moves = state.moves
    game.totalMoves = state.totalMoves
    game.levelsCompleted = state.levelsCompleted
    game.status = state.status
    game.history = []
    return {game, elapsedMs: Math.max(0, save.elapsedMs)}
  }

  private solved() {
    return this.bottles.every((bottle) => !bottle.length || (bottle.length === BOTTLE_CAPACITY && bottle.every((color) => color === bottle[0])))
  }

  private snapshot(): Snapshot {
    return {bottles: cloneBottles(this.bottles), moves: this.moves, totalMoves: this.totalMoves, status: this.status}
  }

  private loadLevel() {
    this.bottles = cloneBottles(bottleLevel(this.level).bottles)
    this.history = []
  }
}

function cloneBottles(bottles: number[][]) {
  return bottles.map((bottle) => [...bottle])
}

function signature(bottles: number[][]) {
  return bottles.map((bottle) => bottle.join('')).join('|')
}

function disorder(bottles: number[][]) {
  return bottles.reduce((score, bottle) => score + bottle.slice(1).filter((color, index) => color !== bottle[index]).length + (bottle.length && bottle.length < BOTTLE_CAPACITY ? 1 : 0), 0)
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = Math.imul(value ^ value >>> 15, 1 | value)
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value)
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296
  }
}

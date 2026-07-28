export const SLICE_WIDTH = 720
export const SLICE_HEIGHT = 900

export type SlicePoint = {x: number; y: number}
export type SliceTarget = {
  id: number
  kind: number | 'bomb'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  spin: number
  sliced: boolean
  cutAge: number
  cutAngle: number
}

export type SliceHit = {id: number; kind: number; x: number; y: number; color: string}
export type SliceResult = {hits: SliceHit[]; bomb: boolean}
export type SliceStatus = 'playing' | 'over'

export type SliceGameSave = {
  version: 1
  elapsedMs: number
  game: {
    targets: SliceTarget[]
    score: number
    lives: number
    bestCombo: number
    fruitsSliced: number
    nextLifeAt: number
    nextId: number
    spawnIn: number
    wave: number
  }
}

const fruitColors = ['#e94b68', '#6c75d8', '#91c94c', '#f29b3d', '#e35a4f', '#d6c94c', '#ef897d', '#71b87a', '#3d9b67']
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export class FruitSliceGame {
  targets: SliceTarget[] = []
  score = 0
  lives = 3
  bestCombo = 0
  fruitsSliced = 0
  status: SliceStatus = 'playing'
  endReason: 'missed' | 'bomb' | null = null
  private nextLifeAt = 100
  private nextId = 1
  private spawnIn = .55
  private wave = 0
  private readonly random: () => number

  constructor(random: () => number = Math.random) {
    this.random = random
  }

  update(elapsedSeconds: number) {
    if (this.status !== 'playing') return
    const elapsed = clamp(elapsedSeconds, 0, .05)
    this.spawnIn -= elapsed
    if (this.spawnIn <= 0) this.spawnWave()

    let misses = 0
    for (const target of this.targets) {
      target.vy += 820 * elapsed
      target.x += target.vx * elapsed
      target.y += target.vy * elapsed
      target.rotation += target.spin * elapsed
      if (target.sliced) target.cutAge += elapsed
      if (!target.sliced && target.kind !== 'bomb' && target.y - target.radius > SLICE_HEIGHT) misses += 1
    }
    this.targets = this.targets.filter((target) => target.y - target.radius <= SLICE_HEIGHT + 80 && (!target.sliced || target.cutAge < .7))
    if (misses) {
      this.lives = Math.max(0, this.lives - misses)
      if (!this.lives) {
        this.status = 'over'
        this.endReason = 'missed'
      }
    }
  }

  slice(from: SlicePoint, to: SlicePoint): SliceResult {
    if (this.status !== 'playing') return {hits: [], bomb: false}
    const hits: SliceHit[] = []
    for (const target of this.targets) {
      if (target.sliced || distanceToSegment(target, from, to) > target.radius + 8) continue
      if (target.kind === 'bomb') {
        this.status = 'over'
        this.endReason = 'bomb'
        return {hits, bomb: true}
      }
      target.sliced = true
      target.cutAge = 0
      target.cutAngle = Math.atan2(to.y - from.y, to.x - from.x)
      target.vy -= 50
      this.score += 1
      this.fruitsSliced += 1
      hits.push({id: target.id, kind: target.kind, x: target.x, y: target.y, color: fruitColors[target.kind]})
    }
    this.grantLife()
    return {hits, bomb: false}
  }

  finishStroke(count: number) {
    if (count < 3 || this.status !== 'playing') return 0
    this.bestCombo = Math.max(this.bestCombo, count)
    this.score += count
    this.grantLife()
    return count
  }

  toSave(elapsedMs: number): SliceGameSave {
    return {
      version: 1,
      elapsedMs: Math.max(0, Math.round(elapsedMs)),
      game: {
        targets: this.targets.map((target) => ({...target})),
        score: this.score,
        lives: this.lives,
        bestCombo: this.bestCombo,
        fruitsSliced: this.fruitsSliced,
        nextLifeAt: this.nextLifeAt,
        nextId: this.nextId,
        spawnIn: this.spawnIn,
        wave: this.wave,
      },
    }
  }

  static fromSave(value: unknown, random: () => number = Math.random) {
    if (!value || typeof value !== 'object') return null
    const save = value as Partial<SliceGameSave>
    const state = save.game
    const finite = (number: unknown) => typeof number === 'number' && Number.isFinite(number)
    const integer = (number: unknown, minimum = 0) => Number.isInteger(number) && Number(number) >= minimum
    if (save.version !== 1 || !finite(save.elapsedMs) || !state || !Array.isArray(state.targets) || state.targets.length > 80) return null
    if (![state.score, state.bestCombo, state.fruitsSliced, state.nextLifeAt, state.nextId, state.wave].every((number) => integer(number))) return null
    if (!integer(state.lives, 1) || state.lives > 3 || !finite(state.spawnIn)) return null
    if (!state.targets.every((target) => {
      const validKind = target.kind === 'bomb' || (integer(target.kind) && target.kind <= 8)
      return integer(target.id, 1) && validKind
        && [target.x, target.y, target.vx, target.vy, target.radius, target.rotation, target.spin, target.cutAge, target.cutAngle].every(finite)
        && typeof target.sliced === 'boolean'
    })) return null

    const game = new FruitSliceGame(random)
    game.targets = state.targets.map((target) => ({...target}))
    game.score = state.score
    game.lives = state.lives
    game.bestCombo = state.bestCombo
    game.fruitsSliced = state.fruitsSliced
    game.nextLifeAt = state.nextLifeAt
    game.nextId = state.nextId
    game.spawnIn = clamp(state.spawnIn, 0, 2)
    game.wave = state.wave
    return {game, elapsedMs: Math.max(0, Number(save.elapsedMs))}
  }

  private spawnWave() {
    this.wave += 1
    const fruitCount = 1 + Math.floor(this.random() * Math.min(4, 2 + Math.floor(this.score / 35)))
    for (let index = 0; index < fruitCount; index += 1) this.spawnFruit(index, fruitCount)
    if (this.score >= 8 && this.random() < Math.min(.25, .1 + this.score / 900)) this.spawnBomb()
    this.spawnIn = Math.max(.52, 1.18 - this.score * .006) + this.random() * .42
  }

  private spawnFruit(index: number, count: number) {
    const kind = Math.floor(this.random() * 7)
    const radius = 38 + kind * 2
    const spread = SLICE_WIDTH * .72
    const x = SLICE_WIDTH * .14 + spread * ((index + .5) / count) + (this.random() - .5) * 90
    this.targets.push(this.target(kind, clamp(x, radius, SLICE_WIDTH - radius), radius))
  }

  private spawnBomb() {
    const bomb = this.target('bomb', SLICE_WIDTH * (.22 + this.random() * .56), 42)
    bomb.vy += 70
    this.targets.push(bomb)
  }

  private target(kind: number | 'bomb', x: number, radius: number): SliceTarget {
    const centerPull = (SLICE_WIDTH / 2 - x) * (.2 + this.random() * .18)
    return {
      id: this.nextId++, kind, x, y: SLICE_HEIGHT + radius,
      vx: centerPull + (this.random() - .5) * 170,
      vy: -760 - this.random() * 190,
      radius, rotation: this.random() * Math.PI * 2,
      spin: (this.random() - .5) * 4,
      sliced: false, cutAge: 0, cutAngle: 0,
    }
  }

  private grantLife() {
    while (this.score >= this.nextLifeAt) {
      if (this.lives < 3) this.lives += 1
      this.nextLifeAt += 100
    }
  }
}

function distanceToSegment(point: SlicePoint, start: SlicePoint, end: SlicePoint) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1)
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t))
}

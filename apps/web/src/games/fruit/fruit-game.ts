export const FRUIT_BOARD_WIDTH = 480
export const FRUIT_BOARD_HEIGHT = 640
export const FRUIT_DANGER_Y = 102

export type FruitGameStatus = 'playing' | 'over'

export type FruitSpec = {
  name: string
  radius: number
  color: string
  shade: string
  cheek: string
}

export type FruitBody = {
  id: number
  kind: number
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  age: number
  pulse: number
}

export type FruitGameSave = {
  version: 1
  elapsedMs: number
  game: {
    fruits: FruitBody[]
    nextKinds: number[]
    score: number
    aimX: number
    dangerProgress: number
    nextId: number
  }
}

export const fruitSpecs: readonly FruitSpec[] = [
  {name: 'Ceri', radius: 18, color: '#e94b68', shade: '#b72f4b', cheek: '#ff9bad'},
  {name: 'Blueberry', radius: 24, color: '#6c75d8', shade: '#4850a8', cheek: '#aeb5ff'},
  {name: 'Jeruk nipis', radius: 31, color: '#91c94c', shade: '#5e9b2c', cheek: '#ccec8c'},
  {name: 'Jeruk', radius: 39, color: '#f29b3d', shade: '#cf691f', cheek: '#ffc88f'},
  {name: 'Apel', radius: 48, color: '#e35a4f', shade: '#ad342f', cheek: '#ffaaa0'},
  {name: 'Pir', radius: 58, color: '#d6c94c', shade: '#9a8e27', cheek: '#f4ec8b'},
  {name: 'Persik', radius: 69, color: '#ef897d', shade: '#bd554f', cheek: '#ffc1b7'},
  {name: 'Melon', radius: 82, color: '#f3b43f', shade: '#b87c1c', cheek: '#ffe49e'},
  {name: 'Semangka', radius: 96, color: '#27ae60', shade: '#145a32', cheek: '#82e0aa'},
] as const

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export class FruitMergeGame {
  fruits: FruitBody[] = []
  nextKinds: number[]
  score = 0
  status: FruitGameStatus = 'playing'
  aimX = FRUIT_BOARD_WIDTH / 2
  dangerProgress = 0
  dropCooldown = 0
  private nextId = 1
  private readonly random: () => number

  constructor(random: () => number = Math.random) {
    this.random = random
    this.nextKinds = [this.randomKind(), this.randomKind(), this.randomKind()]
  }

  toSave(elapsedMs: number): FruitGameSave {
    return {
      version: 1,
      elapsedMs: Math.max(0, Math.round(elapsedMs)),
      game: {
        fruits: this.fruits.map((fruit) => ({...fruit})),
        nextKinds: [...this.nextKinds],
        score: this.score,
        aimX: this.aimX,
        dangerProgress: this.dangerProgress,
        nextId: this.nextId,
      },
    }
  }

  static fromSave(value: unknown, random: () => number = Math.random) {
    if (!value || typeof value !== 'object') return null
    const save = value as Partial<FruitGameSave>
    const state = save.game
    const validKind = (kind: unknown) => Number.isInteger(kind) && Number(kind) >= 0 && Number(kind) < fruitSpecs.length
    const finite = (number: unknown) => typeof number === 'number' && Number.isFinite(number)
    if (save.version !== 1 || !finite(save.elapsedMs) || !state || !Array.isArray(state.fruits) || !Array.isArray(state.nextKinds)) return null
    if (state.nextKinds.length !== 3 || !state.nextKinds.every(validKind) || !Number.isInteger(state.score) || state.score < 0) return null
    if (!finite(state.aimX) || !finite(state.dangerProgress) || !Number.isInteger(state.nextId) || state.nextId < 1) return null
    if (state.fruits.length > 250 || !state.fruits.every((fruit) => Number.isInteger(fruit.id) && validKind(fruit.kind)
      && [fruit.x, fruit.y, fruit.vx, fruit.vy, fruit.angle, fruit.spin, fruit.age, fruit.pulse].every(finite))) return null

    const game = new FruitMergeGame(random)
    game.fruits = state.fruits.map((fruit) => ({...fruit}))
    game.nextKinds = [...state.nextKinds]
    game.score = state.score
    game.aimX = clamp(state.aimX, 0, FRUIT_BOARD_WIDTH)
    game.dangerProgress = clamp(state.dangerProgress, 0, .74)
    game.dropCooldown = 0
    game.nextId = Math.max(state.nextId, ...game.fruits.map((fruit) => fruit.id + 1), 1)
    return {game, elapsedMs: Math.max(0, Number(save.elapsedMs))}
  }

  get largestKind() {
    return this.fruits.reduce((largest, fruit) => Math.max(largest, fruit.kind), 0)
  }

  setAim(x: number) {
    const radius = fruitSpecs[this.nextKinds[0]].radius
    this.aimX = clamp(x, radius + 5, FRUIT_BOARD_WIDTH - radius - 5)
  }

  drop(x = this.aimX) {
    if (this.status !== 'playing' || this.dropCooldown > 0) return false
    const kind = this.nextKinds.shift()!
    this.nextKinds.push(this.randomKind())
    const radius = fruitSpecs[kind].radius
    const body = this.spawn(kind, clamp(x, radius + 5, FRUIT_BOARD_WIDTH - radius - 5), 38 + radius)
    body.vy = 20
    body.spin = (this.random() - .5) * 1.4
    this.dropCooldown = .38
    this.setAim(this.aimX)
    return true
  }

  spawn(kind: number, x: number, y: number, vx = 0, vy = 0) {
    const safeKind = clamp(Math.floor(kind), 0, fruitSpecs.length - 1)
    const body: FruitBody = {
      id: this.nextId++,
      kind: safeKind,
      x,
      y,
      vx,
      vy,
      angle: 0,
      spin: 0,
      age: 0,
      pulse: 1,
    }
    this.fruits.push(body)
    return body
  }

  update(elapsedSeconds: number) {
    if (this.status !== 'playing') return
    const elapsed = clamp(elapsedSeconds, 0, .05)
    this.dropCooldown = Math.max(0, this.dropCooldown - elapsed)
    const steps = Math.max(1, Math.ceil(elapsed / .012))
    const step = elapsed / steps
    for (let index = 0; index < steps; index += 1) this.step(step)
    this.updateDanger(elapsed)
  }

  private step(seconds: number) {
    for (const fruit of this.fruits) {
      const radius = fruitSpecs[fruit.kind].radius
      fruit.age += seconds
      fruit.pulse = Math.max(0, fruit.pulse - seconds * 4)
      fruit.vy += 920 * seconds
      fruit.x += fruit.vx * seconds
      fruit.y += fruit.vy * seconds
      fruit.angle += fruit.spin * seconds

      if (fruit.x - radius < 0) {
        fruit.x = radius
        fruit.vx = Math.abs(fruit.vx) * .28
        fruit.spin *= .72
      } else if (fruit.x + radius > FRUIT_BOARD_WIDTH) {
        fruit.x = FRUIT_BOARD_WIDTH - radius
        fruit.vx = -Math.abs(fruit.vx) * .28
        fruit.spin *= .72
      }

      if (fruit.y + radius > FRUIT_BOARD_HEIGHT) {
        fruit.y = FRUIT_BOARD_HEIGHT - radius
        fruit.vy = Math.abs(fruit.vy) < 35 ? 0 : -Math.abs(fruit.vy) * .16
        fruit.vx *= Math.exp(-5.5 * seconds)
        fruit.spin *= Math.exp(-5 * seconds)
      }
    }

    this.resolveCollisions()
  }

  private resolveCollisions() {
    const merged = new Set<number>()
    const additions: Array<{kind: number; x: number; y: number; vx: number; vy: number}> = []

    for (let firstIndex = 0; firstIndex < this.fruits.length; firstIndex += 1) {
      const first = this.fruits[firstIndex]
      if (merged.has(first.id)) continue
      for (let secondIndex = firstIndex + 1; secondIndex < this.fruits.length; secondIndex += 1) {
        const second = this.fruits[secondIndex]
        if (merged.has(second.id)) continue
        const dx = second.x - first.x
        const dy = second.y - first.y
        const minimumDistance = fruitSpecs[first.kind].radius + fruitSpecs[second.kind].radius
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared >= minimumDistance * minimumDistance) continue

        const distance = Math.max(.001, Math.sqrt(distanceSquared))
        if (first.kind === second.kind && first.age > .05 && second.age > .05) {
          merged.add(first.id)
          merged.add(second.id)
          if (first.kind < fruitSpecs.length - 1) {
            additions.push({
              kind: first.kind + 1,
              x: (first.x + second.x) / 2,
              y: (first.y + second.y) / 2,
              vx: (first.vx + second.vx) * .34,
              vy: Math.min(-95, (first.vy + second.vy) * .2),
            })
            this.score += (first.kind + 1) * 12
          } else {
            // Merging two of the largest fruit (Semangka) clears them and awards bonus score
            this.score += (first.kind + 1) * 25
          }
          break
        }

        const normalX = dx / distance
        const normalY = dy / distance
        const overlap = minimumDistance - distance
        first.x -= normalX * overlap * .5
        first.y -= normalY * overlap * .5
        second.x += normalX * overlap * .5
        second.y += normalY * overlap * .5

        const relativeVelocity = (second.vx - first.vx) * normalX + (second.vy - first.vy) * normalY
        if (relativeVelocity < 0) {
          const impulse = -(1.14 * relativeVelocity) / 2
          first.vx -= impulse * normalX
          first.vy -= impulse * normalY
          second.vx += impulse * normalX
          second.vy += impulse * normalY
        }
      }
    }

    if (merged.size) this.fruits = this.fruits.filter((fruit) => !merged.has(fruit.id))
    for (const addition of additions) {
      const body = this.spawn(addition.kind, addition.x, addition.y, addition.vx, addition.vy)
      body.spin = (this.random() - .5) * 1.1
    }
  }

  private updateDanger(seconds: number) {
    const crowded = this.fruits.some((fruit) => {
      const radius = fruitSpecs[fruit.kind].radius
      return fruit.age > .7 && fruit.y - radius < FRUIT_DANGER_Y
    })
    this.dangerProgress = clamp(this.dangerProgress + (crowded ? seconds : -seconds * 1.8), 0, 1.4)
    if (this.dangerProgress >= .75) this.status = 'over'
  }

  private randomKind() {
    const unlocked = this.score > 650 ? 5 : this.score > 260 ? 4 : 3
    return Math.min(unlocked - 1, Math.floor(this.random() * unlocked))
  }
}

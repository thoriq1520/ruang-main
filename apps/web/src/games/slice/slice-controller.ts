import {archiveSoloGame, saveSoloGame, submitSoloRun} from '../../api/client'
import {updateDocumentMeta} from '../../app/seo'
import type {GameController} from '../../shared/game-controller'
import {prepareSoloStart, soloSaveLoadingScreen} from '../../shared/solo-save'
import {FruitSliceGame, SLICE_HEIGHT, SLICE_WIDTH, type SliceHit, type SlicePoint} from './slice-game'
import {drawSliceBoard, fruitSliceScreen, type JuiceParticle, type TrailPoint} from './slice-view'

export function createSliceController(root: HTMLElement, bindLeaveButtons: () => void): GameController {
  let game: FruitSliceGame | null = null
  let stopLoop: (() => void) | null = null
  let startedAt = 0
  let submitted = false
  let authenticated = false
  let startToken = 0
  let lastSaveAt = 0

  const stop = () => {
    stopLoop?.()
    stopLoop = null
  }
  const persist = () => {
    if (!authenticated || !game || game.status !== 'playing') return
    lastSaveAt = performance.now()
    void saveSoloGame('fruit-slice', game.toSave(lastSaveAt - startedAt))
  }
  const newGame = () => {
    game = new FruitSliceGame()
    startedAt = performance.now()
    submitted = false
  }

  const render = () => {
    if (!game) return start()
    stop()
    updateDocumentMeta('Main Tebas Buah Gratis | Ruang Main', 'Main Tebas Buah gratis di browser. Sapukan jari atau mouse, buat combo, hindari bom, dan kejar skor tertinggi.', '/game/tebas-buah')
    root.innerHTML = fruitSliceScreen(game)
    bindLeaveButtons()
    root.querySelectorAll('[data-restart-slice]').forEach((button) => button.addEventListener('click', () => void startFresh()))

    const canvas = root.querySelector<HTMLCanvasElement>('#slice-canvas')!
    const context = canvas.getContext('2d')!
    const score = root.querySelector<HTMLElement>('#slice-score')!
    const lives = root.querySelector<HTMLElement>('#slice-lives')!
    const bestCombo = root.querySelector<HTMLElement>('#slice-best-combo')!
    const promo = root.querySelector<HTMLElement>('#slice-promo')!
    const result = root.querySelector<HTMLElement>('#slice-result')!
    const resultLabel = root.querySelector<HTMLElement>('#slice-result-label')!
    const resultCopy = root.querySelector<HTMLElement>('#slice-result-copy')!
    const finalScore = root.querySelector<HTMLElement>('#slice-final-score')!
    const trail: TrailPoint[] = []
    const particles: JuiceParticle[] = []
    let pointerId: number | null = null
    let previousPoint: SlicePoint | null = null
    let strokeHits = 0
    let frame = 0
    let previousTime = performance.now()
    let previousLives = game.lives
    let promoTimer = 0

    const pointFromEvent = (event: PointerEvent): SlicePoint => {
      const bounds = canvas.getBoundingClientRect()
      return {x: (event.clientX - bounds.left) / bounds.width * SLICE_WIDTH, y: (event.clientY - bounds.top) / bounds.height * SLICE_HEIGHT}
    }
    const showPromo = (title: string, detail: string) => {
      promo.innerHTML = `<strong>${title}</strong><span>${detail}</span>`
      promo.classList.remove('is-visible')
      void promo.offsetWidth
      promo.classList.add('is-visible')
      window.clearTimeout(promoTimer)
      promoTimer = window.setTimeout(() => promo.classList.remove('is-visible'), 900)
    }
    const addJuice = (hits: SliceHit[]) => {
      if (reducedMotion()) return
      for (const hit of hits) for (let index = 0; index < 8; index += 1) particles.push({
        x: hit.x, y: hit.y,
        vx: (Math.random() - .5) * 250,
        vy: (Math.random() - .8) * 220,
        age: 0,
        color: hit.color,
      })
    }
    const slashTo = (point: SlicePoint) => {
      if (!game || !previousPoint || game.status !== 'playing') return
      const sliced = game.slice(previousPoint, point)
      trail.push({...previousPoint, age: 0}, {...point, age: 0})
      if (trail.length > 28) trail.splice(0, trail.length - 28)
      strokeHits += sliced.hits.length
      addJuice(sliced.hits)
      if (sliced.bomb) {
        showPromo('Bom!', 'Sapuan berakhir')
        navigator.vibrate?.(40)
      }
      previousPoint = point
    }
    const finishStroke = () => {
      const bonus = game?.finishStroke(strokeHits) ?? 0
      if (bonus) {
        showPromo(`Combo ×${strokeHits}`, `+${bonus} poin`)
        navigator.vibrate?.(12)
      }
      strokeHits = 0
      previousPoint = null
      persist()
    }

    canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || pointerId !== null || game?.status !== 'playing') return
      event.preventDefault()
      pointerId = event.pointerId
      previousPoint = pointFromEvent(event)
      canvas.setPointerCapture(pointerId)
      canvas.classList.add('is-slicing')
    })
    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return
      event.preventDefault()
      for (const sample of event.getCoalescedEvents?.() ?? [event]) slashTo(pointFromEvent(sample))
    })
    canvas.addEventListener('pointerup', (event) => {
      if (event.pointerId !== pointerId) return
      slashTo(pointFromEvent(event))
      finishStroke()
      pointerId = null
      canvas.classList.remove('is-slicing')
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    })
    canvas.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== pointerId) return
      finishStroke()
      pointerId = null
      canvas.classList.remove('is-slicing')
    })
    canvas.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      previousPoint = {x: SLICE_WIDTH * .2, y: SLICE_HEIGHT * .55}
      slashTo({x: SLICE_WIDTH * .8, y: SLICE_HEIGHT * .45})
      finishStroke()
    })

    const animate = (time: number) => {
      if (!game) return
      const elapsed = Math.min(.05, (time - previousTime) / 1000)
      previousTime = time
      game.update(elapsed)
      for (const point of trail) point.age += elapsed
      while (trail[0]?.age > .24) trail.shift()
      for (const particle of particles) {
        particle.age += elapsed
        particle.vy += 520 * elapsed
        particle.x += particle.vx * elapsed
        particle.y += particle.vy * elapsed
      }
      while (particles[0]?.age > .55) particles.shift()
      drawSliceBoard(context, game, trail, particles)
      score.textContent = game.score.toLocaleString('id-ID')
      lives.textContent = `${game.lives}/3`
      bestCombo.textContent = game.bestCombo ? `×${game.bestCombo}` : '-'
      if (game.lives < previousLives && game.status === 'playing') showPromo('Terlewat', `${game.lives} nyawa tersisa`)
      previousLives = game.lives
      if (authenticated && game.status === 'playing' && time - lastSaveAt >= 1_200) persist()
      if (game.status === 'over') {
        result.hidden = false
        resultLabel.textContent = game.endReason === 'bomb' ? 'Bom tersentuh' : 'Tiga buah terlewat'
        resultCopy.textContent = game.endReason === 'bomb' ? 'Jaga sapuan tetap pendek saat bom melintas.' : 'Tebas buah sebelum jatuh keluar papan.'
        finalScore.textContent = game.score.toLocaleString('id-ID')
        if (!submitted) {
          submitted = true
          if (authenticated) void archiveSoloGame('fruit-slice')
          void submitSoloRun({gameId: 'fruit-slice', result: 'lost', score: game.score, bestCombo: game.bestCombo, fruitsSliced: game.fruitsSliced, durationMs: Math.round(performance.now() - startedAt)})
        }
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    stopLoop = () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(promoTimer)
    }
  }

  const startFresh = async () => {
    if (authenticated) await archiveSoloGame('fruit-slice').catch(() => false)
    stop()
    newGame()
    persist()
    render()
  }

  const start = () => {
    const token = ++startToken
    stop()
    root.innerHTML = soloSaveLoadingScreen('Tebas Buah')
    void prepareSoloStart('fruit-slice', 'Tebas Buah').then(async (prepared) => {
      if (token !== startToken) return
      authenticated = prepared.authenticated
      const restored = prepared.state ? FruitSliceGame.fromSave(prepared.state) : null
      if (prepared.state && !restored && authenticated) await archiveSoloGame('fruit-slice').catch(() => false)
      if (token !== startToken) return
      if (restored) {
        game = restored.game
        startedAt = performance.now() - restored.elapsedMs
        submitted = false
      } else newGame()
      persist()
      render()
    })
  }

  return {
    get active() { return game !== null },
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

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

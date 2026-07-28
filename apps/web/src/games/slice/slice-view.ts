import {fruitSpecs} from '../fruit/fruit-game'
import {drawFruitCharacter} from '../fruit/fruit-view'
import {gameHeader} from '../../shared/ui'
import {SLICE_HEIGHT, SLICE_WIDTH, type FruitSliceGame, type SlicePoint, type SliceTarget} from './slice-game'

export type TrailPoint = SlicePoint & {age: number}
export type JuiceParticle = SlicePoint & {vx: number; vy: number; age: number; color: string}

export function fruitSliceScreen(game: FruitSliceGame) {
  return `
    ${gameHeader({title: 'Tebas Buah', className: 'slice-header'})}
    <main id="main-content" class="slice-shell">
      <section class="slice-game-panel" aria-labelledby="slice-title">
        <aside class="slice-game-copy">
          <p class="slice-game-label">Tebas Buah</p>
          <h1 id="slice-title">Tarik. Tebas. Combo.</h1>
          <p class="slice-objective">Sapukan jari atau mouse untuk membelah buah. Hindari bom dan jangan biarkan tiga buah jatuh.</p>
          <dl class="slice-stats">
            <div><dt>Skor</dt><dd id="slice-score">${game.score}</dd></div>
            <div><dt>Nyawa</dt><dd id="slice-lives">${game.lives}/3</dd></div>
            <div><dt>Combo terbaik</dt><dd id="slice-best-combo">${game.bestCombo || '-'}</dd></div>
          </dl>
          <div class="slice-rule"><strong>Cara bermain</strong><p>Tahan lalu geser melewati buah. Tebas minimal tiga buah dalam satu sapuan untuk bonus combo. Menyentuh bom langsung mengakhiri permainan.</p></div>
          <button class="button button-secondary" data-restart-slice type="button">Ulang game</button>
          <p class="slice-session-note">Permainan dapat dilanjutkan jika kamu sudah masuk.</p>
        </aside>
        <section class="slice-play-area" aria-label="Area permainan Tebas Buah">
          <div class="slice-board-wrap">
            <canvas id="slice-canvas" class="slice-canvas" width="${SLICE_WIDTH}" height="${SLICE_HEIGHT}" tabindex="0" role="application" aria-label="Papan Tebas Buah. Tahan dan geser untuk menebas buah."></canvas>
            <div class="slice-promo" id="slice-promo" role="status" aria-live="polite"></div>
            <div class="slice-result" id="slice-result" role="dialog" aria-modal="true" aria-labelledby="slice-result-title" hidden>
              <p class="step-label" id="slice-result-label">Permainan selesai</p>
              <h2 id="slice-result-title">Skor <span id="slice-final-score">0</span></h2>
              <p id="slice-result-copy">Coba lagi dan jaga tiga nyawamu.</p>
              <button class="button button-primary" data-restart-slice type="button">Main lagi</button>
            </div>
          </div>
          <p class="slice-drag-hint">Tahan dan sapukan melintasi buah</p>
        </section>
      </section>
    </main>`
}

export function drawSliceBoard(context: CanvasRenderingContext2D, game: FruitSliceGame, trail: TrailPoint[], particles: JuiceParticle[]) {
  context.clearRect(0, 0, SLICE_WIDTH, SLICE_HEIGHT)
  context.fillStyle = '#173b2d'
  context.fillRect(0, 0, SLICE_WIDTH, SLICE_HEIGHT)
  drawBoardTexture(context)
  for (const target of game.targets) drawTarget(context, target)
  drawParticles(context, particles)
  drawTrail(context, trail)
}

function drawBoardTexture(context: CanvasRenderingContext2D) {
  context.save()
  context.strokeStyle = 'rgba(242, 229, 189, .08)'
  context.lineWidth = 3
  for (let y = 80; y < SLICE_HEIGHT; y += 115) {
    context.beginPath()
    context.moveTo(0, y)
    context.bezierCurveTo(180, y - 16, 510, y + 20, SLICE_WIDTH, y - 4)
    context.stroke()
  }
  context.strokeStyle = 'rgba(5, 19, 13, .18)'
  context.lineWidth = 2
  for (let x = 100; x < SLICE_WIDTH; x += 170) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x - 36, SLICE_HEIGHT)
    context.stroke()
  }
  context.restore()
}

function drawTarget(context: CanvasRenderingContext2D, target: SliceTarget) {
  if (target.kind === 'bomb') return drawBomb(context, target)
  if (!target.sliced) return drawFruitCharacter(context, target.kind, target.x, target.y, target.radius, target.rotation, target.vx, false)

  const separation = Math.min(target.radius * .42, target.cutAge * 90)
  for (const side of [-1, 1]) {
    context.save()
    context.translate(target.x, target.y)
    context.rotate(target.cutAngle)
    context.translate(0, side * separation)
    context.beginPath()
    context.rect(-target.radius * 1.25, side < 0 ? -target.radius * 1.25 : 0, target.radius * 2.5, target.radius * 1.25)
    context.clip()
    drawFruitCharacter(context, target.kind, 0, 0, target.radius, target.rotation - target.cutAngle, target.vx, false)
    context.restore()
  }
}

function drawBomb(context: CanvasRenderingContext2D, target: SliceTarget) {
  context.save()
  context.translate(target.x, target.y)
  context.rotate(target.rotation)
  context.fillStyle = '#121b17'
  context.strokeStyle = '#050907'
  context.lineWidth = 5
  context.beginPath()
  context.arc(0, 0, target.radius, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.fillStyle = '#405348'
  context.beginPath()
  context.arc(-target.radius * .28, -target.radius * .3, target.radius * .18, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#d5b059'
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(target.radius * .35, -target.radius * .72)
  context.quadraticCurveTo(target.radius * .6, -target.radius * 1.2, target.radius * .92, -target.radius * 1.12)
  context.stroke()
  context.fillStyle = '#f0b93f'
  context.beginPath()
  context.arc(target.radius * .98, -target.radius * 1.14, 8, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawTrail(context: CanvasRenderingContext2D, trail: TrailPoint[]) {
  if (trail.length < 2) return
  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (let index = 1; index < trail.length; index += 1) {
    const alpha = Math.max(0, 1 - trail[index].age / .24)
    context.strokeStyle = `rgba(255, 244, 184, ${alpha})`
    context.lineWidth = 5 + alpha * 8
    context.beginPath()
    context.moveTo(trail[index - 1].x, trail[index - 1].y)
    context.lineTo(trail[index].x, trail[index].y)
    context.stroke()
  }
  context.restore()
}

function drawParticles(context: CanvasRenderingContext2D, particles: JuiceParticle[]) {
  context.save()
  for (const particle of particles) {
    context.globalAlpha = Math.max(0, 1 - particle.age / .55)
    context.fillStyle = particle.color
    context.beginPath()
    context.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

export function fruitName(kind: number) {
  return fruitSpecs[kind]?.name ?? 'Buah'
}

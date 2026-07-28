import {FRUIT_BOARD_HEIGHT, FRUIT_BOARD_WIDTH, FRUIT_DANGER_Y, type FruitBody, type FruitMergeGame, fruitSpecs} from './fruit-game'
import {gameHeader} from '../../shared/ui'

export function fruitGameScreen(game: FruitMergeGame) {
  return `
    ${gameHeader({title: 'Fruit Merge', className: 'fruit-header'})}
    <main id="main-content" class="fruit-shell">
      <section class="fruit-game-panel" aria-labelledby="fruit-title">
        <aside class="fruit-game-copy">
          <p class="fruit-game-label">Fruit Merge</p>
          <h1 id="fruit-title">Gabungkan buah</h1>
          <p class="fruit-objective">Jatuhkan dua buah sejenis agar berubah menjadi buah yang lebih besar.</p>
          <dl class="fruit-stats">
            <div><dt>Skor</dt><dd id="fruit-score">${game.score}</dd></div>
            <div><dt>Terbesar</dt><dd id="fruit-largest">${fruitSpecs[game.largestKind].name}</dd></div>
          </dl>
          <div class="fruit-next">
            <strong>Buah berikutnya</strong>
            <canvas id="fruit-preview" width="210" height="82" aria-label="Tiga buah berikutnya"></canvas>
          </div>
          <div class="fruit-actions">
            <button class="button button-primary" id="drop-fruit" type="button">Jatuhkan buah</button>
            <button class="button button-secondary" data-restart-fruit type="button">Ulang game</button>
          </div>
          <div class="fruit-rule">
            <strong>Cara bermain</strong>
            <p>Tekan dan tahan buah, geser ke posisi yang kamu mau, lalu lepaskan untuk menjatuhkannya. Tumpukan yang melewati garis merah akan mengakhiri permainan.</p>
          </div>
          <p class="fruit-session-note">Skor tersimpan jika kamu sudah masuk.</p>
        </aside>
        <section class="fruit-board-wrap" aria-label="Area permainan Fruit Merge">
          <canvas id="fruit-canvas" class="fruit-canvas" width="${FRUIT_BOARD_WIDTH}" height="${FRUIT_BOARD_HEIGHT}" tabindex="0" role="button" aria-label="Papan Fruit Merge. Tekan dan tahan untuk menggeser buah, lalu lepaskan untuk menjatuhkan. Gunakan tombol kiri dan kanan serta Enter jika memakai keyboard."></canvas>
          <div class="fruit-result" id="fruit-result" role="dialog" aria-modal="true" aria-labelledby="fruit-result-title" hidden>
            <p class="step-label">Wadah penuh</p>
            <h2 id="fruit-result-title">Skor <span id="fruit-final-score">0</span></h2>
            <p>Mulai lagi dan sisakan ruang untuk buah yang lebih besar.</p>
            <button class="button button-primary" data-restart-fruit type="button">Main lagi</button>
          </div>
        </section>
      </section>
    </main>`
}

export function drawFruitBoard(context: CanvasRenderingContext2D, game: FruitMergeGame) {
  const background = context.createLinearGradient(0, 0, 0, FRUIT_BOARD_HEIGHT)
  background.addColorStop(0, '#fbf6e7')
  background.addColorStop(1, '#efe2c5')
  context.clearRect(0, 0, FRUIT_BOARD_WIDTH, FRUIT_BOARD_HEIGHT)
  context.fillStyle = background
  context.fillRect(0, 0, FRUIT_BOARD_WIDTH, FRUIT_BOARD_HEIGHT)

  context.save()
  context.strokeStyle = 'rgba(19, 48, 35, .1)'
  context.lineWidth = 1
  for (let y = 40; y < FRUIT_BOARD_HEIGHT; y += 40) {
    context.beginPath()
    context.moveTo(0, y + .5)
    context.lineTo(FRUIT_BOARD_WIDTH, y + .5)
    context.stroke()
  }
  context.restore()

  context.save()
  context.setLineDash([6, 8])
  context.strokeStyle = '#c84d4d'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, FRUIT_DANGER_Y)
  context.lineTo(FRUIT_BOARD_WIDTH, FRUIT_DANGER_Y)
  context.stroke()
  context.fillStyle = '#a33d3d'
  context.font = '800 12px Nunito, Segoe UI, sans-serif'
  context.fillText('BATAS', 12, FRUIT_DANGER_Y - 10)
  context.restore()

  const nextKind = game.nextKinds[0]
  const nextRadius = fruitSpecs[nextKind].radius
  const nextY = 30 + nextRadius
  context.save()
  context.setLineDash([3, 8])
  context.strokeStyle = 'rgba(16, 46, 32, .28)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(game.aimX, 14)
  context.lineTo(game.aimX, nextY - nextRadius - 10)
  context.moveTo(game.aimX, nextY + nextRadius + 10)
  context.lineTo(game.aimX, FRUIT_BOARD_HEIGHT)
  context.stroke()
  context.globalAlpha = game.dropCooldown > 0 ? .25 : .72
  drawFruitCharacter(context, nextKind, game.aimX, nextY, nextRadius, 0, 0)
  context.restore()

  for (const fruit of game.fruits) drawFruit(context, fruit)

  if (game.dangerProgress > 0) {
    context.save()
    context.fillStyle = `rgba(190, 55, 55, ${Math.min(.22, game.dangerProgress * .16)})`
    context.fillRect(0, 0, FRUIT_BOARD_WIDTH, FRUIT_DANGER_Y)
    context.restore()
  }
}

export function drawFruitPreview(context: CanvasRenderingContext2D, kinds: number[]) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  kinds.slice(0, 3).forEach((kind, index) => {
    const radius = index === 0 ? 28 : 21
    drawFruitCharacter(context, kind, 38 + index * 66, 42, radius, index === 0 ? 0 : -.08, 0)
  })
}

function drawFruit(context: CanvasRenderingContext2D, fruit: FruitBody) {
  const radius = fruitSpecs[fruit.kind].radius
  const scale = 1 + Math.sin((1 - fruit.pulse) * Math.PI) * fruit.pulse * .12
  drawFruitCharacter(context, fruit.kind, fruit.x, fruit.y, radius * scale, fruit.angle, fruit.vx)
}

function drawFruitCharacter(context: CanvasRenderingContext2D, kind: number, x: number, y: number, radius: number, angle: number, velocityX: number) {
  const spec = fruitSpecs[kind]
  context.save()
  context.translate(x, y)
  context.rotate(angle)

  context.save()
  context.translate(0, radius * .76)
  context.scale(1, .28)
  context.fillStyle = 'rgba(33, 57, 43, .2)'
  context.beginPath()
  context.arc(0, 0, radius * .78, 0, Math.PI * 2)
  context.fill()
  context.restore()

  const fill = context.createRadialGradient(-radius * .34, -radius * .38, radius * .08, 0, 0, radius)
  fill.addColorStop(0, lighten(spec.color))
  fill.addColorStop(.62, spec.color)
  fill.addColorStop(1, spec.shade)
  context.shadowColor = 'rgba(25, 50, 36, .2)'
  context.shadowBlur = Math.max(4, radius * .12)
  context.shadowOffsetY = Math.max(2, radius * .08)
  context.fillStyle = fill
  context.beginPath()
  context.arc(0, 0, radius * .94, 0, Math.PI * 2)
  context.fill()
  context.shadowColor = 'transparent'

  drawFruitDetail(context, kind, radius)

  if (![0, 1].includes(kind)) {
    context.save()
    context.translate(radius * .08, -radius * .84)
    context.rotate(-.34 + velocityX * .0005)
    context.fillStyle = '#2e7c49'
    context.beginPath()
    context.ellipse(radius * .12, 0, radius * .3, radius * .14, 0, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = '#215b38'
    context.lineWidth = Math.max(1.5, radius * .045)
    context.beginPath()
    context.moveTo(-radius * .05, radius * .02)
    context.lineTo(-radius * .12, -radius * .24)
    context.stroke()
    context.restore()
  }

  const eyeY = -radius * .08
  const eyeGap = radius * .3
  const eyeRadius = Math.max(2.2, radius * .075)
  context.fillStyle = '#173025'
  for (const eyeX of [-eyeGap, eyeGap]) {
    context.beginPath()
    context.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#fff'
    context.beginPath()
    context.arc(eyeX - eyeRadius * .25, eyeY - eyeRadius * .3, eyeRadius * .28, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#173025'
  }

  context.globalAlpha = .68
  context.fillStyle = spec.cheek
  context.beginPath()
  context.ellipse(-radius * .48, radius * .18, radius * .13, radius * .08, -.1, 0, Math.PI * 2)
  context.ellipse(radius * .48, radius * .18, radius * .13, radius * .08, .1, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  context.strokeStyle = '#173025'
  context.lineWidth = Math.max(1.5, radius * .045)
  context.lineCap = 'round'
  context.beginPath()
  context.arc(0, radius * .1, radius * .18, .15, Math.PI - .15)
  context.stroke()

  context.restore()
}

function drawFruitDetail(context: CanvasRenderingContext2D, kind: number, radius: number) {
  context.save()
  if (kind === 0) {
    context.fillStyle = '#4d9a58'
    for (let index = 0; index < 3; index += 1) {
      context.save()
      context.rotate((index - 1) * .6)
      context.beginPath()
      context.ellipse(0, -radius * .75, radius * .2, radius * .08, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }
  } else if (kind === 1) {
    context.strokeStyle = '#b9c3ff'
    context.lineWidth = Math.max(1, radius * .06)
    context.beginPath()
    context.arc(0, -radius * .68, radius * .18, 0, Math.PI * 2)
    context.stroke()
  } else if (kind === 2 || kind === 3) {
    context.fillStyle = 'rgba(255,255,255,.22)'
    for (const [dx, dy] of [[-.42, -.38], [.38, -.3], [-.52, .32], [.48, .38]]) {
      context.beginPath()
      context.arc(radius * dx, radius * dy, Math.max(1.2, radius * .035), 0, Math.PI * 2)
      context.fill()
    }
  } else if (kind >= 7) {
    context.strokeStyle = 'rgba(22, 91, 54, .45)'
    context.lineWidth = Math.max(2, radius * .045)
    for (const offset of [-.45, 0, .45]) {
      context.beginPath()
      context.arc(radius * offset, 0, radius * .76, -1.15, 1.15)
      context.stroke()
    }
  }
  context.restore()
}

function lighten(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = Math.min(255, (value >> 16) + 48)
  const green = Math.min(255, ((value >> 8) & 255) + 48)
  const blue = Math.min(255, (value & 255) + 48)
  return `rgb(${red}, ${green}, ${blue})`
}

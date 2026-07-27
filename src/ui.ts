export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'})[character]!)
}

type AdWindow = {adsbygoogle?: {push(value: unknown): unknown}}

export function requestAdSafely(adWindow: object) {
  const target = adWindow as AdWindow
  try {
    const queue = target.adsbygoogle ?? (target.adsbygoogle = [] as unknown[])
    queue.push({})
  } catch {
    // Iklan pihak ketiga tidak boleh menghentikan interaksi game.
  }
}

export function initial(name: string) {
  return escapeHtml(name.trim().charAt(0).toUpperCase() || '?')
}

export function logoMark() {
  return `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="5" width="13" height="13" rx="4"/><rect x="22" y="5" width="13" height="13" rx="4"/><rect x="5" y="22" width="13" height="13" rx="4"/><path d="M28.5 22v13M22 28.5h13"/></svg>`
}

export function dieView(value: number | null, index = 0, animate = false) {
  if (value === null) return `<span class="die die-empty" aria-label="Dadu belum dilempar">-</span>`

  const rotations: Record<number, [number, number]> = {
    1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180],
  }
  const [rotateX, rotateY] = rotations[value]
  return `<span class="die-scene ${animate ? 'is-rolling' : ''} die-${index + 1}" aria-label="Hasil dadu: ${value}"><span class="die-cube" style="--die-rx:${rotateX}deg;--die-ry:${rotateY}deg" aria-hidden="true">${dieFace(1, 'front')}${dieFace(2, 'right')}${dieFace(3, 'top')}${dieFace(4, 'bottom')}${dieFace(5, 'left')}${dieFace(6, 'back')}</span></span>`
}

function dieFace(value: number, side: string) {
  const pips: Record<number, number[]> = {
    1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
  }
  return `<span class="die-face face-${side}">${pips[value].map((position) => `<i class="pip pip-${position}"></i>`).join('')}</span>`
}

export function copyIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`
}

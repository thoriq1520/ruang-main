class BlockAudio {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  playPlace() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  playCombo(combo: number) {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Escalating pitch based on combo count
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5, E5, G5, C6, E6
    const baseIndex = Math.min(Math.max(0, combo - 1), freqs.length - 1)
    const baseFreq = freqs[baseIndex]

    const chord = combo > 1 ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5] : [440, 554.37]

    chord.forEach((freq, index) => {
      const startTime = now + index * 0.05
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = combo > 1 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, startTime + 0.15)

      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.15)
    })
  }

  playPerfect() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Celebratory ascending major arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.06
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.35, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  }

  playGameOver() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Descending game over sound
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.6)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.6)
  }
}

export const blockAudio = new BlockAudio()

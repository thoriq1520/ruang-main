export type GameController = {
  readonly active: boolean
  snapshot(): unknown
  start(): void
  render(): void
  reset(): void
}

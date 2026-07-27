export type GameController = {
  readonly active: boolean
  start(): void
  render(): void
  reset(): void
}

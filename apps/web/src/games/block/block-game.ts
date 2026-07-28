export const BLOCK_BOARD_SIZE = 8

export const blockColors = ['#e5574f', '#e49f2f', '#4ea86c', '#3c84c6', '#7968c9', '#d45f9d', '#35a4a7'] as const

export type BlockCell = {row: number; column: number}

export type BlockPiece = {
  id: number
  cells: BlockCell[]
  color: string
}

export type BlockPlacement = {
  points: number
  clearedCells: Array<BlockCell & {color: string}>
  combo: number
  perfect: boolean
}

export type BlockGameStatus = 'playing' | 'over'

const shapes: BlockCell[][] = [
  [{row: 0, column: 0}],
  [{row: 0, column: 0}, {row: 0, column: 1}],
  [{row: 0, column: 0}, {row: 0, column: 1}, {row: 0, column: 2}],
  [{row: 0, column: 0}, {row: 1, column: 0}, {row: 2, column: 0}],
  [{row: 0, column: 0}, {row: 0, column: 1}, {row: 1, column: 0}],
  [{row: 0, column: 0}, {row: 0, column: 1}, {row: 1, column: 0}, {row: 1, column: 1}],
  [{row: 0, column: 0}, {row: 1, column: 0}, {row: 2, column: 0}, {row: 2, column: 1}],
  [{row: 0, column: 0}, {row: 0, column: 1}, {row: 0, column: 2}, {row: 1, column: 1}],
  [{row: 0, column: 1}, {row: 0, column: 2}, {row: 1, column: 0}, {row: 1, column: 1}],
  [{row: 0, column: 0}, {row: 0, column: 1}, {row: 0, column: 2}, {row: 0, column: 3}],
  [{row: 0, column: 0}, {row: 1, column: 0}, {row: 2, column: 0}, {row: 3, column: 0}],
  [
    {row: 0, column: 0}, {row: 0, column: 1}, {row: 0, column: 2},
    {row: 1, column: 0}, {row: 1, column: 1}, {row: 1, column: 2},
    {row: 2, column: 0}, {row: 2, column: 1}, {row: 2, column: 2},
  ],
]

export function blockPieceSize(piece: BlockPiece) {
  return {
    rows: Math.max(...piece.cells.map((cell) => cell.row)) + 1,
    columns: Math.max(...piece.cells.map((cell) => cell.column)) + 1,
  }
}

export class BlockBlastGame {
  board: Array<Array<string | null>> = Array.from({length: BLOCK_BOARD_SIZE}, () => Array(BLOCK_BOARD_SIZE).fill(null))
  pieces: Array<BlockPiece | null> = []
  score = 0
  linesCleared = 0
  combo = 0
  status: BlockGameStatus = 'playing'
  private nextId = 1
  private lastClearAt = -Infinity
  private readonly random: () => number
  private readonly now: () => number

  constructor(random: () => number = Math.random, now: () => number = Date.now) {
    this.random = random
    this.now = now
    this.seedInitialBoard()
    this.refillPieces()
  }

  canPlace(pieceIndex: number, row: number, column: number) {
    const piece = this.pieces[pieceIndex]
    return Boolean(piece?.cells.every((cell) => {
      const targetRow = row + cell.row
      const targetColumn = column + cell.column
      return targetRow >= 0 && targetRow < BLOCK_BOARD_SIZE
        && targetColumn >= 0 && targetColumn < BLOCK_BOARD_SIZE
        && this.board[targetRow][targetColumn] === null
    }))
  }

  place(pieceIndex: number, row: number, column: number) {
    if (this.status !== 'playing' || !this.canPlace(pieceIndex, row, column)) return false
    const scoreBefore = this.score
    const piece = this.pieces[pieceIndex]!
    for (const cell of piece.cells) this.board[row + cell.row][column + cell.column] = piece.color
    this.score += piece.cells.length * 10
    this.pieces[pieceIndex] = null
    const clearedCells = this.clearCompletedLines()
    if (this.pieces.every((item) => item === null)) this.refillPieces()
    if (!this.hasMove()) this.status = 'over'
    return {
      points: this.score - scoreBefore,
      clearedCells,
      combo: clearedCells.length ? this.combo : 0,
      perfect: Boolean(clearedCells.length) && this.board.every((boardRow) => boardRow.every((cell) => cell === null)),
    } satisfies BlockPlacement
  }

  private clearCompletedLines() {
    const rows = Array.from({length: BLOCK_BOARD_SIZE}, (_, row) => row).filter((row) => this.board[row].every(Boolean))
    const columns = Array.from({length: BLOCK_BOARD_SIZE}, (_, column) => column).filter((column) => this.board.every((row) => row[column]))
    const cleared = rows.length + columns.length
    if (!cleared) return []
    const cells = new Map<string, BlockCell & {color: string}>()
    for (const row of rows) for (let column = 0; column < BLOCK_BOARD_SIZE; column += 1) cells.set(`${row}:${column}`, {row, column, color: this.board[row][column]!})
    for (const column of columns) for (let row = 0; row < BLOCK_BOARD_SIZE; row += 1) cells.set(`${row}:${column}`, {row, column, color: this.board[row][column]!})
    for (const row of rows) this.board[row].fill(null)
    for (const column of columns) for (const row of this.board) row[column] = null
    const now = this.now()
    this.combo = now - this.lastClearAt <= 3_000 ? this.combo + 1 : 1
    this.lastClearAt = now
    this.linesCleared += cleared
    this.score += cleared * 100 + Math.max(0, this.combo - 1) * 50
    return [...cells.values()]
  }

  expireCombo() {
    if (this.now() - this.lastClearAt >= 3_000) this.combo = 0
  }

  private hasMove() {
    return this.pieces.some((piece, pieceIndex) => piece && this.board.some((_, row) => this.board[row].some((__, column) => this.canPlace(pieceIndex, row, column))))
  }

  private refillPieces() {
    const availableColors = [...blockColors]
    this.pieces = Array.from({length: 3}, () => {
      const shape = shapes[this.randomIndex(shapes.length)]
      const colorIndex = this.randomIndex(availableColors.length)
      return {id: this.nextId++, cells: shape.map((cell) => ({...cell})), color: availableColors.splice(colorIndex, 1)[0] ?? blockColors[this.randomIndex(blockColors.length)]}
    })
  }

  private seedInitialBoard() {
    const starterCells: BlockCell[] = [
      {row: 7, column: 0}, {row: 7, column: 1}, {row: 7, column: 2}, {row: 7, column: 5}, {row: 7, column: 6},
      {row: 6, column: 0}, {row: 6, column: 2}, {row: 6, column: 5}, {row: 6, column: 7},
      {row: 5, column: 0}, {row: 5, column: 1}, {row: 5, column: 6}, {row: 5, column: 7},
      {row: 1, column: 0}, {row: 1, column: 7}, {row: 0, column: 0}, {row: 0, column: 7},
      {row: 4, column: 0}, {row: 4, column: 7},
    ]
    const count = 14 + this.randomIndex(6)
    const offset = this.randomIndex(starterCells.length)
    for (let index = 0; index < count; index += 1) {
      const cell = starterCells[(index + offset) % starterCells.length]
      this.board[cell.row][cell.column] = blockColors[this.randomIndex(blockColors.length)]
    }
  }

  private randomIndex(length: number) {
    return Math.min(length - 1, Math.floor(this.random() * length))
  }
}

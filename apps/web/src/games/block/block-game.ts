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

export type BlockGameSave = {
  version: 1
  elapsedMs: number
  game: {
    board: Array<Array<string | null>>
    pieces: Array<BlockPiece | null>
    score: number
    linesCleared: number
    combo: number
    comboRemainingMs: number
    nextId: number
    clearedInTray: boolean
    dryTrays: number
  }
}

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

type OpeningLine = {row: number; gaps: number[]} | {column: number; gaps: number[]}

const openingTemplates: OpeningLine[][] = [
  [{row: 7, gaps: [0]}, {row: 6, gaps: [2, 3]}, {row: 5, gaps: [5, 6, 7]}],
  [{row: 0, gaps: [7]}, {row: 2, gaps: [0, 1]}, {row: 4, gaps: [3, 4, 5]}],
  [{column: 0, gaps: [7]}, {column: 2, gaps: [4, 5]}, {column: 7, gaps: [0, 1, 2]}],
  [{column: 7, gaps: [3]}, {column: 5, gaps: [6, 7]}, {column: 1, gaps: [2, 3, 4]}],
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
  private clearedInTray = false
  private dryTrays = 0
  private readonly random: () => number
  private readonly now: () => number

  constructor(random: () => number = Math.random, now: () => number = Date.now) {
    this.random = random
    this.now = now
    this.seedOpening()
  }

  toSave(elapsedMs: number): BlockGameSave {
    return {
      version: 1,
      elapsedMs: Math.max(0, Math.round(elapsedMs)),
      game: {
        board: this.board.map((row) => [...row]),
        pieces: this.pieces.map((piece) => piece ? {...piece, cells: piece.cells.map((cell) => ({...cell}))} : null),
        score: this.score,
        linesCleared: this.linesCleared,
        combo: this.combo,
        comboRemainingMs: this.combo ? Math.max(0, 3_000 - (this.now() - this.lastClearAt)) : 0,
        nextId: this.nextId,
        clearedInTray: this.clearedInTray,
        dryTrays: this.dryTrays,
      },
    }
  }

  static fromSave(value: unknown, random: () => number = Math.random, now: () => number = Date.now) {
    if (!value || typeof value !== 'object') return null
    const save = value as Partial<BlockGameSave>
    const state = save.game
    const integer = (number: unknown, minimum = 0) => Number.isInteger(number) && Number(number) >= minimum
    const validCell = (cell: BlockCell) => integer(cell.row) && cell.row < BLOCK_BOARD_SIZE && integer(cell.column) && cell.column < BLOCK_BOARD_SIZE
    if (save.version !== 1 || typeof save.elapsedMs !== 'number' || !Number.isFinite(save.elapsedMs) || !state) return null
    if (!Array.isArray(state.board) || state.board.length !== BLOCK_BOARD_SIZE || !state.board.every((row) => Array.isArray(row) && row.length === BLOCK_BOARD_SIZE && row.every((cell) => cell === null || typeof cell === 'string'))) return null
    if (!Array.isArray(state.pieces) || state.pieces.length !== 3 || !state.pieces.every((piece) => piece === null || (integer(piece.id, 1) && typeof piece.color === 'string' && Array.isArray(piece.cells) && piece.cells.length > 0 && piece.cells.every(validCell)))) return null
    if (![state.score, state.linesCleared, state.combo, state.nextId, state.dryTrays].every((number) => integer(number)) || typeof state.comboRemainingMs !== 'number') return null
    if (typeof state.clearedInTray !== 'boolean') return null

    const game = new BlockBlastGame(random, now)
    game.board = state.board.map((row) => [...row])
    game.pieces = state.pieces.map((piece) => piece ? {...piece, cells: piece.cells.map((cell) => ({...cell}))} : null)
    game.score = state.score
    game.linesCleared = state.linesCleared
    game.combo = state.combo
    game.nextId = state.nextId
    game.clearedInTray = state.clearedInTray
    game.dryTrays = state.dryTrays
    const remaining = Math.max(0, Math.min(3_000, state.comboRemainingMs))
    game.lastClearAt = remaining ? now() - (3_000 - remaining) : -Infinity
    if (!game.hasMove()) return null
    return {game, elapsedMs: Math.max(0, save.elapsedMs)}
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
    if (clearedCells.length) this.clearedInTray = true
    if (this.pieces.every((item) => item === null)) {
      this.dryTrays = this.clearedInTray ? 0 : this.dryTrays + 1
      this.refillPieces(this.dryTrays >= 3)
      this.clearedInTray = false
    }
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

  private refillPieces(rescue = false) {
    const availableColors = [...blockColors]
    this.pieces = Array.from({length: 3}, (_, index) => {
      const shape = rescue && index === 0 ? shapes[0] : shapes[this.randomIndex(shapes.length)]
      const colorIndex = this.randomIndex(availableColors.length)
      return {id: this.nextId++, cells: shape.map((cell) => ({...cell})), color: availableColors.splice(colorIndex, 1)[0] ?? blockColors[this.randomIndex(blockColors.length)]}
    })
  }

  private seedOpening() {
    const template = openingTemplates[this.randomIndex(openingTemplates.length)]
    const availableColors = [...blockColors]
    for (const line of template) {
      for (let position = 0; position < BLOCK_BOARD_SIZE; position += 1) {
        if (line.gaps.includes(position)) continue
        const row = 'row' in line ? line.row : position
        const column = 'column' in line ? line.column : position
        this.board[row][column] = blockColors[this.randomIndex(blockColors.length)]
      }
    }
    this.pieces = template.map((line) => {
      const colorIndex = this.randomIndex(availableColors.length)
      const cells = line.gaps.map((_, index) => 'row' in line ? {row: 0, column: index} : {row: index, column: 0})
      return {id: this.nextId++, cells, color: availableColors.splice(colorIndex, 1)[0] ?? blockColors[0]}
    })
  }

  private randomIndex(length: number) {
    return Math.min(length - 1, Math.floor(this.random() * length))
  }
}

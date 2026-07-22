import type {RoomGameId} from '../network/network'

export type GameId = RoomGameId | 'arrow-puzzle'

export type GameCatalogItem = {
  id: GameId
  name: string
  playerLabel: string
  genre: string
  description: string
  mode: 'online' | 'solo'
}

export const gameCatalog: readonly GameCatalogItem[] = [
  {
    id: 'monopoly',
    name: 'Kota Raya',
    playerLabel: '2-6',
    genre: 'Strategi papan',
    description: 'Kuasai aset kota bersama 2-6 pemain. Buat room baru atau masuk dengan kode teman.',
    mode: 'online',
  },
  {
    id: 'snakes-ladders',
    name: 'Ular Tangga',
    playerLabel: '2-4',
    genre: 'Balapan papan',
    description: 'Pilih satu dari empat peta, lempar dadu, dan jadilah pemain pertama yang mencapai petak 100.',
    mode: 'online',
  },
  {
    id: 'ludo',
    name: 'Ludo',
    playerLabel: '2-4',
    genre: 'Balapan klasik',
    description: 'Pilih warna, keluarkan empat pion, dan balapkan semuanya pulang di satu papan klasik.',
    mode: 'online',
  },
  {
    id: 'arrow-puzzle',
    name: 'Arrow Puzzle',
    playerLabel: 'SOLO',
    genre: 'Puzzle logika',
    description: 'Lepaskan semua panah dari papan. Panah hanya dapat bergerak jika jalurnya benar-benar kosong.',
    mode: 'solo',
  },
] as const

export function gameById(id: GameId) {
  return gameCatalog.find((game) => game.id === id) ?? gameCatalog[0]
}

export function gameCard(item: GameCatalogItem, selected: boolean) {
  const visual = item.id === 'monopoly'
    ? '<span class="game-card-board" aria-hidden="true"><i></i><i></i><b>KR</b><i></i><i></i></span>'
    : item.id === 'snakes-ladders'
      ? '<span class="game-card-snakes" aria-hidden="true"><i></i><b>100</b><i></i></span>'
      : item.id === 'ludo'
        ? '<span class="game-card-ludo-board" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></span>'
        : '<span class="game-card-arrows" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M78 78H34V48H66V22H36"/><path d="m45 12-12 10 12 10"/></svg></span>'

  return `<button class="game-card game-card-option game-card-${item.id} ${selected ? 'is-selected' : ''}" type="button" data-select-game="${item.id}" aria-label="Pilih game ${item.name}" aria-pressed="${selected}">
    <span class="game-card-top"><small>${item.mode === 'solo' ? 'Main sendiri' : 'Room privat'}</small><i>${item.playerLabel}</i></span>
    ${visual}
    <strong>${item.name}</strong>
    <small>${item.genre}</small>
  </button>`
}

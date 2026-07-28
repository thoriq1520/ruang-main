import type {RoomGameId} from '../network/network'

export type GameId = RoomGameId | 'arrow-puzzle' | 'fruit-merge'

export type GameCatalogItem = {
  id: GameId
  slug: string
  name: string
  playerLabel: string
  genre: string
  description: string
  mode: 'online' | 'solo'
  seoTitle: string
  seoDescription: string
  guide: Array<{
    heading: string
    paragraphs: string[]
    bullets: string[]
  }>
}

export const gameCatalog: readonly GameCatalogItem[] = [
  {
    id: 'monopoly',
    slug: 'kota-raya',
    name: 'Kota Raya',
    playerLabel: '2-6',
    genre: 'Strategi papan',
    description: 'Kuasai aset kota bersama 2-6 pemain. Buat room baru atau masuk dengan kode teman.',
    mode: 'online',
    seoTitle: 'Main Kota Raya Online Gratis | Ruang Main',
    seoDescription: 'Main Kota Raya online gratis bersama 2-6 pemain. Beli aset, bangun rumah dan hotel, lalu kuasai satu kota langsung dari browser.',
    guide: [
      {
        heading: 'Cara bermain Kota Raya',
        paragraphs: ['Buat room, undang pemain dengan kode, lalu lempar dua dadu secara bergiliran untuk mengelilingi papan.'],
        bullets: ['Beli aset yang belum dimiliki', 'Bayar sewa ketika berhenti di aset lawan', 'Lengkapi satu kelompok warna untuk membangun', 'Pemain terakhir yang tidak bangkrut menang'],
      },
      {
        heading: 'Room sementara tanpa akun',
        paragraphs: ['Permainan berjalan peer to peer dan tidak disimpan. Jangan refresh atau menutup tab selama sesi berlangsung.'],
        bullets: ['Untuk 2-6 pemain', 'Kode room privat', 'Tanpa registrasi', 'Progres hanya selama sesi'],
      },
    ],
  },
  {
    id: 'snakes-ladders',
    slug: 'ular-tangga',
    name: 'Ular Tangga',
    playerLabel: '2-4',
    genre: 'Balapan papan',
    description: 'Pilih satu dari empat peta, lempar dadu, dan jadilah pemain pertama yang mencapai petak 100.',
    mode: 'online',
    seoTitle: 'Main Ular Tangga Online Gratis | Ruang Main',
    seoDescription: 'Main Ular Tangga online gratis bersama 2-4 pemain dengan empat pilihan peta, dadu 3D, dan room privat langsung dari browser.',
    guide: [
      {
        heading: 'Cara bermain Ular Tangga',
        paragraphs: ['Pilih tema papan, lempar dadu saat giliranmu, dan bergerak hingga mencapai petak terakhir lebih dulu.'],
        bullets: ['Tangga membawa pion naik', 'Ular menurunkan pion', 'Giliran berpindah setelah gerakan selesai', 'Pemain pertama di petak 100 menang'],
      },
      {
        heading: 'Empat tema papan',
        paragraphs: ['Host memilih satu dari empat peta sebelum permainan dimulai. Aturan tetap sama pada setiap tema.'],
        bullets: ['Untuk 2-4 pemain', 'Dadu dan pion beranimasi', 'Room privat', 'Tidak perlu akun'],
      },
    ],
  },
  {
    id: 'ludo',
    slug: 'ludo',
    name: 'Ludo',
    playerLabel: '2-4',
    genre: 'Balapan klasik',
    description: 'Pilih warna, keluarkan empat pion, dan balapkan semuanya pulang di satu papan klasik.',
    mode: 'online',
    seoTitle: 'Main Ludo Online Gratis | Ruang Main',
    seoDescription: 'Main Ludo online gratis bersama 2-4 pemain. Pilih warna, keluarkan empat pion, dan bawa semuanya pulang langsung dari browser.',
    guide: [
      {
        heading: 'Cara bermain Ludo',
        paragraphs: ['Setiap pemain memilih warna dan berusaha membawa empat pion dari markas menuju jalur pulang.'],
        bullets: ['Dapatkan angka enam untuk mengeluarkan pion', 'Pilih pion yang dapat bergerak', 'Tangkap pion lawan di petak biasa', 'Bawa semua pion ke rumah untuk menang'],
      },
      {
        heading: 'Satu papan, empat warna',
        paragraphs: ['Ludo Ruang Main memakai satu papan klasik untuk maksimal empat pemain dalam room privat.'],
        bullets: ['Untuk 2-4 pemain', 'Pilihan warna pemain', 'Dadu 3D', 'State hanya tersimpan selama sesi'],
      },
    ],
  },
  {
    id: 'arrow-puzzle',
    slug: 'arrow-puzzle',
    name: 'Arrow Puzzle',
    playerLabel: 'SOLO',
    genre: 'Puzzle logika',
    description: 'Lepaskan semua panah dari papan. Panah hanya dapat bergerak jika jalurnya benar-benar kosong.',
    mode: 'solo',
    seoTitle: 'Main Arrow Puzzle Gratis | Ruang Main',
    seoDescription: 'Main Arrow Puzzle gratis di browser. Cari urutan yang tepat untuk melepaskan semua panah dari pola yang padat tanpa membuat jalurnya bertabrakan.',
    guide: [
      {
        heading: 'Cara bermain Arrow Puzzle',
        paragraphs: ['Klik satu panah untuk melepaskannya ke arah ujung panah. Panah hanya dapat keluar jika seluruh jalurnya kosong.'],
        bullets: ['Amati arah dan jalur setiap panah', 'Lepaskan panah terluar lebih dulu', 'Gunakan petunjuk jika buntu', 'Bersihkan papan untuk lanjut ke level berikutnya'],
      },
      {
        heading: 'Level terus berubah',
        paragraphs: ['Pola dihasilkan untuk memberi susunan dan tingkat kesulitan yang berbeda. Posisi level kembali ke awal setelah halaman dimuat ulang, sedangkan hasil dapat dicatat dengan akun opsional.'],
        bullets: ['Permainan solo', 'Login opsional', 'Riwayat dan peringkat', 'Dapat dimainkan di desktop dan mobile'],
      },
    ],
  },
  {
    id: 'fruit-merge',
    slug: 'fruit-merge',
    name: 'Fruit Merge',
    playerLabel: 'SOLO',
    genre: 'Puzzle physics',
    description: 'Jatuhkan dan gabungkan buah sejenis sampai menjadi semangka tanpa melewati batas wadah.',
    mode: 'solo',
    seoTitle: 'Main Fruit Merge Gratis | Ruang Main',
    seoDescription: 'Main Fruit Merge gratis di browser. Jatuhkan buah, gabungkan pasangan sejenis, kumpulkan skor, dan jaga tumpukan tetap di dalam wadah.',
    guide: [
      {
        heading: 'Cara bermain Fruit Merge',
        paragraphs: ['Arahkan buah ke posisi yang diinginkan, lalu jatuhkan ke dalam wadah. Dua buah sejenis akan bergabung menjadi buah berikutnya.'],
        bullets: ['Rencanakan posisi sebelum menjatuhkan', 'Satukan buah dengan jenis yang sama', 'Buat ruang untuk buah berukuran besar', 'Kejar skor setinggi mungkin'],
      },
      {
        heading: 'Tumpukan tidak boleh melewati batas',
        paragraphs: ['Permainan selesai jika buah yang sudah tenang bertahan di atas garis batas. Posisi permainan tidak dipulihkan setelah refresh, tetapi skor dapat dicatat dengan akun opsional.'],
        bullets: ['Permainan solo', 'Physics berjalan langsung di browser', 'Login opsional', 'Riwayat dan peringkat'],
      },
    ],
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
        : item.id === 'arrow-puzzle'
          ? '<span class="game-card-arrows" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M78 78H34V48H66V22H36"/><path d="m45 12-12 10 12 10"/></svg></span>'
          : '<span class="game-card-fruit" aria-hidden="true"><i></i><i></i><i></i><b></b></span>'

  return `<button class="game-card game-card-option game-card-${item.id} ${selected ? 'is-selected' : ''}" type="button" data-select-game="${item.id}" aria-label="Pilih game ${item.name}" aria-pressed="${selected}">
    <span class="game-card-top"><small>${item.mode === 'solo' ? 'Main sendiri' : 'Room privat'}</small><i>${item.playerLabel}</i></span>
    ${visual}
    <strong>${item.name}</strong>
    <small>${item.genre}</small>
  </button>`
}

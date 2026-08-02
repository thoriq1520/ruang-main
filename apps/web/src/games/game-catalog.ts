import type {RoomGameId} from '../network/network'

export type GameId = RoomGameId

export type GameCatalogItem = {
  id: GameId
  slug: string
  name: string
  playerLabel: string
  genre: string
  description: string
  mode: 'online' | 'solo'
  roomEnabled?: boolean
  coverImage?: string
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
    coverImage: '/game-guides/kota-raya.webp',
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
      {
        heading: 'Lelang, trade, dan hipotek',
        paragraphs: ['Kota Raya tidak hanya bergantung pada lemparan dadu. Keputusan membeli, melelang, menukar aset, dan menjaga uang tunai menentukan siapa yang mampu bertahan.'],
        bullets: ['Aset yang dilewati tanpa dibeli masuk ke lelang', 'Bangunan harus ditambah dan dijual secara merata dalam satu kelompok warna', 'Aset yang dihipotek tidak menghasilkan sewa', 'Trade dapat memindahkan uang, aset, dan kartu bebas penjara'],
      },
      {
        heading: 'Menjaga room tetap berjalan',
        paragraphs: ['Host menyimpan state resmi selama permainan. Semua pemain sebaiknya tetap membuka tab sampai pemenang ditentukan karena sesi tidak dipulihkan setelah host keluar.'],
        bullets: ['Bagikan kode hanya kepada pemain yang diundang', 'Gunakan koneksi yang stabil', 'Hindari refresh saat giliran berlangsung', 'Selesaikan utang atau kartu sebelum menunggu giliran berikutnya'],
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
    coverImage: '/game-guides/ular-tangga.webp',
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
      {
        heading: 'Membaca papan sebelum bergerak',
        paragraphs: ['Setiap peta menempatkan ular dan tangga pada petak yang berbeda. Lihat jalur di depan pion agar perubahan posisi setelah lemparan tidak mengejutkan.'],
        bullets: ['Tangga langsung memindahkan pion ke ujung atas', 'Ular langsung memindahkan pion ke ekor', 'Pion harus mendarat tepat di petak 100', 'Pilihan peta tidak mengubah urutan giliran'],
      },
      {
        heading: 'Giliran dan koneksi room',
        paragraphs: ['Hanya pemain aktif yang dapat melempar dadu. Setelah gerakan dan efek papan selesai, giliran berpindah otomatis kepada pemain berikutnya.'],
        bullets: ['Host memilih peta sebelum mulai', 'Minimal dua pemain diperlukan', 'Nama pemain dibatasi 20 karakter', 'Sesi berakhir jika host menutup permainan'],
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
    coverImage: '/game-guides/ludo.webp',
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
      {
        heading: 'Pilih pion dengan aman',
        paragraphs: ['Angka enam membuka pion dari markas. Setelah itu, pilih antara mempercepat pion terdepan, membuka pion baru, atau mengejar pion lawan.'],
        bullets: ['Petak aman melindungi pion dari tangkapan', 'Pion lawan di petak biasa dapat dipulangkan ke markas', 'Angka enam atau tangkapan memberi giliran tambahan', 'Pion harus mencapai rumah dengan angka yang tepat'],
      },
      {
        heading: 'Sebelum host memulai',
        paragraphs: ['Setiap pemain wajib memilih warna yang belum dipakai. Host baru dapat memulai setelah minimal dua pemain sudah masuk dan seluruh warna sudah dipilih.'],
        bullets: ['Satu warna hanya untuk satu pemain', 'Empat pion tersedia untuk setiap warna', 'Room tidak memerlukan akun', 'Jangan refresh sampai balapan selesai'],
      },
    ],
  },
  {
    id: 'arrow-puzzle',
    slug: 'arrow-puzzle',
    name: 'Arrow Puzzle',
    playerLabel: '1+',
    genre: 'Puzzle logika',
    description: 'Lepaskan semua panah dari papan. Panah hanya dapat bergerak jika jalurnya benar-benar kosong.',
    mode: 'solo',
    coverImage: '/game-guides/arrow-puzzle.webp',
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
        paragraphs: ['Pola dihasilkan untuk memberi susunan dan tingkat kesulitan yang berbeda. Pemain login dapat melanjutkan level yang belum selesai dan mencatat hasilnya.'],
        bullets: ['Permainan solo', 'Login opsional', 'Riwayat dan peringkat', 'Dapat dimainkan di desktop dan mobile'],
      },
      {
        heading: 'Tiga nyawa untuk satu papan',
        paragraphs: ['Menekan panah yang masih terhalang mengurangi satu nyawa. Tiga kesalahan mengakhiri level, jadi periksa seluruh garis di depan ujung panah.'],
        bullets: ['Panah bebas keluar sampai melewati tepi papan', 'Panah terhalang tetap berada di tempatnya', 'Petunjuk menandai satu panah yang aman', 'Ulang level membuat susunan yang sama dari awal'],
      },
      {
        heading: 'Menyusun urutan pelepasan',
        paragraphs: ['Mulai dari panah yang kepalanya menghadap ruang kosong di tepi. Setiap panah yang keluar dapat membuka jalur baru di bagian tengah.'],
        bullets: ['Periksa kepala panah, bukan ekornya', 'Cari jalur lurus tanpa potongan panah lain', 'Gunakan petunjuk setelah pilihan aman sulit ditemukan', 'Selesaikan papan dengan kesalahan sesedikit mungkin'],
      },
    ],
  },
  {
    id: 'fruit-merge',
    slug: 'fruit-merge',
    name: 'Fruit Merge',
    playerLabel: '1+',
    genre: 'Puzzle physics',
    description: 'Jatuhkan dan gabungkan buah sejenis sampai menjadi semangka tanpa melewati batas wadah.',
    mode: 'solo',
    coverImage: '/game-guides/fruit-merge.webp',
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
        paragraphs: ['Permainan selesai jika buah yang sudah tenang bertahan di atas garis batas. Pemain login dapat melanjutkan tumpukan yang belum selesai dan mencatat skor.'],
        bullets: ['Permainan solo', 'Physics berjalan langsung di browser', 'Login opsional', 'Riwayat dan peringkat'],
      },
      {
        heading: 'Mengatur tumpukan buah',
        paragraphs: ['Buah besar sulit dipindahkan setelah tertutup buah kecil. Bangun tumpukan rendah dan sisakan jalur agar pasangan sejenis masih dapat bertemu.'],
        bullets: ['Letakkan buah besar dekat dasar wadah', 'Gunakan dinding untuk mengarahkan pantulan', 'Hindari kantong kecil yang memisahkan pasangan', 'Perhatikan tiga buah berikutnya sebelum memilih posisi'],
      },
      {
        heading: 'Kapan permainan selesai',
        paragraphs: ['Garis batas tidak langsung menghentikan permainan ketika buah masih memantul. Permainan berakhir jika buah yang sudah tenang tetap bertahan di atas batas.'],
        bullets: ['Tunggu gerakan selesai sebelum menjatuhkan lagi', 'Gabungan buah dapat membuka ruang baru', 'Semangka yang bertemu memberi bonus dan menghilang', 'Save tersedia untuk pemain yang masuk'],
      },
    ],
  },
  {
    id: 'fruit-slice',
    slug: 'tebas-buah',
    name: 'Tebas Buah',
    playerLabel: '1+',
    genre: 'Aksi refleks',
    description: 'Sapukan jari atau mouse untuk membelah buah, membuat combo, dan menghindari bom.',
    mode: 'solo',
    coverImage: '/game-guides/tebas-buah.webp',
    seoTitle: 'Main Tebas Buah Gratis | Ruang Main',
    seoDescription: 'Main Tebas Buah gratis di browser. Tebas buah dengan swipe, buat combo dalam satu sapuan, hindari bom, dan jaga tiga nyawa.',
    guide: [
      {
        heading: 'Cara bermain Tebas Buah',
        paragraphs: ['Tahan lalu sapukan jari atau mouse melewati buah yang terlontar. Setiap buah yang terbelah menambah skor.'],
        bullets: ['Tebas tiga buah atau lebih dalam satu sapuan untuk combo', 'Jangan menyentuh bom', 'Buah yang jatuh mengurangi satu nyawa', 'Permainan selesai setelah tiga buah terlewat'],
      },
      {
        heading: 'Tempo terus meningkat',
        paragraphs: ['Gelombang buah menjadi lebih ramai seiring skor bertambah. Pemain login dapat melanjutkan permainan yang belum selesai dan mencatat skor ke peringkat.'],
        bullets: ['Kontrol sentuh dan mouse', 'Tiga nyawa', 'Save game untuk akun', 'Peringkat skor solo'],
      },
      {
        heading: 'Sapuan pendek lebih aman',
        paragraphs: ['Sapuan panjang mudah mengenai bom yang baru muncul. Gunakan gerakan pendek dan terarah, lalu tunggu jalur aman sebelum mengejar combo berikutnya.'],
        bullets: ['Tahan pointer hanya ketika mulai menebas', 'Lepaskan setelah melewati kelompok buah', 'Hindari menyapu seluruh lebar papan tanpa melihat bom', 'Tiga buah dalam satu sapuan memulai bonus combo'],
      },
      {
        heading: 'Tiga nyawa dan satu bahaya',
        paragraphs: ['Buah yang jatuh tanpa tertebas mengurangi satu nyawa. Menyentuh bom mengakhiri permainan saat itu juga, berapa pun nyawa yang tersisa.'],
        bullets: ['Indikator nyawa selalu terlihat selama bermain', 'Kecepatan peluncuran bertambah bersama skor', 'Kontrol keyboard tersedia untuk elemen permainan yang dapat difokuskan', 'Hasil dapat masuk peringkat setelah sesi selesai'],
      },
    ],
  },
  {
    id: 'block-blast',
    slug: 'block-blast',
    name: 'Blok Brak',
    playerLabel: '1+',
    genre: 'Puzzle balok',
    description: 'Susun balok warna-warni, penuhi baris atau kolom, dan jaga papan tetap punya ruang.',
    mode: 'solo',
    coverImage: '/game-guides/block-blast.webp',
    seoTitle: 'Main Blok Brak Gratis | Ruang Main',
    seoDescription: 'Main Blok Brak gratis di browser. Tarik balok warna-warni ke papan 8x8, bersihkan baris dan kolom, buat combo, lalu kejar skor tertinggi.',
    guide: [
      {
        heading: 'Cara bermain Blok Brak',
        paragraphs: ['Pilih satu dari tiga bentuk balok dan letakkan di papan. Baris atau kolom yang terisi penuh akan langsung dibersihkan.'],
        bullets: ['Tarik balok atau pilih lalu ketuk papan', 'Susun tanpa menyisakan celah sempit', 'Bersihkan beberapa garis untuk membuat combo', 'Habiskan tiga balok untuk mendapat pilihan baru'],
      },
      {
        heading: 'Jaga ruang untuk bentuk berikutnya',
        paragraphs: ['Permainan selesai ketika semua balok yang tersisa tidak lagi muat. Pemain login dapat melanjutkan papan yang belum selesai dan mencatat skor.'],
        bullets: ['Papan 8x8', 'Warna balok bervariasi', 'Permainan solo', 'Riwayat dan peringkat opsional'],
      },
      {
        heading: 'Menjaga papan 8x8',
        paragraphs: ['Tiga bentuk harus dihabiskan sebelum pilihan baru muncul. Sisakan area lebar untuk balok besar dan hindari lubang tunggal yang sulit diisi.'],
        bullets: ['Baris dan kolom penuh dibersihkan bersamaan', 'Beberapa garis memberi skor lebih tinggi', 'Clear beruntun dalam waktu singkat meningkatkan combo', 'Papan kosong setelah clear memberi bonus Perfect'],
      },
      {
        heading: 'Kontrol sentuh dan mouse',
        paragraphs: ['Balok dapat ditarik langsung atau dipilih lalu ditempatkan pada petak tujuan. Bayangan penempatan menunjukkan posisi yang valid sebelum balok dilepas.'],
        bullets: ['Balok tidak dapat menimpa petak terisi', 'Ketuk di luar papan untuk membatalkan pilihan', 'Gunakan tampilan tegak pada ponsel agar papan lebih luas', 'Papan aktif dapat disimpan oleh pemain yang masuk'],
      },
    ],
  },
  {
    id: 'magic-bottles',
    slug: 'botol-warna',
    name: 'Botol Warna',
    playerLabel: '1+',
    genre: 'Puzzle warna',
    description: 'Tuang lapisan cairan antarbotol sampai setiap botol hanya berisi satu warna.',
    mode: 'solo',
    coverImage: '/game-guides/botol-warna.webp',
    seoTitle: 'Main Botol Warna Gratis | Ruang Main',
    seoDescription: 'Main puzzle Botol Warna gratis di browser. Pindahkan cairan antarbotol, kelompokkan warna yang sama, dan selesaikan 10 level tanpa instalasi.',
    guide: [
      {
        heading: 'Cara bermain Botol Warna',
        paragraphs: ['Pilih botol sumber lalu botol tujuan. Seluruh warna teratas yang sama akan dituang selama tujuan masih memiliki ruang.'],
        bullets: ['Tuang ke botol kosong atau warna yang sama', 'Gunakan dua botol kosong untuk mengatur ruang', 'Undo jika urutan tuangan kurang tepat', 'Rapikan semua warna untuk lanjut level'],
      },
      {
        heading: 'Sepuluh level dalam satu sesi',
        paragraphs: ['Jumlah warna bertambah bertahap. Pemain login dapat melanjutkan level yang belum selesai dan mencatat hasil sesi.'],
        bullets: ['Kontrol ketuk untuk mobile dan desktop', 'Level selalu dapat diselesaikan', 'Save game untuk akun', 'Peringkat berdasarkan efisiensi langkah'],
      },
      {
        heading: 'Membuka ruang untuk menuang',
        paragraphs: ['Botol kosong berfungsi sebagai ruang kerja sementara. Pindahkan satu kelompok warna teratas untuk membuka lapisan yang dibutuhkan di bawahnya.'],
        bullets: ['Satu tuangan memindahkan seluruh warna teratas yang muat', 'Tujuan harus kosong atau memiliki warna teratas yang sama', 'Jangan mengisi semua botol kosong terlalu cepat', 'Selesaikan warna yang sudah hampir terkumpul'],
      },
      {
        heading: 'Undo, ulang, dan efisiensi',
        paragraphs: ['Undo mengembalikan satu tuangan terakhir. Jika susunan terlalu terkunci, ulang level untuk kembali ke kondisi awal tanpa meninggalkan sesi.'],
        bullets: ['Setiap level memiliki urutan penyelesaian legal', 'Jumlah warna bertambah secara bertahap', 'Total langkah dihitung sepanjang 10 level', 'Langkah lebih sedikit menghasilkan hasil sesi yang lebih baik'],
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
          : item.id === 'fruit-merge'
            ? '<span class="game-card-fruit" aria-hidden="true"><i></i><i></i><i></i><b></b></span>'
            : item.id === 'fruit-slice'
              ? '<span class="game-card-slice" aria-hidden="true"><i></i><i></i><b></b><em></em><small></small><small></small><small></small></span>'
              : item.id === 'magic-bottles'
                ? '<span class="game-card-bottles" aria-hidden="true"><i><b></b><b></b></i><i><b></b><b></b></i><i><b></b><b></b></i></span>'
                : `<span class="game-card-blocks" aria-hidden="true">${'<i></i>'.repeat(20)}</span>`

  return `<button class="game-card game-card-option game-card-${item.id} ${selected ? 'is-selected' : ''}" type="button" data-select-game="${item.id}" aria-label="Pilih game ${item.name}" aria-pressed="${selected}">
    <span class="game-card-top"><small>${item.mode === 'solo' ? item.roomEnabled === false ? 'Main sendiri' : 'Solo / bareng' : 'Room privat'}</small><i>${item.playerLabel}</i></span>
    ${visual}
    <strong>${item.name}</strong>
    <small>${item.genre}</small>
  </button>`
}

export type PublicPageSlug = 'tentang' | 'cara-bermain' | 'faq' | 'kontak' | 'privasi' | 'ketentuan'

export const siteMeta = {
  name: 'Ruang Main',
  alternateName: 'Mini Games Coop',
  title: 'Ruang Main - Mini Game Browser Gratis',
  description: 'Main Tebas Buah, Blok Brak, Fruit Merge, Ludo, Ular Tangga, Arrow Puzzle, dan Kota Raya gratis langsung dari browser. Akun opsional untuk save dan peringkat solo.',
} as const

export type FaqItem = {
  question: string
  answer: string
}

export type PublicPage = {
  title: string
  description: string
  sections: Array<{
    heading: string
    paragraphs: string[]
    bullets?: string[]
  }>
  action?: {
    label: string
    href: string
    external?: boolean
  }
}

export const publicPageSlugs: PublicPageSlug[] = ['tentang', 'cara-bermain', 'faq', 'kontak', 'privasi', 'ketentuan']

export const faqItems: FaqItem[] = [
  {
    question: 'Apa itu Ruang Main?',
    answer: 'Ruang Main adalah koleksi game kasual solo dan P2P yang dimainkan langsung dari browser.',
  },
  {
    question: 'Game apa yang tersedia?',
    answer: 'Tersedia Kota Raya, Ular Tangga, Ludo, Arrow Puzzle, Fruit Merge, Tebas Buah, dan Blok Brak. Game dapat dimainkan sendiri atau melalui room privat sesuai modenya.',
  },
  {
    question: 'Apakah Ruang Main gratis?',
    answer: 'Ya. Game dapat digunakan gratis tanpa membuat akun dan tanpa membeli item digital.',
  },
  {
    question: 'Bagaimana koneksi P2P bekerja?',
    answer: 'Pemain masuk memakai kode room. Setelah peer discovery, WebRTC mengirim state permainan langsung antar-browser.',
  },
  {
    question: 'Apakah data permainan disimpan?',
    answer: 'Game multiplayer hanya hidup selama room berlangsung. Jika pemain masuk, game solo yang belum selesai dapat dilanjutkan dan hasil akhirnya disimpan untuk riwayat serta peringkat.',
  },
  {
    question: 'Mengapa room tidak dapat ditemukan?',
    answer: 'Pastikan kode room benar, host masih membuka lobby, dan kedua perangkat memiliki koneksi internet yang stabil.',
  },
  {
    question: 'Apa yang terjadi jika host keluar?',
    answer: 'Sesi berakhir karena host menjadi sumber state resmi. Permainan tidak dapat dipulihkan setelah host keluar atau refresh.',
  },
  {
    question: 'Apakah situs memakai cookie?',
    answer: 'Jika pemain masuk, Ruang Main memakai cookie sesi yang aman. Penyedia iklan atau layanan pihak ketiga juga dapat memakai cookie sesuai kebijakan dan persetujuan pengguna.',
  },
  {
    question: 'Bagaimana melaporkan masalah?',
    answer: 'Buka halaman Kontak lalu kirim laporan melalui GitHub Issues dengan langkah reproduksi dan jenis perangkat.',
  },
]

export const publicPages: Record<PublicPageSlug, PublicPage> = {
  tentang: {
    title: 'Game di Ruang Main',
    description: 'Ruang Main adalah rumah untuk game kasual berbasis browser yang dapat langsung dimainkan sendiri atau bersama teman tanpa instalasi. Akun bersifat opsional.',
    sections: [
      {
        heading: 'Solo atau bersama teman',
        paragraphs: [
          'Kota Raya, Ular Tangga, dan Ludo dimainkan bersama melalui room privat. Arrow Puzzle, Fruit Merge, Tebas Buah, dan Blok Brak adalah game solo dengan save, riwayat hasil, dan peringkat opsional.',
          'Setiap game tetap dapat dibuka tanpa registrasi. Akun hanya diperlukan jika pemain ingin mencatat hasil solo.',
        ],
      },
      {
        heading: 'Prinsip produk',
        paragraphs: ['Fokus kami adalah permainan yang mudah dibuka, transparan tentang data, dan tetap nyaman digunakan di desktop maupun mobile.'],
        bullets: [
          'Akun opsional untuk game solo',
          'Game solo dapat dilanjutkan oleh pemain login',
          'Komunikasi game multipemain melalui WebRTC',
          'Aturan dan angka permainan dijelaskan di antarmuka',
        ],
      },
    ],
  },
  'cara-bermain': {
    title: 'Cara Bermain',
    description: 'Panduan singkat memilih game, membuat room, mengundang teman, dan memainkan Kota Raya dari awal sampai pemenang ditentukan.',
    sections: [
      {
        heading: 'Mulai satu room',
        paragraphs: ['Satu pemain menjadi host. Pemain lain bergabung memakai kode yang sama sebelum host memulai permainan.'],
        bullets: [
          'Pilih Buat room baru dan isi nama pemain',
          'Bagikan kode room kepada 1-5 teman',
          'Tunggu seluruh pemain muncul di lobby',
          'Host memilih Mulai permainan',
        ],
      },
      {
        heading: 'Kuasai aset kota',
        paragraphs: ['Lempar dadu saat giliranmu, beli aset kosong, terima sewa, dan bangun secara merata setelah memiliki satu kelompok warna lengkap.'],
        bullets: [
          'Lewati pembelian untuk membuka lelang',
          'Gunakan hipotek atau trade saat perlu mengatur uang',
          'Selesaikan kartu dan utang sebelum giliran berlanjut',
          'Pemain terakhir yang belum bangkrut menjadi pemenang',
        ],
      },
      {
        heading: 'Batas sesi',
        paragraphs: ['Jangan refresh selama bermain. State berada pada host dan sesi berakhir ketika host menutup halaman atau meninggalkan room.'],
      },
    ],
  },
  faq: {
    title: 'Pertanyaan Umum',
    description: 'Jawaban tentang koleksi game, room, koneksi P2P, privasi data, biaya, host, dan cara melaporkan masalah.',
    sections: [
      {
        heading: 'Tentang permainan',
        paragraphs: ['Temukan jawaban cepat untuk pertanyaan yang paling sering muncul sebelum mulai bermain.'],
      },
      {
        heading: 'Masih butuh bantuan?',
        paragraphs: ['Jika jawaban tidak tersedia di halaman ini, kirim laporan lewat kanal kontak publik kami.'],
      },
    ],
  },
  kontak: {
    title: 'Kontak',
    description: 'Hubungi pengelola Ruang Main untuk melaporkan bug, masalah koneksi, konten tidak tepat, permintaan privasi, atau pertanyaan kerja sama.',
    sections: [
      {
        heading: 'Kirim laporan',
        paragraphs: ['Gunakan GitHub Issues agar laporan dapat ditinjau, diperbarui, dan ditutup secara transparan. Jangan sertakan kode room aktif atau informasi pribadi.'],
        bullets: ['Jelaskan masalah secara singkat', 'Sertakan langkah untuk mengulang masalah', 'Sebutkan browser dan jenis perangkat', 'Tambahkan tangkapan layar bila aman'],
      },
      {
        heading: 'Privasi dan konten',
        paragraphs: ['Untuk permintaan terkait privasi, hak cipta, atau konten, awali judul laporan dengan kategori yang sesuai agar mudah diprioritaskan.'],
      },
    ],
    action: {
      label: 'Buka GitHub Issues',
      href: 'https://github.com/thoriq1520/ruang-main/issues',
      external: true,
    },
  },
  privasi: {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan ini menjelaskan data yang diproses oleh Ruang Main, koneksi P2P, layanan pihak ketiga, cookie, dan iklan.',
    sections: [
      {
        heading: 'Data permainan',
        paragraphs: [
          'Pemain dapat membuat akun menggunakan email dan password atau masuk melalui Google. Akun menyimpan nama, email, gambar profil bila tersedia, sesi login, dan hasil akhir game solo.',
          'State room multiplayer tetap berada di memori browser host dan dikirim kepada pemain lain melalui WebRTC. Posisi permainan aktif tidak disimpan dan hilang ketika sesi berakhir.',
        ],
      },
      {
        heading: 'Akun dan riwayat solo',
        paragraphs: [
          'Riwayat solo mencatat game, skor, level, durasi, statistik hasil, dan waktu bermain. Data dipakai untuk menampilkan riwayat pribadi serta peringkat publik.',
          'Pemain dapat meminta penghapusan akun dan riwayat melalui halaman Kontak.',
        ],
      },
      {
        heading: 'Koneksi dan layanan pihak ketiga',
        paragraphs: [
          'Ruang Main menggunakan Trystero untuk membantu peer discovery dan komunikasi P2P. Infrastruktur publik yang mendukung koneksi dapat menerima data teknis seperti alamat IP dan metadata jaringan.',
          'Hosting, browser, dan penyedia jaringan juga dapat mencatat data teknis sesuai kebijakan masing-masing.',
        ],
      },
      {
        heading: 'Iklan dan cookie',
        paragraphs: [
          'Situs dapat menampilkan iklan dari Google AdSense. Google dan mitranya dapat memakai cookie atau teknologi serupa untuk menayangkan, membatasi frekuensi, mengukur, dan mempersonalisasi iklan sesuai persetujuan serta hukum yang berlaku.',
          'Pengguna dapat mengelola preferensi iklan melalui pengaturan Google dan pengaturan cookie pada browser. Cookie sesi akun hanya digunakan ketika pemain memilih masuk.',
        ],
      },
      {
        heading: 'Pilihan pengguna',
        paragraphs: ['Jangan memakai nama asli jika tidak diperlukan. Jangan membagikan kode room secara publik. Permintaan atau pertanyaan privasi dapat dikirim melalui halaman Kontak.'],
      },
    ],
  },
  ketentuan: {
    title: 'Ketentuan Penggunaan',
    description: 'Ketentuan ini mengatur penggunaan wajar Ruang Main, tanggung jawab pemain, ketersediaan layanan, konten, dan batas penggunaan situs.',
    sections: [
      {
        heading: 'Penggunaan yang diizinkan',
        paragraphs: ['Ruang Main disediakan untuk hiburan. Pengguna wajib memakai layanan secara wajar dan mematuhi hukum yang berlaku.'],
        bullets: ['Jangan mengganggu koneksi atau pemain lain', 'Jangan mencoba menyisipkan kode berbahaya', 'Jangan menyalahgunakan kanal kontak', 'Jangan mengaku mewakili Ruang Main tanpa izin'],
      },
      {
        heading: 'Ketersediaan dan tanggung jawab',
        paragraphs: ['Layanan diberikan sebagaimana tersedia. Koneksi P2P dapat gagal karena jaringan, browser, relay publik, atau host meninggalkan sesi. Tidak ada jaminan bahwa satu sesi dapat dipulihkan.'],
      },
      {
        heading: 'Identitas dan konten',
        paragraphs: ['Ruang Main dan game di dalamnya memakai identitas visual serta konten orisinal dan tidak berafiliasi dengan merek permainan lain. Tautan eksternal tunduk pada kebijakan layanan tujuan.'],
      },
      {
        heading: 'Perubahan',
        paragraphs: ['Fitur dan ketentuan dapat diperbarui untuk keamanan, kepatuhan, atau peningkatan produk. Penggunaan setelah perubahan berarti pengguna menerima versi terbaru.'],
      },
    ],
  },
}

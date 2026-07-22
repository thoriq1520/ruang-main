export type CardDeck = 'chance' | 'community'

export type CardEffect =
  | {kind: 'money'; amount: number}
  | {kind: 'move'; to: number; collectStart?: boolean}
  | {kind: 'relative'; steps: number}
  | {kind: 'nearest'; target: 'station' | 'utility'; rentMultiplier?: number; utilityRate?: number}
  | {kind: 'each'; amount: number}
  | {kind: 'repairs'; house: number; hotel: number}
  | {kind: 'jail'}
  | {kind: 'jail-free'}

export type GameCard = {
  id: string
  deck: CardDeck
  title: string
  text: string
  effect: CardEffect
}

export const chanceCards: GameCard[] = [
  {id: 'chance-garuda', deck: 'chance', title: 'Puncak Prestise', text: 'Maju ke Garuda Heights. Jika dimiliki pemain lain, bayar sewa sesuai aturan petak.', effect: {kind: 'move', to: 39}},
  {id: 'chance-start', deck: 'chance', title: 'Putar Balik Keberuntungan', text: 'Maju ke START dan terima Rp200.000.', effect: {kind: 'move', to: 0, collectStart: true}},
  {id: 'chance-aruna', deck: 'chance', title: 'Ekspedisi Aruna', text: 'Maju ke Puncak Aruna. Jika melewati START, terima Rp200.000.', effect: {kind: 'move', to: 24, collectStart: true}},
  {id: 'chance-kebun', deck: 'chance', title: 'Festival Kebun Raya', text: 'Maju ke Kebun Raya. Jika melewati START, terima Rp200.000.', effect: {kind: 'move', to: 11, collectStart: true}},
  {id: 'chance-station-a', deck: 'chance', title: 'Kereta Berikutnya', text: 'Maju ke stasiun terdekat. Jika dimiliki pemain lain, sewa menjadi dua kali lipat.', effect: {kind: 'nearest', target: 'station', rentMultiplier: 2}},
  {id: 'chance-station-b', deck: 'chance', title: 'Perjalanan Mendadak', text: 'Maju ke stasiun terdekat. Jika dimiliki pemain lain, sewa menjadi dua kali lipat.', effect: {kind: 'nearest', target: 'station', rentMultiplier: 2}},
  {id: 'chance-utility', deck: 'chance', title: 'Panggilan Utilitas', text: 'Maju ke utilitas terdekat. Lemparan dadu dikali Rp10.000.', effect: {kind: 'nearest', target: 'utility', utilityRate: 10_000}},
  {id: 'chance-dividend', deck: 'chance', title: 'Dividen Kota', text: 'Investasimu membuahkan hasil. Terima Rp50.000.', effect: {kind: 'money', amount: 50_000}},
  {id: 'chance-jail-free', deck: 'chance', title: 'Surat Pembebasan', text: 'Simpan kartu ini. Gunakan untuk keluar dari Penjara tanpa membayar denda.', effect: {kind: 'jail-free'}},
  {id: 'chance-back-three', deck: 'chance', title: 'Salah Arah', text: 'Mundur tiga petak.', effect: {kind: 'relative', steps: -3}},
  {id: 'chance-jail', deck: 'chance', title: 'Pelanggaran Berat', text: 'Pergi langsung ke Penjara. Jangan melewati START dan jangan menerima Rp200.000.', effect: {kind: 'jail'}},
  {id: 'chance-repairs', deck: 'chance', title: 'Audit Bangunan', text: 'Bayar Rp25.000 per rumah dan Rp100.000 per hotel yang kamu miliki.', effect: {kind: 'repairs', house: 25_000, hotel: 100_000}},
  {id: 'chance-fine', deck: 'chance', title: 'Tilang Elektronik', text: 'Bayar denda Rp15.000.', effect: {kind: 'money', amount: -15_000}},
  {id: 'chance-north-station', deck: 'chance', title: 'Tiket Jalur Utara', text: 'Pergi ke Stasiun Utara. Jika melewati START, terima Rp200.000.', effect: {kind: 'move', to: 5, collectStart: true}},
  {id: 'chance-chairperson', deck: 'chance', title: 'Ketua Forum Kota', text: 'Bayar Rp50.000 kepada setiap pemain lain.', effect: {kind: 'each', amount: -50_000}},
  {id: 'chance-loan', deck: 'chance', title: 'Proyek Selesai', text: 'Dana proyek cair. Terima Rp150.000.', effect: {kind: 'money', amount: 150_000}},
]

export const communityCards: GameCard[] = [
  {id: 'community-start', deck: 'community', title: 'Apresiasi Warga', text: 'Maju ke START dan terima Rp200.000.', effect: {kind: 'move', to: 0, collectStart: true}},
  {id: 'community-bank', deck: 'community', title: 'Koreksi Bank', text: 'Ada koreksi transaksi yang menguntungkanmu. Terima Rp200.000.', effect: {kind: 'money', amount: 200_000}},
  {id: 'community-doctor', deck: 'community', title: 'Pemeriksaan Kesehatan', text: 'Bayar tagihan dokter Rp50.000.', effect: {kind: 'money', amount: -50_000}},
  {id: 'community-investment', deck: 'community', title: 'Hasil Koperasi', text: 'Pembagian hasil koperasi tiba. Terima Rp50.000.', effect: {kind: 'money', amount: 50_000}},
  {id: 'community-jail-free', deck: 'community', title: 'Surat Pembebasan', text: 'Simpan kartu ini. Gunakan untuk keluar dari Penjara tanpa membayar denda.', effect: {kind: 'jail-free'}},
  {id: 'community-jail', deck: 'community', title: 'Panggilan Pengadilan', text: 'Pergi langsung ke Penjara. Jangan melewati START dan jangan menerima Rp200.000.', effect: {kind: 'jail'}},
  {id: 'community-holiday', deck: 'community', title: 'Dana Liburan', text: 'Tabungan liburan jatuh tempo. Terima Rp100.000.', effect: {kind: 'money', amount: 100_000}},
  {id: 'community-refund', deck: 'community', title: 'Pengembalian Pajak', text: 'Terima pengembalian Rp20.000.', effect: {kind: 'money', amount: 20_000}},
  {id: 'community-birthday', deck: 'community', title: 'Hari Ulang Tahun', text: 'Setiap pemain lain memberikan Rp10.000 kepadamu.', effect: {kind: 'each', amount: 10_000}},
  {id: 'community-insurance', deck: 'community', title: 'Asuransi Jatuh Tempo', text: 'Terima pembayaran asuransi Rp100.000.', effect: {kind: 'money', amount: 100_000}},
  {id: 'community-hospital', deck: 'community', title: 'Tagihan Rumah Sakit', text: 'Bayar biaya perawatan Rp50.000.', effect: {kind: 'money', amount: -50_000}},
  {id: 'community-school', deck: 'community', title: 'Iuran Pendidikan', text: 'Bayar iuran pendidikan Rp50.000.', effect: {kind: 'money', amount: -50_000}},
  {id: 'community-consulting', deck: 'community', title: 'Honor Warga', text: 'Terima honor kegiatan warga Rp25.000.', effect: {kind: 'money', amount: 25_000}},
  {id: 'community-repairs', deck: 'community', title: 'Perbaikan Lingkungan', text: 'Bayar Rp40.000 per rumah dan Rp115.000 per hotel yang kamu miliki.', effect: {kind: 'repairs', house: 40_000, hotel: 115_000}},
  {id: 'community-award', deck: 'community', title: 'Penghargaan Kota', text: 'Karyamu mendapat penghargaan. Terima Rp10.000.', effect: {kind: 'money', amount: 10_000}},
  {id: 'community-inheritance', deck: 'community', title: 'Warisan Keluarga', text: 'Terima warisan Rp100.000.', effect: {kind: 'money', amount: 100_000}},
]

const cards = [...chanceCards, ...communityCards]

export function cardById(id: string) {
  return cards.find((card) => card.id === id)
}

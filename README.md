# Mini Games Coop

Koleksi mini game browser sementara berbasis Vite dan TypeScript. Kota Raya, Ular Tangga, dan Ludo memakai Trystero untuk sesi P2P; Arrow Puzzle dimainkan solo.

```bash
npm install
npm run dev
```

Tidak ada akun, backend aplikasi, atau database permanen. State game hanya hidup di memori browser dan hilang saat halaman dimuat ulang.

- Katalog dan metadata game: `src/game-catalog.ts`
- Aturan Arrow Puzzle: `src/arrow-game.ts`
- Tampilan Arrow Puzzle: `src/arrow-view.ts`
- Aturan dan peta Ular Tangga: `src/snakes-game.ts`
- Tampilan Ular Tangga: `src/snakes-view.ts`
- Aturan Ludo: `src/ludo-game.ts`
- Tampilan Ludo: `src/ludo-view.ts`
- Helper UI bersama: `src/ui.ts`

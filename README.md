# Ruang Main

Monorepo mini game browser Ruang Main. Kota Raya, Ular Tangga, dan Ludo tetap berjalan P2P melalui Trystero. Arrow Puzzle dan Fruit Merge dapat menyimpan hasil serta masuk leaderboard melalui akun opsional.

## Struktur

```text
apps/
  web/       Vite + TypeScript + seluruh game
  api/       Elysia + Better Auth + history/leaderboard
supabase/
  migrations/
```

## Menjalankan lokal

```bash
npm install
npm run db:migrate
npm run dev:api
npm run dev:web
```

Salin `.env.example` menjadi `.env`. Gunakan connection string **Supavisor Session pooler** untuk `DATABASE_URL`; endpoint Direct IPv6 tidak selalu dapat dijangkau dari mesin lokal atau platform deployment.

Variabel production yang wajib:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://api.ruangmain.web.id
WEB_ORIGIN=https://ruangmain.web.id
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_API_URL=https://api.ruangmain.web.id
```

Google OAuth memakai callback:

```text
https://api.ruangmain.web.id/api/auth/callback/google
```

Tanpa credential Google, tombol Google otomatis disembunyikan. Login email/password tetap tersedia. Email verification dan reset password memerlukan provider email sebelum fitur recovery diaktifkan.

## Pemeriksaan

```bash
npm test
npm run build
npm run build:api
npm run self-test
```

`self-test` menjalankan migrasi, membuat akun sementara, menyimpan hasil Arrow dan Fruit, membaca history serta leaderboard, lalu membersihkan akun uji.

## Deployment

- Cloudflare menjalankan `npm run build` lalu `npx wrangler deploy` dari root repository.
- API dijalankan pada host Bun/container dengan entrypoint `apps/api/src/index.ts`.
- Supabase hanya diakses oleh API; browser tidak menerima password atau connection string database.

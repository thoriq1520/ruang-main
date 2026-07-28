# Ruang Main

Monorepo mini game browser Ruang Main. Kota Raya, Ular Tangga, dan Ludo tetap berjalan P2P melalui Trystero. Arrow Puzzle dan Fruit Merge dapat menyimpan hasil serta masuk leaderboard melalui akun opsional.

## Struktur

```text
apps/
  web/       Vite + TypeScript + seluruh game
  api/       Elysia + Better Auth + history/leaderboard (Bun lokal + Worker production)
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

Production berjalan dalam satu domain: asset web dilayani langsung oleh Cloudflare dan route `/api/*` diproses entrypoint `apps/api/src/worker.ts`.

Tambahkan berikut sebagai **runtime secrets** Worker setelah deployment pertama:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`BETTER_AUTH_URL` dan `WEB_ORIGIN` sudah menjadi konfigurasi publik di `wrangler.jsonc`. `VITE_API_URL` tidak diperlukan di production karena browser memanggil API pada domain yang sama. `DATABASE_URL` dapat diganti binding `HYPERDRIVE` tanpa perubahan kode.

Google OAuth memakai callback:

```text
https://ruangmain.web.id/api/auth/callback/google
```

Tanpa credential Google, tombol Google otomatis disembunyikan. Login email/password tetap tersedia. Email verification dan reset password memerlukan provider email sebelum fitur recovery diaktifkan.

## Pemeriksaan

```bash
npm test
npm run build
npm run build:api
npm run build:worker
npm run self-test
```

`self-test` menjalankan migrasi, membuat akun sementara, menyimpan hasil Arrow dan Fruit, membaca history serta leaderboard, lalu membersihkan akun uji.

## Deployment

- Cloudflare menjalankan `npm run build` lalu `npx wrangler deploy` dari root repository.
- Static assets dan Elysia API dikirim sebagai satu Worker; local development tetap memakai entrypoint Bun `apps/api/src/index.ts`.
- Supabase hanya diakses oleh Worker. Untuk trafik production, binding Hyperdrive lebih disarankan daripada koneksi langsung `DATABASE_URL`.
- Setelah Worker script pertama terpasang, isi runtime secrets melalui **Settings → Variables and secrets**. Nilai rahasia tidak disimpan di Git.

# Handoff Axon Sales: Next.js dan PostgreSQL

## Arsitektur dan konfigurasi

Browser memanggil API di Next.js; hanya server Next.js mengakses PostgreSQL (`src/lib/sales-repository.ts` memakai `server-only` dan `pg`). Browser tidak terhubung langsung ke database.

`.env.example` menyediakan `DATA_SOURCE=demo` dan `DATABASE_URL=`. `DATA_SOURCE` menerima `demo` atau `postgres` dan default ke `demo`; mode demo tidak memerlukan database. Mode `postgres` memerlukan `DATABASE_URL` berupa URL `postgres:`/`postgresql:` yang valid. Kegagalan PostgreSQL menghasilkan error; aplikasi tidak beralih diam-diam ke demo. Simpan nilai lokal di `.env.local`, jangan commit atau menambahkan `DATABASE_URL` ke `NEXT_PUBLIC_*`.

Setelah mengubah `DATABASE_URL` atau `DATA_SOURCE`, hentikan lalu jalankan ulang `npm run dev`; pool PostgreSQL menyimpan koneksi pertamanya sehingga refresh environment saja dapat tetap memakai pool lama.

## API dan kontrak data

- `GET /api/sales`: `200` dengan `{ source: "demo" | "postgres", sales: Sale[] }`; bila data tidak tersedia, `503` dengan pesan umum `error` dan `source` bila konfigurasi valid. Detail koneksi tidak dikirim ke browser.
- `GET /api/health`: `200` jika siap, `503` jika belum. JSON readiness berisi `ready`, `database` (`not_required`, `connected`, `misconfigured`, atau `unavailable`) dan `source` bila diketahui.
- Halaman memakai `/api/sales`, menampilkan sumber data, serta menyediakan status loading dan error dengan retry.

`Sale` didefinisikan di `src/lib/dashboard-data.ts` dan juga menjadi bentuk setiap elemen dalam `sales`:

| Properti | Tipe | Makna/format |
| --- | --- | --- |
| `id` | `string` | ID transaksi |
| `customer` | `string` | Nama pelanggan |
| `product` | `string` | Nama produk/paket |
| `date` | `string` | Tanggal ISO `YYYY-MM-DD` |
| `amount` | `number` | Bilangan bulat Rupiah/IDR |
| `status` | `SaleStatus` | `completed`, `processing`, atau `cancelled` |
| `channel` | `string` | Kanal transaksi |

Filter dan ringkasan tetap mengikuti aturan dashboard: filter berlaku ke KPI, grafik, dan tabel; omzet tidak menghitung transaksi `cancelled`, sedangkan jumlah transaksi mencakup semua status.

## PostgreSQL lokal: skema dan seed

Skema yang benar-benar dipakai berada di `database/schema.sql`: tabel `public.sales` dengan `id`, `customer`, `product`, `sale_date`, `amount`, `status`, `channel`; `amount` bertipe `NUMERIC(15, 0)` non-negatif dan status dibatasi ke tiga nilai `SaleStatus`. `database/demo-sales.json` berisi fixture. Script `database/setup.mjs` menerapkan skema dan meng-upsert fixture berdasarkan ID tanpa menghapus baris lain.

```bash
npm ci
cp .env.example .env.local
# Untuk PostgreSQL lokal, ubah .env.local: DATA_SOURCE=postgres
# dan DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
npm run db:setup
npm run dev
```

`npm run db:setup` membaca `.env.local` dan menjalankan `database/setup.mjs`; gunakan database development/disposable untuk seed. Untuk demo saja, biarkan `DATA_SOURCE=demo`; database dan perintah seed tidak diperlukan.

## Pembagian tanggung jawab dan keamanan

- **Developer:** menyiapkan database development lokal dan `.env.local`, memelihara skema/fixture serta pemetaan query PostgreSQL ke `Sale`, dan menguji kontrak/error API. Skema aplikasi berada di repo (`database/schema.sql`); bukan berarti service PostgreSQL ikut dihidupkan oleh Next.js.
- **DevSecOps:** menyediakan/menjalankan PostgreSQL untuk deployment; mengelola kredensial dengan hak minimum dan injeksi server-side, jaringan privat antara aplikasi dan DB, volume persisten, serta backup dan uji pemulihan. Jangan masukkan kredensial ke image, log, browser, atau repository.
- `DATABASE_URL` hanya untuk server. Batasi akses role PostgreSQL sesuai kebutuhan aplikasi dan lindungi database di jaringan; keamanan tidak bergantung pada UI.

## Runtime dan verifikasi

README mencatat Node.js `20.9+` dan npm sebagai prasyarat; `package.json` belum menetapkan `engines`. Runtime memakai Next.js `16.3.8`, React/React DOM `19.3.0`, dan `pg` `^8.23.1`. Script yang tersedia: `dev`, `start`, `build`, `lint`, `typecheck`, `test`, `db:setup`.

Perintah pemeriksaan: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; mode produksi setelah build memakai `npm start`. Cakupan test ada untuk pemilihan sumber, validasi URL/pemetaan baris, route API, error aman, dan logika dashboard. Dokumen ini tidak menyatakan test, build, koneksi DB, atau verifikasi browser telah lulus; jalankan perintah dan uji mode demo/PostgreSQL di lingkungan yang tersedia sebelum menyatakan siap.

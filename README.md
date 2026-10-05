# Axon Sales

Dashboard penjualan satu halaman dengan backend Next.js. Filter berlaku serentak ke KPI, grafik, dan tabel. Aplikasi dapat dijalankan dengan data demo atau membaca PostgreSQL milik developer.

## Menjalankan mode demo

Prasyarat: Node.js 20.9+ dan npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Nilai bawaan `DATA_SOURCE=demo` tidak membutuhkan database. API yang digunakan halaman:

- `GET /api/sales` → `{ "sales": Sale[], "source": "demo" | "postgres" }`.
- `GET /api/health` → readiness aplikasi dan sumber data; status HTTP `503` berarti konfigurasi/database PostgreSQL belum siap.

## Menggunakan PostgreSQL

Siapkan database PostgreSQL milik Anda, lalu edit `.env.local`:

```dotenv
DATA_SOURCE=postgres
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
```

**Jangan** commit `.env.local` atau mengirim `DATABASE_URL` ke browser. File `.env*` diabaikan Git; `.env.example` aman untuk dibagikan.

Jalankan skema dan seed demo:

```bash
npm run db:setup
npm run dev
```

`db:setup` menjalankan `database/schema.sql` dan meng-upsert 20 fixture dari `database/demo-sales.json` berdasarkan ID. Perintah dapat diulang: baris fixture diperbarui bila berubah, sedangkan baris lain tidak dihapus. Gunakan database development/disposable saat menguji seed.

Tabel yang dipakai adalah `public.sales` dengan kolom `id`, `customer`, `product`, `sale_date`, `amount`, `status`, dan `channel`. Status yang diterima: `completed`, `processing`, `cancelled`. `amount` disimpan sebagai whole-IDR `NUMERIC`; API mengirimkannya sebagai bilangan bulat JavaScript. `sale_date` dikirim sebagai ISO `YYYY-MM-DD`.

`DATA_SOURCE` menerima `demo` atau `postgres` (jika tidak diatur, aplikasi memakai `demo`). Bila `postgres` dipilih, aplikasi memerlukan `DATABASE_URL`; kegagalan atau konfigurasi salah menghasilkan error API yang aman dan **tidak** beralih diam-diam ke fixture demo.

Setelah mengubah `DATA_SOURCE` atau `DATABASE_URL`, restart server Next.js agar konfigurasi pool PostgreSQL dibaca ulang.

## Semantik dashboard

- Pencarian berdasarkan ID transaksi, pelanggan, atau produk.
- Filter tanggal inklusif dan status berlaku ke semua angka, grafik, serta transaksi.
- Omzet dan grafik menghitung pesanan selesai + diproses, tidak termasuk yang dibatalkan.
- Jumlah transaksi mencakup semua status. Rata-rata pesanan aktif = omzet non-dibatalkan ÷ pesanan aktif. Tingkat penyelesaian = jumlah selesai ÷ jumlah pesanan aktif.

## Kontrak `Sale`

Tipe bersama berada di `src/lib/dashboard-data.ts`.

| Field | Tipe | Ketentuan |
| --- | --- | --- |
| `id` | `string` | ID transaksi unik |
| `customer` | `string` | Nama pelanggan |
| `product` | `string` | Nama produk/paket |
| `date` | `string` | Tanggal ISO `YYYY-MM-DD` |
| `amount` | `number` | Whole Rupiah/IDR |
| `status` | `SaleStatus` | `completed`, `processing`, atau `cancelled` |
| `channel` | `string` | Kanal penjualan |

## Pemeriksaan

```bash
npm test          # filter, KPI/tren, source, mapping API, error aman
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run build     # build produksi
npm start         # jalankan build produksi
```

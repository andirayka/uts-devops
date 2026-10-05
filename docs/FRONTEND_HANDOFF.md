# Handoff Frontend Axon Sales

## Status dan batasan

Frontend saat ini memakai `DEMO_SALES` lokal di `src/lib/dashboard-data.ts`; halaman belum mengambil data Supabase. Bentuk `Sale` di bawah adalah **kontrak adapter untuk UI**, bukan usulan atau keputusan skema database. Belum ada autentikasi atau CRUD.

## Kontrak data yang dibutuhkan UI

`Sale` (`src/lib/dashboard-data.ts`):

| Properti | Tipe | Makna/format |
| --- | --- | --- |
| `id` | `string` | ID transaksi |
| `customer` | `string` | Nama pelanggan |
| `product` | `string` | Nama produk/paket |
| `date` | `string` | Tanggal ISO `YYYY-MM-DD`; dipakai untuk filter rentang dan pengelompokan |
| `amount` | `number` | Nilai Rupiah/IDR |
| `status` | `SaleStatus` | Salah satu: `completed`, `processing`, `cancelled` |
| `channel` | `string` | Kanal transaksi |

Filter memakai `SaleFilters` (`query`, `from`, `to`, `status`). Ringkasan dan grafik dihitung dari transaksi terfilter: transaksi batal tidak menambah omzet/omzet harian; jumlah transaksi tetap mencakup semua status. Integrasi backend perlu memetakan hasil query ke bentuk UI ini dan menyepakati semantik nilai dengan developer—jangan mengasumsikan nama tabel/kolom Supabase.

## Verifikasi

- Cakupan unit test tersedia di `src/lib/dashboard-data.test.ts` untuk pencarian/filter, urutan tanggal, ringkasan, nilai kosong, dan agregasi grafik. Status lulus/gagal ditentukan oleh worker verifikasi; dokumen ini tidak mengklaim tes telah dijalankan.
- Status visual/interaksi juga milik worker verifikasi. Pastikan memeriksa tampilan awal, filter gabungan, reset dan hasil kosong, rentang tanggal tidak valid, serta ukuran layar sempit.
- Perintah pemeriksaan: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Jalankan UI lokal dengan `npm run dev` sebelum verifikasi browser.

## Pembagian pekerjaan

- **Developer:** tentukan skema dan aturan bisnis Supabase; buat adapter/query yang menghasilkan `Sale`; implementasikan autentikasi, penanganan loading/error, serta uji integrasi. Developer bertanggung jawab membuat dan menguji kebijakan **RLS** dengan akses minimum yang sesuai.
- **DevSecOps:** siapkan image/container dan pipeline untuk build/runtime Next.js, jalankan pemeriksaan di atas, dan injeksikan konfigurasi rahasia hanya pada lingkungan server/deployment. Jangan commit berkas `.env`.

## Persiapan Docker dan keamanan

`package.json` menetapkan Next.js `16.3.8`, React/React DOM `19.3.0`, dan script `dev`, `build`, `start`, `lint`, `typecheck`, `test`. Instalasi reproducible: `npm ci`; image produksi perlu menjalankan `npm run build` lalu `npm start`. `package.json` belum menetapkan `engines`, jadi DevSecOps perlu memilih serta mengunci versi Node yang kompatibel dengan dependensi tersebut.

Jangan pernah mengirim Supabase service-role key atau kredensial rahasia ke browser, source map publik, maupun variabel `NEXT_PUBLIC_*`. Nilai yang dikirim ke browser dapat dibaca pengguna; gunakan hanya kunci publik yang memang dirancang untuk klien, dan andalkan **RLS Supabase** (bukan penyembunyian tombol di UI) untuk membatasi akses data.

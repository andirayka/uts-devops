# Axon Sales — Frontend UTS DevOps

Dashboard penjualan satu halaman dengan data demo deterministik. Semua filter berlaku serentak ke KPI, grafik, dan tabel transaksi.

## Menjalankan

Prasyarat: Node.js 20.9+ dan npm.

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000`. Perintah lain:

```bash
npm test          # unit test filter, ringkasan, dan tren
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run build     # build produksi
npm start         # jalankan build produksi (setelah npm run build)
```

## Cakupan demo

- Cari berdasarkan ID transaksi, nama pelanggan, atau produk.
- Filter status dan rentang tanggal inklusif; rentang tanggal terbalik menampilkan peringatan.
- Omzet dan grafik menghitung pesanan **selesai + diproses**, tidak termasuk pesanan dibatalkan.
- Jumlah transaksi mencakup semua status. Rata-rata pesanan aktif = omzet non-dibatalkan dibagi pesanan selesai + diproses. Tingkat penyelesaian = jumlah selesai dibagi jumlah pesanan aktif.
- Data saat ini berasal dari `DEMO_SALES` di `src/lib/dashboard-data.ts`. Belum ada autentikasi, CRUD, API, atau integrasi Supabase.

## Kontrak data untuk integrasi berikutnya

`Sale` di `src/lib/dashboard-data.ts` adalah bentuk data yang dipakai halaman:

| Field | Tipe | Ketentuan |
| --- | --- | --- |
| `id` | `string` | ID transaksi yang unik |
| `customer` | `string` | Nama pelanggan |
| `product` | `string` | Nama produk/paket |
| `date` | `string` | Tanggal transaksi dalam format `YYYY-MM-DD` |
| `amount` | `number` | Nilai dalam Rupiah (IDR), bilangan bulat |
| `status` | `SaleStatus` | `completed`, `processing`, atau `cancelled` |
| `channel` | `string` | Kanal penjualan |

Adapter API berikutnya dapat mengubah respons backend menjadi `Sale[]`, lalu mengganti sumber `DEMO_SALES`; fungsi filter dan perhitungan ringkasan tidak memerlukan perubahan selama kontrak ini dipenuhi.

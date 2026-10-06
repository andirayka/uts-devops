# Axon Sales Dashboard

Dashboard penjualan interaktif berbasis **Next.js 16** dan database **MySQL (`classicmodels`)**, dilengkapi dengan containerization Docker (Development & Production) serta pipeline CI/CD otomatis ke server VPS via GitHub Actions.

---

## 1. Persyaratan Sistem
- **Docker** dan **Docker Compose** (v2+)
- **Node.js 24+** dan **npm** (opsional untuk run/test di host lokal)

---

## 2. Menjalankan di Lingkungan Development

Mode development menggunakan [Dockerfile.dev](Dockerfile.dev) dan [docker-compose.dev.yml](docker-compose.dev.yml). Mode ini mendukung *hot-reloading* kode lokal dan otomatis menginisialisasi database saat container pertama kali dinyalakan.

### Langkah-langkah:
1. Pastikan file `.env` sudah ada (dapat disalin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Jalankan Docker Compose Dev:
   ```bash
   docker compose -f docker-compose.dev.yml up --build -d
   ```
3. Akses dashboard di browser:
   👉 **`http://localhost:3000`**

> **Catatan Inisialisasi DB di Dev:**
> Service `app` akan otomatis mengeksekusi `scripts/init-db.mjs` begitu container MySQL berstatus *healthy*. Script ini bersifat *idempotent* (hanya meng-import dump SQL jika tabel belum ada).

Untuk mematikan container:
```bash
docker compose -f docker-compose.dev.yml down
```

---

## 3. Menjalankan di Lingkungan Production

Mode production menggunakan [Dockerfile.prod](Dockerfile.prod) (multi-stage build dengan user non-root `nextjs` UID 1001 untuk standar DevSecOps) dan [docker-compose.prod.yml](docker-compose.prod.yml).

### Langkah-langkah:
1. Jalankan Docker Compose Prod:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
2. **Inisialisasi Database (Manual 1x Saat Pertama Kali Deploy)**:
   Di mode production, database tidak diinisialisasi otomatis untuk menghindari modifikasi data tanpa sengaja. Jalankan perintah berikut untuk mengisi database pertama kali:
   ```bash
   docker compose -f docker-compose.prod.yml exec app npm run db:init
   ```
3. Akses aplikasi di port host yang dikonfigurasi di `.env` (misal port `3126`):
   👉 **`http://localhost:3126`**

Untuk mematikan:
```bash
docker compose -f docker-compose.prod.yml down
```

---

## 4. CI/CD & Otomatisasi Deploy ke VPS (GitHub Actions)

Alur deployment dikonfigurasi di [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Alur Kerja (Workflow):
1. **Continuous Integration (CI)**: Otomatis berjalan setiap kali ada `git push` ke branch `main`. Menjalankan:
   - `npm run lint` (ESLint)
   - `npm run typecheck` (TypeScript check)
   - `npm test` (Unit test)
2. **Continuous Deployment (CD)**: Berjalan **secara manual** (*workflow_dispatch*) untuk keamanan rilis. Ketika tombol **"Run workflow"** ditekan di tab Actions GitHub:
   - GitHub Actions login via SSH ke VPS.
   - Menjalankan `git pull origin main`.
   - Menjalankan `docker compose -f docker-compose.prod.yml up --build -d`.

### GitHub Secrets yang Dibutuhkan:
Atur rahasia berikut di menu **Settings → Secrets and variables → Actions**:
- `VPS_HOST`: IP publik VPS Anda (contoh: `204.44.67.85`)
- `VPS_USERNAME`: Username login SSH VPS (contoh: `root`)
- `VPS_SSH_KEY`: Private Key SSH untuk login ke VPS

---

## 5. Pengujian & Linting Lokal

```bash
npm test          # Menjalankan unit test (Vitest)
npm run lint      # Pemeriksaan linter ESLint
npm run typecheck # Pemeriksaan tipe data TypeScript
npm run build     # Uji coba build Next.js standalone
```

# BE-SchoolSystem

Backend API untuk Sistem Informasi Sekolah. Dibangun dengan Node.js, Express, Prisma, PostgreSQL, dan Redis.

## Daftar Isi

- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Database](#setup-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Menjalankan Test](#menjalankan-test)
- [Struktur Project](#struktur-project)
- [Fitur Utama](#fitur-utama)
- [Pagination, Filtering & Sorting](#pagination-filtering--sorting)
- [API Endpoints](#api-endpoints)
- [Alur Refresh Token](#alur-refresh-token)
- [Kontribusi](#kontribusi)

## Prerequisites

Pastikan perangkat kamu sudah terinstal:

- **Node.js** v20 atau lebih baru
- **PostgreSQL** v14+
- **Redis** v6+ (untuk caching — dev & test memakai **instance terpisah**, lihat [Menjalankan Test](#menjalankan-test))
- **npm** v9+
- **Git**

## Instalasi

```bash
# 1. Clone repository
git clone https://github.com/githubprojek/BE-SchoolSystem.git

# 2. Masuk ke direktori project
cd BE-SchoolSystem

# 3. Install dependencies
npm install
```

## Konfigurasi Environment

Salin file contoh environment:

```bash
cp .env.example .env
```

Lalu isi variabel berikut di `.env`:

| Variabel                 | Keterangan                                                                    | Contoh                                               |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`           | URL koneksi PostgreSQL                                                        | `postgresql://user:pass@localhost:5432/schoolsystem` |
| `JWT_SECRET`             | Secret untuk **access token**                                                 | `secret-key-anda`                                    |
| `JWT_EXPIRES_IN`         | Masa berlaku access token                                                     | `15m`                                                |
| `JWT_REFRESH_SECRET`     | Secret **terpisah** untuk refresh token (wajib, app gagal start kalau kosong) | `openssl rand -hex 32`                               |
| `JWT_REFRESH_EXPIRES_IN` | Masa berlaku refresh token                                                    | `7d`                                                 |
| `REDIS_URL`              | URL koneksi Redis (opsional — **dev & test wajib beda instance**)             | `redis://localhost:6379`                             |
| `PORT`                   | Port server                                                                   | `3000`                                               |

> Generate secret acak: `openssl rand -hex 32`. **Jangan pakai `JWT_SECRET` yang sama** untuk refresh token.

Untuk menjalankan test, buat juga `.env.test` lalu sesuaikan isinya:

```bash
cp .env.example .env.test
```

> **`.env.test` harus menunjuk ke database test dan Redis test yang terpisah:**
>
> ```bash
> DATABASE_URL=postgresql://user:pass@localhost:5432/db_test
> REDIS_URL=redis://localhost:6380
> ```
>
> Jangan pakai Redis yang sama untuk dev & test — lihat [Menjalankan Test](#menjalankan-test).

## Setup Database

Jalankan migrasi Prisma untuk membuat tabel-tabel di database:

```bash
# Development: generate migrasi + apply ke DB dev (.env)
npm run db:migrate

# Apply migrasi yang sama ke DB test (.env.test)
npm run db:migrate:test

# Sekaligus keduanya (paling sering dipakai)
npm run db:migrate:all
```

Catatan: setiap kali `prisma/schema.prisma` diubah, jalankan `npm run db:migrate:all` agar DB dev dan DB test ikut ter-update.

Opsional: isi data awal (seed):

```bash
npm run db:seed
```

## Menjalankan Aplikasi

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000` (atau sesuai `PORT`).

## Menjalankan Test

```bash
# Semua test + coverage
npm test

# Unit test saja
npm run test:unit

# Integration test saja
npm run test:int
```

> **Penting — pakai Redis terpisah untuk test.**
>
> Integration test menulis cache ke Redis yang **berbeda** dari yang dipakai dev (`REDIS_URL` di `.env.test`, default port `6380`). Pastikan instance Redis test sudah berjalan sebelum menjalankan test.
>
> **Jangan** memakai satu Redis untuk dev dan test: cached response bisa bocor antar environment — API dev akan mengembalikan data test (atau sebaliknya) sampai cache kedaluwarsa (TTL 600 detik). Contoh pemisahan di `docker-compose.yml`:
>
> ```yaml
> services:
>   redis-dev: # untuk .env (port 6379)
>     image: redis:alpine
>     ports:
>       - "6379:6379"
>
>   redis-test: # untuk .env.test (port 6380)
>     image: redis:alpine
>     ports:
>       - "6380:6379"
> ```

## Struktur Project

```
BE-SchoolSystem/
├── prisma/               # Schema & migrasi database
│   └── schema.prisma
├── src/
│   ├── app/              # Setup Express app & server
│   ├── cache/            # Redis client & cache helper
│   ├── config/           # Konfigurasi aplikasi & env
│   ├── controllers/      # Handler HTTP request
│   ├── db/               # Prisma client
│   ├── errors/           # Custom error & error codes
│   ├── logging/          # Logger (pino)
│   ├── middlewares/      # Auth, authorize, error handler, dll
│   ├── repositories/     # Akses data (Prisma + cache)
│   ├── routes/           # Definisi endpoint API
│   ├── services/         # Business logic
│   ├── utils/            # Helper (http-response, async-handler)
│   └── validators/       # Schema validasi (zod)
├── tests/
│   ├── unit/             # Unit test (service layer, mocked)
│   └── integration/      # Integration test (HTTP + DB)
└── package.json
```

## Fitur Utama

### 1. Autentikasi & Otorisasi

- Registrasi pengguna dengan role (`admin`, `guru`, `murid`)
- Login dengan JWT → menghasilkan **access token** + **refresh token**
- **Refresh token** dengan rotasi sekali pakai, deteksi pemakaian ulang (reuse), & logout yang mencabut sesi
- Middleware `authenticate` untuk verifikasi token
- Middleware `authorize` untuk pembatasan akses per role

### 2. Manajemen User

- Lihat profil (`GET /api/v1/me`)
- Update profil (`PATCH /api/v1/me`)
- Admin dapat melihat semua user, update, dan menghapus user

### 3. Manajemen Kelas & Mata Pelajaran

- CRUD kelas
- CRUD mata pelajaran (mapel)

### 4. Jadwal Pelajaran

- Admin membuat jadwal (guru, murid, mapel, kelas, hari, jam mulai, jam selesai)
- Validasi konflik jadwal (overlap waktu di kelas & hari yang sama)
- Guru dan murid dapat melihat jadwal miliknya (`GET /api/v1/jadwal-saya`)
- Update & hapus jadwal (admin)

### 5. Absensi

- Guru/admin membuat absensi (`POST /api/v1/absen`)
- Validasi duplikasi absensi (murid + jadwal + tanggal yang sama)
- Update status absensi (hadir/sakit/alpha/izin)
- Admin dapat menghapus absensi

### 6. Nilai

- Guru/admin input nilai (`POST /api/v1/nilai`) dengan tipe (tugas/UTS/UAS/praktik), semester, dan tahun ajaran
- Guru dan murid dapat melihat daftar nilai
- Update & hapus nilai

### 7. Caching dengan Redis

- Hasil query (list data) di-cache di Redis untuk mempercepat response
- Cache otomatis di-invalidate saat data berubah (cache key berversi per resource)
- Cache dev & test memakai Redis instance yang terpisah

## Pagination, Filtering & Sorting

Semua endpoint daftar (list) mendukung pagination, filtering, dan sorting lewat query parameter.

### Parameter Umum

| Param       | Tipe    | Default | Keterangan                              |
| ----------- | ------- | ------- | --------------------------------------- |
| `page`      | integer | `1`     | Nomor halaman (min. 1)                  |
| `limit`     | integer | `10`    | Jumlah data per halaman (1–100)         |
| `sortBy`    | enum    | —       | Field urutan (sesuai endpoint, lihat bawah) |
| `sortOrder` | enum    | —       | `asc` atau `desc`                       |

> **`sortOrder` wajib ditemani `sortBy`** — jika `sortOrder` dikirim tanpa `sortBy`, urutan default endpoint yang dipakai (keduanya diabaikan).

### Response

Setiap endpoint list mengembalikan `meta` di samping data:

```json
{
  "success": true,
  "data": {
    "mapel": [],
    "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
  }
}
```

### Filter & Sort per Endpoint

| Endpoint         | Filter                                                      | `sortBy`                                | Urutan default |
| ---------------- | ----------------------------------------------------------- | --------------------------------------- | -------------- |
| `/api/v1/mapel`  | `nama`, `kode` (contains, case-insensitive)                 | `nama`, `kode`, `createdAt`             | `nama asc`     |
| `/api/v1/kelas`  | `nama` (contains), `tingkat` (exact)                        | `nama`, `tingkat`                       | `nama asc`     |
| `/api/v1/absen`  | `status` (exact: `hadir`/`sakit`/`alpha`/`izin`)            | `tanggal`, `status`, `createdAt`        | `tanggal desc` |
| `/api/v1/jadwal` | `hari` (exact)                                              | `jamMulai`, `jamSelesai`, `createdAt`   | `jamMulai asc` |
| `/api/v1/nilai`  | `tipe`, `mataPelajaranId`, `tahunAjaran`, `semester`        | `nilai`, `semester`, `createdAt`        | `nilai desc`   |
| `/api/v1/users`  | `role`, `nama`, `email` (contains)                          | `nama`, `role`, `createdAt`             | `nama asc`     |

Contoh pemakaian:

```bash
GET /api/v1/nilai?tipe=UTS&sortBy=nilai&sortOrder=desc&limit=5&page=1
GET /api/v1/users?role=guru&sortBy=nama&sortOrder=asc
GET /api/v1/mapel?nama=mate&limit=1
```

Query tidak valid (`page=0`, `limit=101`, `sortBy` di luar enum, nilai enum salah) → `400 VALIDATION_ERROR`.

## API Endpoints

| Method | Endpoint              | Role          | Keterangan                                     |
| ------ | --------------------- | ------------- | ---------------------------------------------- |
| POST   | `/api/v1/register`    | Public        | Registrasi user                                |
| POST   | `/api/v1/login`       | Public        | Login                                          |
| POST   | `/api/v1/refresh`     | Public        | Tukar refresh token dengan pasangan token baru |
| POST   | `/api/v1/logout`      | Public        | Cabut refresh token (logout)                   |
| GET    | `/api/v1/me`          | Semua         | Lihat profil                                   |
| PATCH  | `/api/v1/me`          | Semua         | Update profil                                  |
| GET    | `/api/v1/users`       | Admin/Guru    | Daftar user (paginasi/filter/sort)             |
| GET    | `/api/v1/users/:id`   | Admin         | Detail user                                    |
| PATCH  | `/api/v1/users/:id`   | Admin         | Update user                                    |
| DELETE | `/api/v1/users/:id`   | Admin         | Hapus user                                     |
| GET    | `/api/v1/kelas`       | Admin/Guru    | Daftar kelas (paginasi/filter/sort)            |
| POST   | `/api/v1/kelas`       | Admin         | Buat kelas                                     |
| GET    | `/api/v1/kelas/:id`   | Admin/Guru    | Detail kelas                                   |
| PATCH  | `/api/v1/kelas/:id`   | Admin         | Update kelas                                   |
| DELETE | `/api/v1/kelas/:id`   | Admin         | Hapus kelas                                    |
| GET    | `/api/v1/mapel`       | Authenticated | Daftar mata pelajaran (paginasi/filter/sort)   |
| POST   | `/api/v1/mapel`       | Admin         | Buat mata pelajaran                            |
| GET    | `/api/v1/mapel/:id`   | Authenticated | Detail mata pelajaran                          |
| PATCH  | `/api/v1/mapel/:id`   | Admin         | Update mata pelajaran                          |
| DELETE | `/api/v1/mapel/:id`   | Admin         | Hapus mata pelajaran                           |
| GET    | `/api/v1/jadwal`      | Authenticated | Daftar jadwal (paginasi/filter/sort)           |
| POST   | `/api/v1/jadwal`      | Admin         | Buat jadwal                                    |
| GET    | `/api/v1/jadwal-saya` | Guru/Murid    | Jadwal saya                                    |
| GET    | `/api/v1/jadwal/:id`  | Authenticated | Detail jadwal                                  |
| PATCH  | `/api/v1/jadwal/:id`  | Admin         | Update jadwal                                  |
| DELETE | `/api/v1/jadwal/:id`  | Admin         | Hapus jadwal                                   |
| GET    | `/api/v1/absen`       | Authenticated | Daftar absensi (paginasi/filter/sort)          |
| POST   | `/api/v1/absen`       | Admin/Guru    | Buat absensi                                   |
| GET    | `/api/v1/absen/:id`   | Authenticated | Detail absensi                                 |
| PATCH  | `/api/v1/absen/:id`   | Admin/Guru    | Update absensi                                 |
| DELETE | `/api/v1/absen/:id`   | Admin         | Hapus absensi                                  |
| GET    | `/api/v1/nilai`       | Authenticated | Daftar nilai (paginasi/filter/sort)            |
| POST   | `/api/v1/nilai`       | Admin/Guru    | Input nilai                                    |
| GET    | `/api/v1/nilai/:id`   | Authenticated | Detail nilai                                   |
| PATCH  | `/api/v1/nilai/:id`   | Admin/Guru    | Update nilai                                   |
| DELETE | `/api/v1/nilai/:id`   | Admin/Guru    | Hapus nilai                                    |

> Endpoint **daftar** mendukung pagination, filtering, dan sorting — lihat [Pagination, Filtering & Sorting](#pagination-filtering--sorting).

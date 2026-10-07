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
- [API Endpoints](#api-endpoints)
- [Alur Refresh Token](#alur-refresh-token)
- [Kontribusi](#kontribusi)

## Prerequisites

Pastikan perangkat kamu sudah terinstal:

- **Node.js** v20 atau lebih baru
- **PostgreSQL** v14+
- **Redis** v6+ (untuk caching)
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

② Tabel Environment (baris 51–57) — ganti seluruh blok

| Variabel                 | Keterangan                                                                    | Contoh                                               |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`           | URL koneksi PostgreSQL                                                        | `postgresql://user:pass@localhost:5432/schoolsystem` |
| `JWT_SECRET`             | Secret untuk **access token**                                                 | `secret-key-anda`                                    |
| `JWT_EXPIRES_IN`         | Masa berlaku access token                                                     | `15m`                                                |
| `JWT_REFRESH_SECRET`     | Secret **terpisah** untuk refresh token (wajib, app gagal start kalau kosong) | `openssl rand -hex 32`                               |
| `JWT_REFRESH_EXPIRES_IN` | Masa berlaku refresh token                                                    | `7d`                                                 |
| `REDIS_URL`              | URL koneksi Redis (opsional)                                                  | `redis://localhost:6379`                             |
| `PORT`                   | Port server                                                                   | `3000`                                               |

> Generate secret acak: `openssl rand -hex 32`. **Jangan pakai `JWT_SECRET` yang sama** untuk refresh token.

## Setup Database

Jalankan migrasi Prisma untuk membuat tabel-tabel di database:

Jalankan migrasi Prisma untuk membuat tabel-tabel di database:

````bash
# Development: generate migrasi + apply ke DB dev (.env)
npm run db:migrate

# Apply migrasi yang sama ke DB test (.env.test)
npm run db:migrate:test

# Sekaligus keduanya (paling sering dipakai)
npm run db:migrate:all
Catatan: setiap kali prisma/schema.prisma diubah, jalankan npm run db:migrate:all
agar DB dev dan DB test ikut ter-update.

Opsional: isi data awal (seed):

```bash
npm run db:seed
````

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
- Cache otomatis di-invalidate saat data berubah

## API Endpoints

| Method | Endpoint              | Role          | Keterangan                                     |
| ------ | --------------------- | ------------- | ---------------------------------------------- |
| POST   | `/api/v1/register`    | Public        | Registrasi user                                |
| POST   | `/api/v1/login`       | Public        | Login                                          |
| GET    | `/api/v1/me`          | Semua         | Lihat profil                                   |
| PATCH  | `/api/v1/me`          | Semua         | Update profil                                  |
| GET    | `/api/v1/users`       | Admin/Guru    | Daftar user                                    |
| GET    | `/api/v1/jadwal`      | Authenticated | Daftar jadwal                                  |
| POST   | `/api/v1/jadwal`      | Admin         | Buat jadwal                                    |
| GET    | `/api/v1/jadwal-saya` | Guru/Murid    | Jadwal saya                                    |
| POST   | `/api/v1/absen`       | Admin/Guru    | Buat absensi                                   |
| GET    | `/api/v1/absen`       | Authenticated | Daftar absensi                                 |
| POST   | `/api/v1/nilai`       | Admin/Guru    | Input nilai                                    |
| GET    | `/api/v1/nilai`       | Authenticated | Daftar nilai                                   |
| POST   | `/api/v1/refresh`     | Public        | Tukar refresh token dengan pasangan token baru |
| POST   | `/api/v1/logout`      | Public        | Cabut refresh token (logout)                   |

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "nis" INTEGER,
    "nip" INTEGER,
    "kelasId" TEXT,
    "mataPelajaranId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tingkat" INTEGER NOT NULL,
    "waliKelasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mapel" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jadwal" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "mataPelajaranId" TEXT,
    "muridId" TEXT,
    "kelasId" TEXT,
    "hari" TEXT NOT NULL,
    "jamMulai" INTEGER NOT NULL,
    "jamSelesai" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "muridId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "mataPelajaranId" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,
    "tipe" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "muridId" TEXT NOT NULL,
    "jadwalId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_tingkat_key" ON "Kelas"("nama", "tingkat");

-- CreateIndex
CREATE UNIQUE INDEX "Mapel_kode_key" ON "Mapel"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_muridId_jadwalId_tanggal_key" ON "Absensi"("muridId", "jadwalId", "tanggal");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mataPelajaranId_fkey" FOREIGN KEY ("mataPelajaranId") REFERENCES "Mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_waliKelasId_fkey" FOREIGN KEY ("waliKelasId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_mataPelajaranId_fkey" FOREIGN KEY ("mataPelajaranId") REFERENCES "Mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_mataPelajaranId_fkey" FOREIGN KEY ("mataPelajaranId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Absensi_tanggal_idx" ON "Absensi"("tanggal");

-- CreateIndex
CREATE INDEX "Absensi_status_tanggal_idx" ON "Absensi"("status", "tanggal");

-- CreateIndex
CREATE INDEX "Jadwal_jamMulai_idx" ON "Jadwal"("jamMulai");

-- CreateIndex
CREATE INDEX "Jadwal_hari_jamMulai_idx" ON "Jadwal"("hari", "jamMulai");

-- CreateIndex
CREATE INDEX "Jadwal_guruId_idx" ON "Jadwal"("guruId");

-- CreateIndex
CREATE INDEX "Jadwal_kelasId_hari_jamMulai_idx" ON "Jadwal"("kelasId", "hari", "jamMulai");

-- CreateIndex
CREATE INDEX "Nilai_tahunAjaran_semester_mataPelajaranId_tipe_nilai_idx" ON "Nilai"("tahunAjaran", "semester", "mataPelajaranId", "tipe", "nilai");

-- CreateIndex
CREATE INDEX "Nilai_nilai_idx" ON "Nilai"("nilai");

-- CreateIndex
CREATE INDEX "User_role_nama_idx" ON "User"("role", "nama");

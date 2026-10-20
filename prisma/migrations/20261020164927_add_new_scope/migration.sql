-- CreateIndex
CREATE INDEX "Absensi_guruId_idx" ON "Absensi"("guruId");

-- CreateIndex
CREATE INDEX "Kelas_waliKelasId_idx" ON "Kelas"("waliKelasId");

-- CreateIndex
CREATE INDEX "Nilai_muridId_idx" ON "Nilai"("muridId");

-- CreateIndex
CREATE INDEX "Nilai_mataPelajaranId_idx" ON "Nilai"("mataPelajaranId");

-- CreateIndex
CREATE INDEX "User_kelasId_idx" ON "User"("kelasId");

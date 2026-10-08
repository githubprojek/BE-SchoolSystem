import { prisma } from './client.js';
import { logger } from '../logging/logger.js';
import { redis } from '../cache/redis.js';
import { bumpVersion } from '../cache/version.js';
import { invalidateCache } from '../cache/helper.js';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'admin123';
const TAHUN_AJARAN = '2026/2027';

async function seed() {
  logger.info('Seeding database...');

  const password = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sekolah.com' },
    update: {},
    create: {
      nama: 'Admin Sekolah',
      email: 'admin@sekolah.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  logger.info({ userId: admin.id }, 'Admin user created');

  const mapelData = [
    { nama: 'Matematika', kode: 'MTK' },
    { nama: 'Bahasa Indonesia', kode: 'BINDO' },
    { nama: 'Bahasa Inggris', kode: 'BING' },
    { nama: 'IPA', kode: 'IPA' },
    { nama: 'IPS', kode: 'IPS' },
  ];

  const mapelList = [];
  for (const m of mapelData) {
    const mapel = await prisma.mapel.upsert({
      where: { kode: m.kode },
      update: {},
      create: m,
    });
    mapelList.push(mapel);
    logger.info({ mapelId: mapel.id, kode: mapel.kode }, 'Mapel created');
  }

  const kelasData = [
    { nama: 'X-A', tingkat: 10 },
    { nama: 'X-B', tingkat: 10 },
    { nama: 'XI-A', tingkat: 11 },
    { nama: 'XI-B', tingkat: 11 },
    { nama: 'XII-A', tingkat: 12 },
    { nama: 'XII-B', tingkat: 12 },
  ];

  const kelasList = [];
  for (const k of kelasData) {
    const kelas = await prisma.kelas.upsert({
      where: { nama_tingkat: { nama: k.nama, tingkat: k.tingkat } },
      update: {},
      create: k,
    });
    kelasList.push(kelas);
    logger.info({ kelasId: kelas.id, nama: kelas.nama }, 'Kelas created');
  }

  const guruSpecs = [
    { nama: 'Pak Budi', email: 'budi@sekolah.com', nip: 1001, kode: 'MTK' },
    { nama: 'Bu Sari', email: 'sari@sekolah.com', nip: 1002, kode: 'BINDO' },
    { nama: 'Pak Andi', email: 'andi@sekolah.com', nip: 1003, kode: 'IPA' },
  ];

  const guruList = [];
  for (const g of guruSpecs) {
    const mapel = mapelList.find((m) => m.kode === g.kode);
    const guru = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: {
        nama: g.nama,
        email: g.email,
        password,
        role: 'guru',
        nip: g.nip,
        mataPelajaranId: mapel?.id,
      },
    });
    guruList.push(guru);
    logger.info({ guruId: guru.id, email: guru.email }, 'Guru created');
  }

  const muridSpecs = [
    { nama: 'Siti', email: 'siti@sekolah.com', nis: 10001, kelas: 'X-A' },
    { nama: 'Rudi', email: 'rudi@sekolah.com', nis: 10002, kelas: 'X-A' },
    { nama: 'Dewi', email: 'dewi@sekolah.com', nis: 10003, kelas: 'X-B' },
    { nama: 'Joko', email: 'joko@sekolah.com', nis: 10004, kelas: 'X-B' },
    { nama: 'Ani', email: 'ani@sekolah.com', nis: 10005, kelas: 'XI-A' },
    { nama: 'Bagus', email: 'bagus@sekolah.com', nis: 10006, kelas: 'XI-A' },
    { nama: 'Citra', email: 'citra@sekolah.com', nis: 10007, kelas: 'XII-A' },
    { nama: 'Doni', email: 'doni@sekolah.com', nis: 10008, kelas: 'XII-A' },
  ];

  const muridList = [];
  for (const m of muridSpecs) {
    const kelas = kelasList.find((k) => k.nama === m.kelas);
    const murid = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        nama: m.nama,
        email: m.email,
        password,
        role: 'murid',
        nis: m.nis,
        kelasId: kelas?.id,
      },
    });
    muridList.push(murid);
    logger.info({ muridId: murid.id, email: murid.email }, 'Murid created');
  }

  const findGuru = (email) => guruList.find((g) => g.email === email);
  const findMapel = (kode) => mapelList.find((m) => m.kode === kode);
  const findKelas = (nama) => kelasList.find((k) => k.nama === nama);

  const jadwalSpecs = [
    {
      guru: 'budi@sekolah.com',
      hari: 'senin',
      jamMulai: 420,
      jamSelesai: 520,
      kelas: 'X-A',
      kode: 'MTK',
    },
    {
      guru: 'sari@sekolah.com',
      hari: 'senin',
      jamMulai: 540,
      jamSelesai: 640,
      kelas: 'X-A',
      kode: 'BINDO',
    },
    {
      guru: 'andi@sekolah.com',
      hari: 'selasa',
      jamMulai: 420,
      jamSelesai: 520,
      kelas: 'X-A',
      kode: 'IPA',
    },
    {
      guru: 'budi@sekolah.com',
      hari: 'rabu',
      jamMulai: 600,
      jamSelesai: 700,
      kelas: 'XI-A',
      kode: 'MTK',
    },
    {
      guru: 'sari@sekolah.com',
      hari: 'kamis',
      jamMulai: 780,
      jamSelesai: 880,
      kelas: 'XI-A',
      kode: 'BINDO',
    },
    {
      guru: 'andi@sekolah.com',
      hari: 'jumat',
      jamMulai: 480,
      jamSelesai: 580,
      kelas: 'X-B',
      kode: 'IPA',
    },
  ];

  const jadwalList = [];
  for (const j of jadwalSpecs) {
    const guru = findGuru(j.guru);
    const kelas = findKelas(j.kelas);
    const mapel = findMapel(j.kode);
    const muridDiKelas = muridList.find((m) => m.kelasId === kelas?.id);

    const existing = await prisma.jadwal.findFirst({
      where: { guruId: guru.id, hari: j.hari, jamMulai: j.jamMulai },
    });
    if (existing) {
      jadwalList.push(existing);
      continue;
    }

    const jadwal = await prisma.jadwal.create({
      data: {
        guruId: guru.id,
        muridId: muridDiKelas?.id,
        mataPelajaranId: mapel?.id,
        kelasId: kelas?.id,
        hari: j.hari,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai,
      },
      include: { guru: true, kelas: true },
    });
    jadwalList.push(jadwal);
    logger.info({ jadwalId: jadwal.id, hari: j.hari }, 'Jadwal created');
  }

  const tanggalList = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06'];
  const statusList = ['hadir', 'sakit', 'alpha', 'izin'];

  const absensiMurid = muridList.filter((m) =>
    ['X-A', 'X-B'].some((nama) => findKelas(nama)?.id === m.kelasId),
  );

  let absenIdx = 0;
  for (const tanggal of tanggalList) {
    for (const murid of absensiMurid) {
      const jadwal = jadwalList.find((j) => j.kelasId === murid.kelasId) ?? jadwalList[0];

      await prisma.absensi.upsert({
        where: {
          muridId_jadwalId_tanggal: {
            muridId: murid.id,
            jadwalId: jadwal.id,
            tanggal: new Date(tanggal),
          },
        },
        update: {},
        create: {
          muridId: murid.id,
          guruId: jadwal.guruId,
          jadwalId: jadwal.id,
          tanggal: new Date(tanggal),
          status: statusList[absenIdx % statusList.length],
        },
      });
      absenIdx++;
    }
  }
  logger.info({ count: absenIdx }, 'Absensi seeded');

  const tipeList = ['tugas', 'UTS'];
  const nilaiMurid = absensiMurid;
  const nilaiMapel = [findMapel('MTK'), findMapel('BINDO')];

  let nilaiIdx = 0;
  for (const murid of nilaiMurid) {
    for (const mapel of nilaiMapel) {
      const guru = guruList.find((g) => g.mataPelajaranId === mapel.id);
      for (const tipe of tipeList) {
        const existing = await prisma.nilai.findFirst({
          where: {
            muridId: murid.id,
            mataPelajaranId: mapel.id,
            tipe,
            semester: 1,
            tahunAjaran: TAHUN_AJARAN,
          },
        });
        if (existing) continue;

        await prisma.nilai.create({
          data: {
            muridId: murid.id,
            guruId: guru.id,
            mataPelajaranId: mapel.id,
            nilai: 60 + ((nilaiIdx * 7) % 40),
            tipe,
            semester: 1,
            tahunAjaran: TAHUN_AJARAN,
          },
        });
        nilaiIdx++;
      }
    }
  }
  logger.info({ count: nilaiIdx }, 'Nilai seeded');

  await Promise.all([
    invalidateCache('mapel:all'),
    invalidateCache('user:all'),
    invalidateCache('nilai:all'),
    invalidateCache('jadwal:all'),
  ]);
  await Promise.all([
    bumpVersion('kelas'),
    bumpVersion('absensi'),
    bumpVersion('jadwal'),
    bumpVersion('mapel'),
    bumpVersion('user'),
    bumpVersion('nilai'),
  ]);

  logger.info('Seeding complete');
}

seed()
  .catch((err) => {
    logger.error(err, 'Seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (redis) redis.disconnect();
  });

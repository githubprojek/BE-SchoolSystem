import { prisma } from './client.js';
import { logger } from '../logging/logger.js';
import bcrypt from 'bcryptjs';

async function seed() {
  logger.info('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sekolah.com' },
    update: {},
    create: {
      nama: 'Admin',
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

  for (const m of mapelData) {
    const mapel = await prisma.mapel.upsert({
      where: { kode: m.kode },
      update: {},
      create: m,
    });
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

  for (const k of kelasData) {
    const kelas = await prisma.kelas.upsert({
      where: { nama_tingkat: { nama: k.nama, tingkat: k.tingkat } },
      update: {},
      create: k,
    });
    logger.info({ kelasId: kelas.id, nama: kelas.nama }, 'Kelas created');
  }

  logger.info('Seeding complete');
}

seed()
  .catch((err) => {
    logger.error(err, 'Seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

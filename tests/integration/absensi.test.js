import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Absensi API', { concurrency: false }, () => {
  let adminToken;
  let guruToken;
  let mapelId;
  let kelasId;
  let guruId;
  let muridId;
  let jadwalId;

  before(async () => {
    await prisma.absensi.deleteMany();
    await prisma.nilai.deleteMany();
    await prisma.jadwal.deleteMany();
    await prisma.user.deleteMany();
    await prisma.kelas.deleteMany();
    await prisma.mapel.deleteMany();

    const mapel = await prisma.mapel.create({ data: { nama: 'Matematika', kode: 'MTK' } });
    mapelId = mapel.id;

    const kelas = await prisma.kelas.create({ data: { nama: 'X-A', tingkat: 10 } });
    kelasId = kelas.id;

    const adminRes = await request.post('/api/v1/register').send({
      nama: 'Admin',
      email: 'admin@test.com',
      password: 'admin1234',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    const guruRes = await request.post('/api/v1/register').send({
      nama: 'Pak Budi',
      email: 'guru@test.com',
      password: 'password123',
      role: 'guru',
      nip: 12345,
      mataPelajaran: mapelId,
    });
    guruToken = guruRes.body.data.token;
    guruId = guruRes.body.data.user.id;

    const muridRes = await request.post('/api/v1/register').send({
      nama: 'Siti',
      email: 'murid@test.com',
      password: 'password123',
      role: 'murid',
      nis: 67890,
      kelas: kelasId,
    });
    muridId = muridRes.body.data.user.id;

    const jadwalRes = await request
      .post('/api/v1/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        guru: guruId,
        murid: muridId,
        mataPelajaran: mapelId,
        kelas: kelasId,
        hari: 'senin',
        jamMulai: '07:00',
        jamSelesai: '08:40',
      });
    jadwalId = jadwalRes.body.data.id;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/absen - creates attendance (guru)', async () => {
    const res = await request
      .post('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`)
      .send({
        guru: guruId,
        murid: muridId,
        jadwal: jadwalId,
        tanggal: '2026-07-22',
        status: 'hadir',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'hadir');
  });

  it('POST /api/v1/absen - 409 duplicate attendance (same murid+jadwal+tanggal)', async () => {
    const res = await request
      .post('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`)
      .send({
        guru: guruId,
        murid: muridId,
        jadwal: jadwalId,
        tanggal: '2026-07-22',
        status: 'hadir',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('POST /api/v1/absen - 401 without token', async () => {
    const res = await request.post('/api/v1/absen').send({
      guru: guruId,
      murid: muridId,
      jadwal: jadwalId,
      tanggal: '2026-07-23',
      status: 'sakit',
    });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/absen - returns all attendance', async () => {
    const res = await request
      .get('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.absensi));
    assert.equal(res.body.data.absensi.length, 1);
  });

  it('GET /api/v1/absen/:id - returns attendance by id', async () => {
    const list = await request
      .get('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .get(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.absensi.id, absensiId);
    assert.equal(res.body.data.absensi.status, 'hadir');
  });

  it('GET /api/v1/absen/:id - 404 not found', async () => {
    const res = await request
      .get('/api/v1/absen/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('PATCH /api/v1/absen/:id - updates attendance (guru)', async () => {
    const list = await request
      .get('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .patch(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${guruToken}`)
      .send({ status: 'sakit' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.absensi.status, 'sakit');
  });

  it('DELETE /api/v1/absensi/:id - deletes attendance (admin)', async () => {
    const list = await request
      .get('/api/v1/absen')
      .set('Authorization', `Bearer ${adminToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .delete(`/api/v1/absensi/${absensiId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });
});

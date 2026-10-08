import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Jadwal API', { concurrency: false }, () => {
  let adminToken;
  let guruToken;
  let muridToken;
  let mapelId;
  let kelasId;
  let guruId;
  let muridId;

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

    const guruRes = await request.post('/api/v1/register').send({
      nama: 'Budi',
      email: 'budi@test.com',
      password: 'password123',
      role: 'guru',
      nip: 12345,
      mataPelajaranId: mapelId,
    });
    guruToken = guruRes.body.data.token;
    guruId = guruRes.body.data.user.id;

    const muridRes = await request.post('/api/v1/register').send({
      nama: 'Siti',
      email: 'siti@test.com',
      password: 'password123',
      role: 'murid',
      nis: 67890,
      kelasId: kelasId,
    });
    muridToken = muridRes.body.data.token;
    muridId = muridRes.body.data.user.id;

    const adminRes = await request.post('/api/v1/register').send({
      nama: 'Admin',
      email: 'admin@test.com',
      password: 'admin1234',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/jadwal - creates schedule (admin)', async () => {
    const res = await request
      .post('/api/v1/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        guruId: guruId,
        muridId: muridId,
        mataPelajaranId: mapelId,
        kelasId: kelasId,
        hari: 'senin',
        jamMulai: '07:00',
        jamSelesai: '08:40',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.hari, 'senin');
    assert.equal(res.body.data.jamMulai, 420);
    assert.equal(res.body.data.jamSelesai, 520);
  });

  it('POST /api/v1/jadwal - 409 schedule overlap', async () => {
    const res = await request
      .post('/api/v1/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        guruId: guruId,
        muridId: muridId,
        mataPelajaranId: mapelId,
        kelasId: kelasId,
        hari: 'senin',
        jamMulai: '08:00',
        jamSelesai: '09:30',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('POST /api/v1/jadwal - 401 without token', async () => {
    const res = await request.post('/api/v1/jadwal').send({
      guruId: guruId,
      mataPelajaranId: mapelId,
      hari: 'selasa',
      jamMulai: '07:00',
      jamSelesai: '08:40',
    });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/jadwal - returns all schedules', async () => {
    const res = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.jadwal));
    assert.equal(res.body.data.jadwal.length, 1);
  });

  it('GET /api/v1/jadwal/:id - returns schedule by id', async () => {
    const list = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);
    const jadwalId = list.body.data.jadwal[0].id;

    const res = await request
      .get(`/api/v1/jadwal/${jadwalId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.jadwal.id, jadwalId);
    assert.equal(res.body.data.jadwal.hari, 'senin');
  });

  it('GET /api/v1/jadwal-saya - returns schedules for guru', async () => {
    const res = await request
      .get('/api/v1/jadwal-saya')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.jadwal !== undefined);
  });

  it('GET /api/v1/jadwal-saya - returns schedules for murid (by kelas)', async () => {
    const res = await request
      .get('/api/v1/jadwal-saya')
      .set('Authorization', `Bearer ${muridToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.jadwal !== undefined);
  });

  it('PATCH /api/v1/jadwal/:id - updates schedule (admin)', async () => {
    const list = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);
    const jadwalId = list.body.data.jadwal[0].id;

    const res = await request
      .patch(`/api/v1/jadwal/${jadwalId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ jamMulai: '09:00', jamSelesai: '10:40' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.jadwal.jamMulai, 540);
    assert.equal(res.body.data.jadwal.jamSelesai, 640);
  });

  it('DELETE /api/v1/jadwal/:id - deletes schedule (admin)', async () => {
    const list = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);
    const jadwalId = list.body.data.jadwal[0].id;

    const res = await request
      .delete(`/api/v1/jadwal/${jadwalId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });

  it('GET /api/v1/jadwal - default pagination returns meta', async () => {
    const res = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.meta, { page: 1, limit: 10, total: 0, totalPages: 0 });
    assert.equal(res.body.data.jadwal.length, 0);
  });

  it('GET /api/v1/jadwal?hari=senin - filter by day', async () => {
    await request.post('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`).send({
      guruId,
      muridId,
      mataPelajaranId: mapelId,
      kelasId,
      hari: 'senin',
      jamMulai: '07:00',
      jamSelesai: '08:40',
    });

    const res = await request
      .get('/api/v1/jadwal?hari=senin')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.jadwal.length, 1);
    assert.equal(res.body.data.jadwal[0].hari, 'senin');
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/jadwal - sorted by jamMulai asc by default', async () => {
    await request.post('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`).send({
      guruId,
      muridId,
      mataPelajaranId: mapelId,
      kelasId,
      hari: 'selasa',
      jamMulai: '06:00',
      jamSelesai: '07:00',
    });

    const res = await request.get('/api/v1/jadwal').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.jadwal.length, 2);
    assert.equal(res.body.data.jadwal[0].jamMulai, 360);
    assert.equal(res.body.data.jadwal[1].jamMulai, 420);
    assert.equal(res.body.data.meta.total, 2);
  });

  it('GET /api/v1/jadwal?sortBy=jamMulai&sortOrder=desc - sort descending', async () => {
    const res = await request
      .get('/api/v1/jadwal?sortBy=jamMulai&sortOrder=desc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.jadwal[0].jamMulai, 420);
    assert.equal(res.body.data.jadwal[1].jamMulai, 360);
  });

  it('GET /api/v1/jadwal - invalid query returns 400', async () => {
    for (const qs of ['hari=minggu', 'sortBy=hari', 'page=0', 'limit=101']) {
      const res = await request
        .get(`/api/v1/jadwal?${qs}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', qs);
    }
  });
});

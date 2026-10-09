import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Nilai API', { concurrency: false }, () => {
  let guruToken;
  let mapelId;
  let guruId;
  let muridId;

  const createNilai = (data) =>
    request
      .post('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`)
      .send({
        muridId,
        guruId,
        mataPelajaranId: mapelId,
        semester: 1,
        tahunAjaran: '2026/2027',
        ...data,
      });

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
    const kelasId = kelas.id;

    const guruRes = await request.post('/api/v1/register').send({
      nama: 'Pak Budi',
      email: 'guru@test.com',
      password: 'password123',
      role: 'guru',
      nip: 12345,
      mataPelajaranId: mapelId,
    });
    guruToken = guruRes.body.data.token;
    guruId = guruRes.body.data.user.id;

    const muridRes = await request.post('/api/v1/register').send({
      nama: 'Siti',
      email: 'murid@test.com',
      password: 'password123',
      role: 'murid',
      nis: 67890,
      kelasId: kelasId,
    });
    muridId = muridRes.body.data.user.id;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/nilai - creates grade (guru)', async () => {
    const res = await request
      .post('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`)
      .send({
        muridId: muridId,
        guruId: guruId,
        mataPelajaranId: mapelId,
        nilai: 85,
        tipe: 'tugas',
        semester: 1,
        tahunAjaran: '2026/2027',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.nilai, 85);
    assert.equal(res.body.data.tipe, 'tugas');
    assert.equal(res.body.data.semester, 1);
    assert.equal(res.body.data.tahunAjaran, '2026/2027');
  });

  it('POST /api/v1/nilai - 401 without token', async () => {
    const res = await request.post('/api/v1/nilai').send({
      muridId: muridId,
      guruId: guruId,
      mataPelajaranId: mapelId,
      nilai: 90,
      tipe: 'UTS',
      semester: 1,
      tahunAjaran: '2026/2027',
    });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/nilai - returns all grades', async () => {
    const res = await request
      .get('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.nilai));
    assert.equal(res.body.data.nilai.length, 1);
  });

  it('GET /api/v1/nilai/:id - returns grade by id', async () => {
    const list = await request
      .get('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`);
    const nilaiId = list.body.data.nilai[0].id;

    const res = await request
      .get(`/api/v1/nilai/${nilaiId}`)
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.id, nilaiId);
    assert.equal(res.body.data.nilai.nilai, 85);
  });

  it('GET /api/v1/nilai/:id - 404 not found', async () => {
    const res = await request
      .get('/api/v1/nilai/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('PATCH /api/v1/nilai/:id - updates grade (guru)', async () => {
    const list = await request
      .get('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`);
    const nilaiId = list.body.data.nilai[0].id;

    const res = await request
      .patch(`/api/v1/nilai/${nilaiId}`)
      .set('Authorization', `Bearer ${guruToken}`)
      .send({ nilai: 95 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.nilai, 95);
  });

  it('DELETE /api/v1/nilai/:id - deletes grade (guru)', async () => {
    const list = await request
      .get('/api/v1/nilai')
      .set('Authorization', `Bearer ${guruToken}`);
    const nilaiId = list.body.data.nilai[0].id;

    const res = await request
      .delete(`/api/v1/nilai/${nilaiId}`)
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 204);
  });

  it('POST /api/v1/nilai - creates grades for pagination (guru)', async () => {
    const grades = [
      { nilai: 85, tipe: 'tugas' },
      { nilai: 70, tipe: 'UTS' },
      { nilai: 90, tipe: 'UAS' },
    ];

    for (const grade of grades) {
      const res = await createNilai(grade);
      assert.equal(res.status, 201);
    }
  });

  it('GET /api/v1/nilai - default pagination returns meta', async () => {
    const res = await request.get('/api/v1/nilai').set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.length, 3);
    assert.deepEqual(res.body.data.meta, { page: 1, limit: 10, total: 3, totalPages: 1 });
  });

  it('GET /api/v1/nilai - sorted by nilai desc by default', async () => {
    const res = await request.get('/api/v1/nilai').set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.nilai.map((n) => n.nilai),
      [90, 85, 70],
    );
  });

  it('GET /api/v1/nilai?limit=1 - paginates result', async () => {
    const res = await request
      .get('/api/v1/nilai?limit=1')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.length, 1);
    assert.deepEqual(res.body.data.meta, { page: 1, limit: 1, total: 3, totalPages: 3 });

    const page2 = await request
      .get('/api/v1/nilai?limit=1&page=2')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(page2.body.data.nilai.length, 1);
    assert.equal(page2.body.data.meta.page, 2);
  });

  it('GET /api/v1/nilai?tipe=UTS - filters grades by tipe', async () => {
    const res = await request
      .get('/api/v1/nilai?tipe=UTS')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.length, 1);
    assert.equal(res.body.data.nilai[0].tipe, 'UTS');
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/nilai?mataPelajaranId=... - filters grades by subject', async () => {
    const res = await request
      .get(`/api/v1/nilai?mataPelajaranId=${mapelId}`)
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.nilai.length, 3);
    assert.equal(res.body.data.meta.total, 3);
  });

  it('GET /api/v1/nilai?sortBy=nilai&sortOrder=asc - sort ascending', async () => {
    const res = await request
      .get('/api/v1/nilai?sortBy=nilai&sortOrder=asc')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.nilai.map((n) => n.nilai),
      [70, 85, 90],
    );
  });

  it('GET /api/v1/nilai - invalid query returns 400', async () => {
    for (const qs of ['page=0', 'limit=101', 'tipe=exam', 'semester=abc', 'sortBy=unknown', 'sortOrder=up']) {
      const res = await request
        .get(`/api/v1/nilai?${qs}`)
        .set('Authorization', `Bearer ${guruToken}`);

      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', qs);
    }
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Mapel API', { concurrency: false }, () => {
  let adminToken;

  before(async () => {
    await prisma.absensi.deleteMany();
    await prisma.nilai.deleteMany();
    await prisma.jadwal.deleteMany();
    await prisma.user.deleteMany();
    await prisma.kelas.deleteMany();
    await prisma.mapel.deleteMany();

    const res = await request.post('/api/v1/register').send({
      nama: 'Admin',
      email: 'admin@test.com',
      password: 'admin1234',
      role: 'admin',
    });
    adminToken = res.body.data.token;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/mapel - creates mapel (admin)', async () => {
    const res = await request
      .post('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'Matematika', kode: 'MTK' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.nama, 'Matematika');
    assert.equal(res.body.data.kode, 'MTK');
  });

  it('POST /api/v1/mapel - 409 duplicate kode', async () => {
    const res = await request
      .post('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'Matematika Lanjut', kode: 'MTK' });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('POST /api/v1/mapel - 401 without token', async () => {
    const res = await request.post('/api/v1/mapel').send({ nama: 'IPA', kode: 'IPA' });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/mapel - returns all mapel', async () => {
    const res = await request
      .get('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.mapel));
    assert.equal(res.body.data.mapel.length, 1);
  });

  it('GET /api/v1/mapel/:id - returns mapel by id', async () => {
    const list = await request
      .get('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`);
    const mapelId = list.body.data.mapel[0].id;

    const res = await request
      .get(`/api/v1/mapel/${mapelId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.id, mapelId);
    assert.equal(res.body.data.mapel.nama, 'Matematika');
  });

  it('GET /api/v1/mapel/:id - 404 not found', async () => {
    const res = await request
      .get('/api/v1/mapel/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('PATCH /api/v1/mapel/:id - updates mapel (admin)', async () => {
    const list = await request
      .get('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`);
    const mapelId = list.body.data.mapel[0].id;

    const res = await request
      .patch(`/api/v1/mapel/${mapelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'Matematika Wajib' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.nama, 'Matematika Wajib');
  });

  it('DELETE /api/v1/mapel/:id - deletes mapel (admin)', async () => {
    const list = await request
      .get('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`);
    const mapelId = list.body.data.mapel[0].id;

    const res = await request
      .delete(`/api/v1/mapel/${mapelId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });

  it('GET /api/v1/mapel - default pagination returns meta', async () => {
    const res = await request.get('/api/v1/mapel').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.meta, { page: 1, limit: 10, total: 0, totalPages: 0 });
    assert.equal(res.body.data.mapel.length, 0);
  });

  it('GET /api/v1/mapel?limit=2 - paginates result', async () => {
    await request
      .post('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'Matematika', kode: 'MTK' });
    await request
      .post('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'Bahasa Indonesia', kode: 'BINDO' });
    await request
      .post('/api/v1/mapel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'IPA Terpadu', kode: 'IPA' });

    const res = await request
      .get('/api/v1/mapel?limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.length, 2);
    assert.deepEqual(res.body.data.meta, { page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await request
      .get('/api/v1/mapel?limit=2&page=2')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(page2.body.data.mapel.length, 1);
    assert.equal(page2.body.data.meta.page, 2);
  });

  it('GET /api/v1/mapel - sorted by nama asc by default', async () => {
    const res = await request.get('/api/v1/mapel').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.length, 3);
    assert.equal(res.body.data.mapel[0].nama, 'Bahasa Indonesia');
    assert.equal(res.body.data.mapel[1].nama, 'IPA Terpadu');
    assert.equal(res.body.data.mapel[2].nama, 'Matematika');
  });

  it('GET /api/v1/mapel?nama=mate - filter by name (case-insensitive)', async () => {
    const res = await request
      .get('/api/v1/mapel?nama=mate')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.length, 1);
    assert.equal(res.body.data.mapel[0].kode, 'MTK');
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/mapel?kode=ind - filter by code', async () => {
    const res = await request
      .get('/api/v1/mapel?kode=ind')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel.length, 1);
    assert.equal(res.body.data.mapel[0].kode, 'BINDO');
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/mapel?sortBy=kode&sortOrder=desc - sort descending', async () => {
    const res = await request
      .get('/api/v1/mapel?sortBy=kode&sortOrder=desc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.mapel[0].kode, 'MTK');
    assert.equal(res.body.data.mapel[1].kode, 'IPA');
    assert.equal(res.body.data.mapel[2].kode, 'BINDO');
  });

  it('GET /api/v1/mapel - invalid query returns 400', async () => {
    for (const qs of ['page=0', 'limit=101', 'sortBy=unknown', 'sortOrder=up']) {
      const res = await request
        .get(`/api/v1/mapel?${qs}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR', qs);
    }
  });
});

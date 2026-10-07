import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Kelas API', { concurrency: false }, () => {
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

  it('POST /api/v1/kelas - creates a class (admin)', async () => {
    const res = await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A', tingkat: 10 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.nama, 'X-A');
    assert.equal(res.body.data.tingkat, 10);
  });

  it('POST /api/v1/kelas - 409 duplicate nama + tingkat', async () => {
    const res = await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A', tingkat: 10 });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('POST /api/v1/kelas - 401 without token', async () => {
    const res = await request.post('/api/v1/kelas').send({ nama: 'X-B', tingkat: 10 });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/kelas - returns all classes', async () => {
    const res = await request.get('/api/v1/kelas').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.kelas));
    assert.equal(res.body.data.kelas.length, 1);
  });

  it('GET /api/v1/kelas/:id - returns class by id', async () => {
    const list = await request.get('/api/v1/kelas').set('Authorization', `Bearer ${adminToken}`);
    const kelasId = list.body.data.kelas[0].id;

    const res = await request
      .get(`/api/v1/kelas/${kelasId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas.id, kelasId);
    assert.equal(res.body.data.kelas.nama, 'X-A');
  });

  it('GET /api/v1/kelas/:id - 404 not found', async () => {
    const res = await request
      .get('/api/v1/kelas/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('PATCH /api/v1/kelas/:id - updates class (admin)', async () => {
    const list = await request.get('/api/v1/kelas').set('Authorization', `Bearer ${adminToken}`);
    const kelasId = list.body.data.kelas[0].id;

    const res = await request
      .patch(`/api/v1/kelas/${kelasId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A Updated' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas.nama, 'X-A Updated');
  });

  it('DELETE /api/v1/kelas/:id - deletes class (admin)', async () => {
    const list = await request.get('/api/v1/kelas').set('Authorization', `Bearer ${adminToken}`);
    const kelasId = list.body.data.kelas[0].id;

    const res = await request
      .delete(`/api/v1/kelas/${kelasId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });

  it('GET /api/v1/kelas - default pagination (no filter/sort)', async () => {
    const res = await request.get('/api/v1/kelas').set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.meta, {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
    assert.equal(res.body.data.kelas.length, 0);
  });

  it('GET /api/v1/kelas?filter=nama=X - filter by name', async () => {
    await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A', tingkat: 10 });

    const res = await request
      .get('/api/v1/kelas?filter=nama=X')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas.length, 1);
    assert.equal(res.body.data.kelas[0].nama, 'X-A');
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/kelas?filter=tingkat=10 - filter by grade', async () => {
    await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-B', tingkat: 10 });

    const res = await request
      .get('/api/v1/kelas?filter=tingkat=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas.length, 2); // 2 kelas tingkat 10
    assert.equal(res.body.data.meta.total, 2);
  });

  it('GET /api/v1/kelas?sortBy=nama&sortOrder=asc - sort ascending', async () => {
    // Create 2 kelas dengan nama berbeda
    await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-B', tingkat: 10 });

    await request
      .post('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A', tingkat: 10 });

    const res = await request
      .get('/api/v1/kelas?sortBy=nama&sortOrder=asc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas[0].nama, 'X-A'); // A sebelum B
    assert.equal(res.body.data.kelas[1].nama, 'X-B');
    assert.equal(res.body.data.meta.total, 2);
  });

  it('GET /api/v1/kelas?sortBy=tingkat&sortOrder=desc - sort descending', async () => {
    const res = await request
      .get('/api/v1/kelas?sortBy=tingkat&sortOrder=desc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    // Urutan ter tinggi dulu
    assert.equal(res.body.data.kelas[0].tingkat, 10); // misal ada kelas 12
    assert.equal(res.body.data.meta.total, 2);
  });

  it('GET /api/v1/kelas?page=2&limit=1 - paginate to specific page', async () => {
    // Asumsi udah ada 3 kelas (dari test create sebelumnya atau di-setiap test)
    const res = await request
      .get('/api/v1/kelas?page=2&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.meta.page, 2);
    assert.equal(res.body.data.meta.limit, 1);
    assert.equal(res.body.data.kelas.length, 1);
    // Kelas di halaman 2 harus berbeda halaman 1
    assert.notEqual(
      res.body.data.kelas[0].id,
      (
        await request
          .get('/api/v1/kelas?page=1&limit=1')
          .set('Authorization', `Bearer ${adminToken}`)
      ).body.data.kelas[0].id,
    );
  });

  it('GET /api/v1/kelas?page=0 - invalid page returns 400', async () => {
    const res = await request
      .get('/api/v1/kelas?page=0')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('GET /api/v1/kelas?limit=101 - invalid limit returns 400', async () => {
    const res = await request
      .get('/api/v1/kelas?limit=101')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

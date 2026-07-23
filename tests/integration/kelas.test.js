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
    const res = await request
      .get('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.kelas));
    assert.equal(res.body.data.kelas.length, 1);
  });

  it('GET /api/v1/kelas/:id - returns class by id', async () => {
    const list = await request
      .get('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`);
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
    const list = await request
      .get('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`);
    const kelasId = list.body.data.kelas[0].id;

    const res = await request
      .patch(`/api/v1/kelas/${kelasId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'X-A Updated' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.kelas.nama, 'X-A Updated');
  });

  it('DELETE /api/v1/kelas/:id - deletes class (admin)', async () => {
    const list = await request
      .get('/api/v1/kelas')
      .set('Authorization', `Bearer ${adminToken}`);
    const kelasId = list.body.data.kelas[0].id;

    const res = await request
      .delete(`/api/v1/kelas/${kelasId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });
});

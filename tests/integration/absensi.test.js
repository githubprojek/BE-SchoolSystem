import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';
import { bootstrapAdmin, registerAs } from '../helpers/auth.js';

const request = supertest(app);

describe('Absensi API', { concurrency: false }, () => {
  let adminToken;
  let guruToken;
  let guru2Token;
  let mapelId;
  let kelasId;
  let guruId;
  let muridId;
  let jadwalId;
  let muridToken;
  let murid2Id;
  let guruBedaMapelToken;
  let guruWaliToken;

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

    const admin = await bootstrapAdmin(request);
    adminToken = admin.token;

    const guru = await registerAs(request, adminToken, {
      nama: 'Pak Budi',
      email: 'guru@test.com',
      password: 'password123',
      role: 'guru',
      nip: 12345,
      mataPelajaranId: mapelId,
    });
    guruToken = guru.token;
    guruId = guru.user.id;

    const guru2 = await registerAs(request, adminToken, {
      nama: 'Pak Lain',
      email: 'guru2@test.com',
      password: 'password123',
      role: 'guru',
      nip: 54321,
      mataPelajaranId: mapelId,
    });
    guru2Token = guru2.token;

    const murid = await registerAs(request, adminToken, {
      nama: 'Siti',
      email: 'murid@test.com',
      password: 'password123',
      role: 'murid',
      nis: 67890,
      kelasId: kelasId,
    });
    muridId = murid.user.id;

    muridToken = murid.token;

    const murid2 = await registerAs(request, adminToken, {
      nama: 'Andi',
      email: 'murid2@test.com',
      password: 'password123',
      role: 'murid',
      nis: 22222,
      kelasId: kelasId,
    });
    murid2Id = murid2.user.id;

    const jadwalRes = await request
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
        guruId: guruId,
        muridId: muridId,
        jadwalId: jadwalId,
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
        guruId: guruId,
        muridId: muridId,
        jadwalId: jadwalId,
        tanggal: '2026-07-22',
        status: 'hadir',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('POST /api/v1/absen - 401 without token', async () => {
    const res = await request.post('/api/v1/absen').send({
      guruId: guruId,
      muridId: muridId,
      jadwalId: jadwalId,
      tanggal: '2026-07-23',
      status: 'sakit',
    });

    assert.equal(res.status, 401);
  });

  it('GET /api/v1/absen - returns all attendance', async () => {
    const res = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.absensi));
    assert.equal(res.body.data.absensi.length, 1);
  });

  it('GET /api/v1/absen/:id - returns attendance by id', async () => {
    const list = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);
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
    const list = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .patch(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${guruToken}`)
      .send({ status: 'sakit' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.absensi.status, 'sakit');
  });

  it('PATCH /api/v1/absen/:id - 403 when another guru edits your record (security fix #2)', async () => {
    const list = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .patch(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${guru2Token}`)
      .send({ status: 'alpha' });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    const check = await request
      .get(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${guruToken}`);
    assert.equal(check.body.data.absensi.status, 'sakit');
  });

  it('DELETE /api/v1/absen/:id - deletes attendance (admin)', async () => {
    const list = await request.get('/api/v1/absen').set('Authorization', `Bearer ${adminToken}`);
    const absensiId = list.body.data.absensi[0].id;

    const res = await request
      .delete(`/api/v1/absen/${absensiId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });

  it('GET /api/v1/absen?status=hadir - filters by status', async () => {
    await request.post('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`).send({
      guruId: guruId,
      muridId: muridId,
      jadwalId: jadwalId,
      tanggal: '2026-07-22',
      status: 'hadir',
    });

    const res = await request
      .get('/api/v1/absen?status=hadir')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.absensi.length, 1);
    assert.equal(res.body.data.meta.total, 1);
  });

  it('GET /api/v1/absen - sorted by tanggal desc by default', async () => {
    await request.post('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`).send({
      guruId: guruId,
      muridId: muridId,
      jadwalId: jadwalId,
      tanggal: '2026-07-01',
      status: 'sakit',
    });

    const res = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.absensi.length, 2);

    assert.ok(res.body.data.absensi[0].tanggal >= res.body.data.absensi[1].tanggal);
    assert.equal(res.body.data.meta.total, 2);
  });

  it('GET /api/v1/absen?status=malam - 400 invalid status', async () => {
    const res = await request
      .get('/api/v1/absen?status=malam')
      .set('Authorization', `Bearer ${guruToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('murid hanya melihat absensi miliknya sendiri', async () => {
    await request.post('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`).send({
      muridId: murid2Id, // absensi murid kedua
      jadwalId: jadwalId,
      tanggal: '2026-07-24',
      status: 'sakit',
    });

    const res = await request.get('/api/v1/absen').set('Authorization', `Bearer ${muridToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.absensi.every((a) => a.muridId === muridId));
    assert.ok(!res.body.data.absensi.some((a) => a.muridId === murid2Id));
  });

  it('murid tidak bisa baca absensi murid lain via /:id', async () => {
    const semua = await request.get('/api/v1/absen').set('Authorization', `Bearer ${guruToken}`);
    const absenMurid2 = semua.body.data.absensi.find((a) => a.muridId === murid2Id);

    const res = await request
      .get(`/api/v1/absen/${absenMurid2.id}`)
      .set('Authorization', `Bearer ${muridToken}`);
    assert.equal(res.status, 404);
  });

  it('guruId dipaksa dari token, bukan dari body', async () => {
    const res = await request
      .post('/api/v1/absen')
      .set('Authorization', `Bearer ${guruToken}`)
      .send({
        guruId: '11111111-1111-1111-1111-111111111111', // dikarang
        muridId: muridId,
        jadwalId: jadwalId,
        tanggal: '2026-07-25',
        status: 'izin',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.guruId, guruId);
    assert.notEqual(res.body.data.guruId, '11111111-1111-1111-1111-111111111111');
  });
});

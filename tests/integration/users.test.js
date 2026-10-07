import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';
import { prisma } from '../../src/db/client.js';

const request = supertest(app);

describe('Users API', { concurrency: false }, () => {
  let mapelId;
  let kelasId;
  let adminToken;
  let guruToken;

  before(async () => {
    await prisma.absensi.deleteMany();
    await prisma.nilai.deleteMany();
    await prisma.jadwal.deleteMany();
    await prisma.refreshToken.deleteMany();
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
      nama: 'Budi',
      email: 'guru@test.com',
      password: 'password123',
      role: 'guru',
      nip: 999999,
      mataPelajaranId: mapelId,
    });
    guruToken = guruRes.body.data.token;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe('Register', () => {
    it('POST /api/v1/register - creates a guru user', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Guru Baru',
        email: 'guru2@test.com',
        password: 'password123',
        role: 'guru',
        nip: 123454,
        mataPelajaranId: mapelId,
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.nama, 'Guru Baru');
      assert.equal(res.body.data.user.role, 'guru');
      assert.equal(res.body.data.user.nip, 123454);
      assert.equal(res.body.data.user.mataPelajaranId, mapelId);
      assert.ok(res.body.data.token);
      assert.ok(res.body.data.refreshToken);
    });

    it('POST /api/v1/register - creates a murid user', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Murid Baru',
        email: 'murid@test.com',
        password: 'password123',
        role: 'murid',
        nis: 67890,
        kelasId: kelasId,
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.nama, 'Murid Baru');
      assert.equal(res.body.data.user.role, 'murid');
      assert.equal(res.body.data.user.nis, 67890);
      assert.equal(res.body.data.user.kelasId, kelasId);
    });

    it('POST /api/v1/register - 409 duplicate email', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Duplikat',
        email: 'guru@test.com',
        password: 'password123',
        role: 'guru',
        nip: 11111,
        mataPelajaranId: mapelId,
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'CONFLICT');
    });

    it('POST /api/v1/register - 400 guru without nip', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Guru Tanpa NIP',
        email: 'guru3@test.com',
        password: 'password123',
        role: 'guru',
        mataPelajaranId: mapelId,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v1/register - 400 guru without mataPelajaran', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Guru Tanpa Mapel',
        email: 'guru4@test.com',
        password: 'password123',
        role: 'guru',
        nip: 22222,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v1/register - 400 murid without nis', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Murid Tanpa NIS',
        email: 'murid2@test.com',
        password: 'password123',
        role: 'murid',
        kelasId: kelasId,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v1/register - 400 murid without kelas', async () => {
      const res = await request.post('/api/v1/register').send({
        nama: 'Murid Tanpa Kelas',
        email: 'murid3@test.com',
        password: 'password123',
        role: 'murid',
        nis: 33333,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('Login', () => {
    it('POST /api/v1/login - authenticates user', async () => {
      const res = await request.post('/api/v1/login').send({
        email: 'guru@test.com',
        password: 'password123',
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, 'guru@test.com');
      assert.equal(res.body.data.user.role, 'guru');
      assert.ok(res.body.data.token);
      assert.ok(res.body.data.refreshToken);
    });

    it('POST /api/v1/login - 401 wrong password', async () => {
      const res = await request.post('/api/v1/login').send({
        email: 'guru@test.com',
        password: 'wrongpassword',
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v1/login - 401 email not found', async () => {
      const res = await request.post('/api/v1/login').send({
        email: 'unknown@test.com',
        password: 'password123',
      });

      assert.equal(res.status, 400);
    });
  });

  describe('Profile', () => {
    it('GET /api/v1/me - returns profile with valid token', async () => {
      const res = await request.get('/api/v1/me').set('Authorization', `Bearer ${guruToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, 'guru@test.com');
      assert.equal(res.body.data.user.role, 'guru');
    });

    it('GET /api/v1/me - 401 without token', async () => {
      const res = await request.get('/api/v1/me');

      assert.equal(res.status, 401);
    });

    it('PATCH /api/v1/me - updates profile', async () => {
      const res = await request
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${guruToken}`)
        .send({
          nama: 'Budi Updated',
          email: 'guru@test.com',
          role: 'guru',
          nip: 999999,
          mataPelajaranId: mapelId,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.nama, 'Budi Updated');
    });

    
  });

  describe('Admin: Users list', () => {
    it('GET /api/v1/users - returns all users (admin)', async () => {
      const res = await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.data.user !== undefined);
    });

    it('GET /api/v1/users - 401 without token', async () => {
      const res = await request.get('/api/v1/users');

      assert.equal(res.status, 401);
    });
  });

  describe('Refresh Token', () => {
    let loginAccessToken;
    let firstRefreshToken;

    before(async () => {
      const res = await request.post('/api/v1/login').send({
        email: 'guru@test.com',
        password: 'password123',
      });

      assert.equal(res.status, 200);
      loginAccessToken = res.body.data.token;
      firstRefreshToken = res.body.data.refreshToken;
    });

    it('POST /api/v1/refresh - rotates token pair', async () => {
      const res = await request.post('/api/v1/refresh').send({ refreshToken: firstRefreshToken });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.ok(res.body.data.refreshToken);
      assert.notEqual(res.body.data.refreshToken, firstRefreshToken);
    });

    it('access token biasa masih valid setelah rotasi', async () => {
      const res = await request.get('/api/v1/me').set('Authorization', `Bearer ${loginAccessToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, 'guru@test.com');
    });

    it('POST /api/v1/refresh - 401 untuk refresh token lama (reuse)', async () => {
      const res = await request.post('/api/v1/refresh').send({ refreshToken: firstRefreshToken });

      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/v1/refresh - 401 saat memakai access token', async () => {
      const res = await request.post('/api/v1/refresh').send({ refreshToken: loginAccessToken });

      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/v1/refresh - 400 saat refreshToken kosong', async () => {
      const res = await request.post('/api/v1/refresh').send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v1/refresh - 401 untuk token bukan JWT', async () => {
      const res = await request.post('/api/v1/refresh').send({ refreshToken: 'bukan-jwt-sama-sekali' });

      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    });

    it('GET /api/v1/me - 401 untuk token tanpa Bearer', async () => {
      const res = await request.get('/api/v1/me').set('Authorization', loginAccessToken);

      assert.equal(res.status, 401);
    });
  });

  describe('Logout', () => {
    let logoutRefreshToken;

    before(async () => {
      const res = await request.post('/api/v1/login').send({
        email: 'guru@test.com',
        password: 'password123',
      });

      assert.equal(res.status, 200);
      logoutRefreshToken = res.body.data.refreshToken;
    });

    it('POST /api/v1/logout - 204 lalu refresh token tidak berlaku lagi', async () => {
      const out = await request.post('/api/v1/logout').send({ refreshToken: logoutRefreshToken });
      assert.equal(out.status, 204);

      const res = await request.post('/api/v1/refresh').send({ refreshToken: logoutRefreshToken });
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    });

    it('POST /api/v1/logout - 204 untuk token yang tidak dikenal', async () => {
      const res = await request.post('/api/v1/logout').send({ refreshToken: 'token-ngawur' });

      assert.equal(res.status, 204);
    });

    it('POST /api/v1/logout - 400 tanpa refresh token', async () => {
      const res = await request.post('/api/v1/logout').send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('access token biasa masih bisa dipakai setelah logout', async () => {
      const login = await request.post('/api/v1/login').send({
        email: 'admin@test.com',
        password: 'admin1234',
      });

      const out = await request
        .post('/api/v1/logout')
        .send({ refreshToken: login.body.data.refreshToken });
      assert.equal(out.status, 204);

      const res = await request.get('/api/v1/me').set('Authorization', `Bearer ${login.body.data.token}`);
      assert.equal(res.status, 200);
    });
  });
});

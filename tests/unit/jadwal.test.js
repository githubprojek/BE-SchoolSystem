import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { jadwalRepo } from '../../src/repositories/jadwal.repo.js';
import { AppError } from '../../src/errors/AppError.js';
import { jadwalService } from '../../src/services/jadwal.service.js';

describe('Jadwal tests', { concurrency: false }, () => {
  const guruId = '507f1f77bcf86cd799439011';
  const mapelId = '32j4h23j423h423hjg432hj';
  const kelasId = '2h3j42hg432jh42j32h4g43';
  const muridId = 'sdkfjsdk32k4j234k2j3h43';
  const jadwalId = 's8s9d7f89sd7f8sd7f9sd7f';

  const mockJadwal = {
    id: jadwalId,
    guru: guruId,
    mataPelajaran: mapelId,
    kelas: kelasId,
    murid: muridId,
    hari: 'senin',
    jamMulai: 420,
    jamSelesai: 560,
  };

  const inputJadwal = {
    guru: guruId,
    mataPelajaran: mapelId,
    kelas: kelasId,
    murid: muridId,
    hari: 'senin',
    jamMulai: 420,
    jamSelesai: 560,
  };

  describe('Create', () => {
    it('create a jadwal successfully', async () => {
      mock.method(jadwalRepo, 'findOverlap', () => null);
      mock.method(jadwalRepo, 'create', async () => mockJadwal);

      const result = await jadwalService.create(inputJadwal);
      assert.equal(result.guru, guruId);
      assert.equal(result.mataPelajaran, mapelId);
      assert.equal(result.kelas, kelasId);
      assert.equal(result.murid, muridId);
      assert.equal(result.hari, 'senin');
      assert.equal(result.jamMulai, 420);
      assert.equal(result.jamSelesai, 560);
    });

    it('throw 409 when jadwal crashed', async () => {
      mock.method(jadwalRepo, 'findOverlap', async () => [
        { kelas: kelasId, hari: 'senin', jamMulai: 420, jamSelesai: 560 },
      ]);

      await assert.rejects(
        () => jadwalService.create(inputJadwal),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });
  });

  describe('findAll', async () => {
    it('Return All jadwal', async () => {
      mock.method(jadwalRepo, 'findAll', async () => [mockJadwal]);
      const result = await jadwalService.findAll();
      assert.equal(result.length, 1);
      assert.equal(result[0].guru, guruId);
    });
  });

  describe('findById', async () => {
    it('Return jadwal when found', async () => {
      mock.method(jadwalRepo, 'findById', () => mockJadwal);
      const result = await jadwalService.findById(jadwalId);
      assert.equal(result.guru, guruId);
      assert.equal(result.id, jadwalId);
    });

    it('Return jadwal when role = guru', async () => {
      mock.method(jadwalRepo, 'findByGuru', () => ({ id: guruId, role: 'guru' }));
      const result = await jadwalService.getByGuru(guruId);

      assert.equal(result.role, 'guru');
    });

    it('Return kelas when role = murid', async () => {
      mock.method(jadwalRepo, 'findByKelas', () => ({ id: kelasId, nama: '10A', role: 'murid' }));
      const result = await jadwalService.getByKelas(kelasId);

      assert.equal(result.role, 'murid');
      assert.equal(result.id, kelasId);
      assert.equal(result.nama, '10A');
    });
  });

  describe('UpdateById', async () => {
    it('Update jadwal successfully', async () => {
      mock.method(jadwalRepo, 'findOverlap', async () => null);
      mock.method(jadwalRepo, 'updateById', async () => ({
        ...mockJadwal,
        jamMulai: 300,
        jamSelesai: 600,
      }));
      const result = await jadwalService.updateById(jadwalId, { jamMulai: 300, jamSelesai: 600 });
      assert.equal(result.jamMulai, 300);
      assert.equal(result.jamSelesai, 600);
    });

    it('Throws 404 when ids jadwal not found', async () => {
      mock.method(jadwalRepo, 'findOverlap', async () => null);
      mock.method(jadwalRepo, 'updateById', async () => null);
      await assert.rejects(
        () => jadwalService.updateById('nonExist', { jamSelesai: 400 }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('deleteById', async () => {
    it('Delete user successfully', async () => {
      mock.method(jadwalRepo, 'deleteById', async () => ({ id: kelasId }));
      await assert.doesNotReject(jadwalService.deleteById(jadwalId));
    });

    it('Throws 404 when id not found', async () => {
      mock.method(jadwalRepo, 'deleteById', async () => null);
      await assert.rejects(
        () => jadwalService.deleteById('nonExist'),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });
});

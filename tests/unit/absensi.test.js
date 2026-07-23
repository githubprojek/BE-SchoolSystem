import { AppError } from '../../src/errors/AppError.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';
import { absensiRepo } from '../../src/repositories/absensi.repo.js';
import { absensiService } from '../../src/services/absensi.service.js';
import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('Absensi test', { concurrency: false }, () => {
  const guruId = '23kj4hj2k34h234';
  const muridId = '32k345jk34hj5kh34k5';
  const jadwalId = 'ksdlf89sd7f8sd7f';
  const absensiId = 'sakfhdjf9a8sd9as8d';

  const mockAbsensi = {
    _id: absensiId,
    guru: guruId,
    murid: muridId,
    jadwal: jadwalId,
    tanggal: '2026-07-25',
    status: 'hadir',
  };
  const inputAbsensi = {
    _id: absensiId,
    guru: guruId,
    murid: muridId,
    jadwal: jadwalId,
    tanggal: '2026-07-25',
    status: 'hadir',
  };

  afterEach(() => {
    mock.restoreAll();
  });

  describe('Create', async () => {
    it('Create successully', async () => {
      mock.method(absensiRepo, 'findConflict', async () => null);
      mock.method(absensiRepo, 'create', async () => mockAbsensi);
      const result = await absensiService.create(inputAbsensi);
      assert.equal(result.guru, guruId);
      assert.equal(result.murid, muridId);
      assert.equal(result.jadwal, jadwalId);
    });

    it('Return 409 when Absensi CONFLICT', async () => {
      mock.method(absensiRepo, 'findConflict', async () => mockAbsensi);
      await assert.rejects(
        () => absensiService.create(inputAbsensi),
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
    it('Find all', async () => {
      mock.method(absensiRepo, 'findAll', async () => [mockAbsensi]);
      const result = await absensiService.findAll();
      assert.equal(result.length, 1);
      assert.equal(result[0].murid, muridId);
      assert.equal(result[0].jadwal, jadwalId);
    });
  });

  describe('FindById', async () => {
    it('Find by id successfully', async () => {
      mock.method(absensiRepo, 'findById', async () => mockAbsensi);
      const result = await absensiService.findById(mockAbsensi);
      assert.equal(result._id, absensiId);
      assert.equal(result.guru, guruId);
      assert.equal(result.murid, muridId);
      assert.equal(result.jadwal, jadwalId);
    });

    it('Return 404 when ID not found', async () => {
      mock.method(absensiRepo, 'findById', async () => null);
      await assert.rejects(
        () => absensiService.findById('nonExist'),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('updateById', async () => {
    it('Update absensi successfully', async () => {
      mock.method(absensiRepo, 'findConflict', async () => null);
      mock.method(absensiRepo, 'updateById', async () => ({ ...mockAbsensi, status: 'sakit' }));

      const result = await absensiService.updateById(absensiId, { status: 'sakit' });
      assert.equal(result._id, absensiId);
      assert.equal(result.status, 'sakit');
    });

    it('return 409 when Absensi Conflict', async () => {
      mock.method(absensiRepo, 'findConflict', async () => mockAbsensi);
      await assert.rejects(
        () => absensiService.updateById(inputAbsensi, { status: 'sakit' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });

    it('Return 404 when ID not found', async () => {
      mock.method(absensiRepo, 'findConflict', async () => null);
      mock.method(absensiRepo, 'updateById', async () => null);
      await assert.rejects(
        () => absensiService.updateById('nonExist', { status: 'sakit' }),
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
    it('Delete nilai successfully', async () => {
      mock.method(absensiRepo, 'deleteById', async () => mockAbsensi);

      await assert.doesNotReject(absensiService.deleteById(mockAbsensi._id));
    });

    it('Return 404 when IDs nilai not found', async () => {
      mock.method(absensiRepo, 'deleteById', async () => null);
      await assert.rejects(
        () => absensiService.deleteById('nonExist'),
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

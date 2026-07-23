import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { kelasRepo } from '../../src/repositories/kelas.repo.js';
import { AppError } from '../../src/errors/AppError.js';
import { kelasService } from '../../src/services/kelas.service.js';

describe('Kelas tests', { concurrency: false }, () => {
  const waliKelasId = '214324h23423i234';
  const kelasId = '12321';

  const mockKelas = {
    nama: '10A',
    tingkat: 10,
    waliKelas: waliKelasId,
  };

  const inputKelas = {
    nama: '10A',
    tingkat: 10,
    waliKelas: waliKelasId,
  };

  afterEach(() => {
    mock.restoreAll();
  });

  describe('Create', () => {
    it('Create a class successfully', async () => {
      mock.method(kelasRepo, 'findByNamaAndTingkat', async () => null);
      mock.method(kelasRepo, 'create', async () => mockKelas);

      const result = await kelasService.create(inputKelas);

      assert.equal(result.nama, '10A');
      assert.equal(result.tingkat, 10);
      assert.equal(result.waliKelas, waliKelasId);
    });

    it('Throw 409 when class already existing', async () => {
      mock.method(kelasRepo, 'findByNamaAndTingkat', async () => mockKelas);

      await assert.rejects(
        () => kelasService.create(inputKelas),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });
  });

  describe('findAll', () => {
    it('Return all kelas', async () => {
      mock.method(kelasRepo, 'findAll', async () => [mockKelas]);

      const result = await kelasService.findAll();
      assert.equal(result.length, 1);
      assert.equal(result[0].nama, '10A');
    });
  });

  describe('findById', () => {
    it('Return kelas when found', async () => {
      mock.method(kelasRepo, 'findById', async () => mockKelas);

      const result = await kelasService.getById(kelasId);

      assert.equal(result.nama, '10A');
      assert.equal(result.tingkat, 10);
    });

    it('Throw 404 when kelasId not found', async () => {
      mock.method(kelasRepo, 'findById', async () => null);

      await assert.rejects(
        () => kelasService.getById('nonExist'),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('UpdateById', () => {
    it('Update kelas successfully', async () => {
      mock.method(kelasRepo, 'findById', async () => mockKelas);
      mock.method(kelasRepo, 'findByNamaAndTingkat', async () => null);

      mock.method(kelasRepo, 'updateById', async () => ({
        ...mockKelas,
        nama: '10B',
      }));
      const result = await kelasService.updateById(kelasId, { nama: '10B' });
      assert.equal(result.nama, '10B');
    });

    it('throw 404 when kelasId not found', async () => {
      mock.method(kelasRepo, 'findByNamaAndTingkat', async () => null);
      mock.method(kelasRepo, 'updateById', async () => null);

      await assert.rejects(
        () => kelasService.updateById('nonExist', { nama: 'X' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('DeleteById', async () => {
    it('Delete user successfully', async () => {
      mock.method(kelasRepo, 'findById', async () => ({ id: kelasId }));
      mock.method(kelasRepo, 'deleteById', async () => ({ id: kelasId }));
      await assert.doesNotReject(() => kelasService.deleteById(kelasId));
    });

    it('Throw 404 when IDs not found', async () => {
      mock.method(kelasRepo, 'deleteById', async () => null);

      await assert.rejects(
        () => kelasService.deleteById('nonExist'),
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

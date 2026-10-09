import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { nilaiRepo } from '../../src/repositories/nilai.repo.js';
import { nilaiService } from '../../src/services/nilai.service.js';
import { AppError } from '../../src/errors/AppError.js';

describe('Nilai test', { concurrency: false }, () => {
  const muridId = '32j432jk4h3j5h3';
  const mapelId = '325345m43jk534jk5';
  const guruId = 'jk3h34j5h34kj5h3k45';
  const nilaiId = 'sfs8d9fysd87f6';

  const mockNilai = {
    _id: nilaiId,
    muridId: muridId,
    mataPelajaranId: mapelId,
    guruId: guruId,
    nilai: 90,
    tipe: 'tugas',
    semester: 2,
    tahunAjaran: '2013/2014',
  };

  const inputNilai = {
    _id: nilaiId,
    muridId: muridId,
    mataPelajaranId: mapelId,
    guruId: guruId,
    nilai: 90,
    tipe: 'tugas',
    semester: 2,
    tahunAjaran: '2013/2014',
  };

  afterEach(() => {
    mock.restoreAll();
  });

  describe('Create', async () => {
    it('Create nilai successfully', async () => {
      mock.method(nilaiRepo, 'create', async () => mockNilai);
      const result = await nilaiService.create(inputNilai);

      assert.equal(result.muridId, muridId);
      assert.equal(result.mataPelajaranId, mapelId);
      assert.equal(result.guruId, guruId);
      assert.equal(result.tipe, 'tugas');
      assert.equal(result.semester, 2);
      assert.equal(result.tahunAjaran, '2013/2014');
    });
  });

  describe('findAll', async () => {
    it('Find all', async () => {
      mock.method(nilaiRepo, 'findAll', async () => ({ items: [mockNilai], total: 1 }));
      const result = await nilaiService.findAll();

      assert.equal(result.items.length, 1);
      assert.equal(result.total, 1);
    });

    it('Default pagination, no filter and no sort', async () => {
      let received;
      mock.method(nilaiRepo, 'findAll', async (args) => {
        received = args;
        return { items: [], total: 0 };
      });

      await nilaiService.findAll();

      assert.equal(received.page, 1);
      assert.equal(received.limit, 10);
      assert.equal(received.filter, undefined);
      assert.equal(received.sort, undefined);
    });

    it('Maps flat query params to nested filter and sort', async () => {
      let received;
      mock.method(nilaiRepo, 'findAll', async (args) => {
        received = args;
        return { items: [], total: 0 };
      });

      await nilaiService.findAll({
        tipe: 'UTS',
        mataPelajaranId: mapelId,
        semester: 2,
        sortBy: 'nilai',
        sortOrder: 'asc',
      });

      assert.deepEqual(received.filter, {
        tipe: 'UTS',
        mataPelajaranId: mapelId,
        tahunAjaran: undefined,
        semester: 2,
      });
      assert.deepEqual(received.sort, { sortBy: 'nilai', sortOrder: 'asc' });
      assert.equal(received.page, 1);
      assert.equal(received.limit, 10);
    });
  });

  describe('findById', async () => {
    it('Find by id successfully', async () => {
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      const result = await nilaiService.findById(nilaiId);

      assert.equal(result._id, nilaiId);
      assert.equal(result.nilai, 90);
      assert.equal(result.semester, 2);
    });

    it('return 404 when nilaiId not found', async () => {
      mock.method(nilaiRepo, 'findById', async () => null);
      await assert.rejects(
        () => nilaiService.findById('nonExist'),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('update', async () => {
    it('Update nilai successfully', async () => {
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      mock.method(nilaiRepo, 'updateById', async () => ({ ...mockNilai, nilai: 20 }));
      const result = await nilaiService.updateById(
        nilaiId,
        { nilai: 20 },
        { id: guruId, role: 'guru' },
      );

      assert.equal(result.nilai, 20);
    });

    it('return 403 when guru updates nilai owned by another guru', async () => {
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      mock.method(nilaiRepo, 'updateById', async () => mockNilai);

      await assert.rejects(
        () => nilaiService.updateById(nilaiId, { nilai: 20 }, { id: 'other-guru', role: 'guru' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 403);
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        },
      );
    });

    it('allows admin to update any nilai', async () => {
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      mock.method(nilaiRepo, 'updateById', async () => ({ ...mockNilai, nilai: 50 }));

      const result = await nilaiService.updateById(
        nilaiId,
        { nilai: 50 },
        { id: 'admin-id', role: 'admin' },
      );
      assert.equal(result.nilai, 50);
    });

    it('Return 404 when nilaiId not found', async () => {
      mock.method(nilaiRepo, 'findById', async () => null);

      await assert.rejects(
        () => nilaiService.updateById('nonExist', { nilai: 20 }, { id: guruId, role: 'guru' }),
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
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      mock.method(nilaiRepo, 'deleteById', async () => mockNilai);

      await assert.doesNotReject(
        nilaiService.deleteById(mockNilai._id, { id: guruId, role: 'guru' }),
      );
    });

    it('return 403 when guru deletes nilai owned by another guru', async () => {
      mock.method(nilaiRepo, 'findById', async () => mockNilai);
      mock.method(nilaiRepo, 'deleteById', async () => mockNilai);

      await assert.rejects(
        () => nilaiService.deleteById(nilaiId, { id: 'other-guru', role: 'guru' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 403);
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        },
      );
    });

    it('Return 404 when IDs nilai not found', async () => {
      mock.method(nilaiRepo, 'findById', async () => null);
      await assert.rejects(
        () => nilaiService.deleteById('nonExist', { id: guruId, role: 'guru' }),
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

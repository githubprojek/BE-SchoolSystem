import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mapelRepo } from '../../src/repositories/mapel.repo.js';
import { AppError } from '../../src/errors/AppError.js';
import { mapelService } from '../../src/services/mapel.service.js';

describe('mataPelajaran test', { concurrency: false }, () => {
  const mapelId = '23jh4j23h4j23h4kj2h34k';
  const mockMapel = {
    nama: 'Matematika',
    kode: 'mtk',
  };

  const inputMapel = {
    nama: 'Matematika',
    kode: 'mtk',
  };

  afterEach(() => {
    mock.restoreAll();
  });

  describe('Create', async () => {
    it('Create a mataPelajaran successfully', async () => {
      mock.method(mapelRepo, 'findByKode', async () => null);
      mock.method(mapelRepo, 'create', async () => mockMapel);
      const result = await mapelService.create(inputMapel);

      assert.equal(result.nama, 'Matematika');
      assert.equal(result.kode, 'mtk');
    });

    it('Throw 409 when a kode already existing', async () => {
      mock.method(mapelRepo, 'findByKode', async () => mockMapel);

      await assert.rejects(
        () => mapelService.create(inputMapel),
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
      mock.method(mapelRepo, 'findAll', async () => ({ items: [mockMapel], total: 1 }));
      const result = await mapelService.findAll();

      assert.equal(result.items.length, 1);
      assert.equal(result.total, 1);
    });

    it('Default pagination, no filter and no sort', async () => {
      let received;
      mock.method(mapelRepo, 'findAll', async (args) => {
        received = args;
        return { items: [], total: 0 };
      });

      await mapelService.findAll();

      assert.equal(received.page, 1);
      assert.equal(received.limit, 10);
      assert.equal(received.filter, undefined);
      assert.equal(received.sort, undefined);
    });

    it('Maps flat query params to nested filter and sort', async () => {
      let received;
      mock.method(mapelRepo, 'findAll', async (args) => {
        received = args;
        return { items: [], total: 0 };
      });

      await mapelService.findAll({
        page: 2,
        limit: 5,
        nama: 'mate',
        kode: 'mtk',
        sortBy: 'kode',
        sortOrder: 'desc',
      });

      assert.equal(received.page, 2);
      assert.equal(received.limit, 5);
      assert.equal(received.filter.nama, 'mate');
      assert.equal(received.filter.kode, 'mtk');
      assert.equal(received.sort.sortBy, 'kode');
      assert.equal(received.sort.sortOrder, 'desc');
    });

    it('Defaults sortOrder to asc when only sortBy given', async () => {
      let received;
      mock.method(mapelRepo, 'findAll', async (args) => {
        received = args;
        return { items: [], total: 0 };
      });

      await mapelService.findAll({ sortBy: 'nama' });

      assert.equal(received.sort.sortBy, 'nama');
      assert.equal(received.sort.sortOrder, 'asc');
      assert.equal(received.filter, undefined);
    });
  });

  describe('findById', async () => {
    it('Return when mapelId found', async () => {
      mock.method(mapelRepo, 'findById', async () => mockMapel);
      const result = await mapelService.findById(mapelId);

      assert.equal(result.nama, 'Matematika');
      assert.equal(result.kode, 'mtk');
    });

    it('Return 404 when IDs mataPelajaran not found', async () => {
      mock.method(mapelRepo, 'findById', async () => null);
      await assert.rejects(
        () => mapelService.findById('nonExist'),
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
    it('Update mataPelajaran successully', async () => {
      mock.method(mapelRepo, 'findById', async () => mockMapel);
      mock.method(mapelRepo, 'findByKode', async () => null);
      mock.method(mapelRepo, 'updateById', async () => ({
        ...mockMapel,
        nama: 'ilmu pengetahuan',
      }));
      const result = await mapelService.updateById(mapelId, {
        nama: 'ilmu pengetahuan',
      });

      assert.equal(result.nama, 'ilmu pengetahuan');
    });

    it('Return 404 when IDs mataPelajaran not found', async () => {
      mock.method(mapelRepo, 'findByKode', async () => null);
      mock.method(mapelRepo, 'updateById', async () => null);
      await assert.rejects(
        () => mapelService.updateById('nonExist', { nama: 'seni budaya' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });

    it('Throw 409 when a kode already existing', async () => {
      mock.method(mapelRepo, 'findById', async () => mockMapel);
      mock.method(mapelRepo, 'findByKode', async () => mockMapel);

      await assert.rejects(
        () => mapelService.updateById(mapelId, { kode: 'MTK' }),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });
  });

  describe('deleteById', async () => {
    it('Delete mataPelajaran successfully', async () => {
      mock.method(mapelRepo, 'findById', async () => ({ id: mapelId }));
      mock.method(mapelRepo, 'deleteById', async () => ({ id: mapelId }));

      await assert.doesNotReject(mapelService.deleteById(mapelId));
    });

    it('Return 404 when IDs mataPelajaran not found', async () => {
      mock.method(mapelRepo, 'deleteById', async () => null);
      await assert.rejects(
        () => mapelService.deleteById('nonExist'),
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

import { AppError } from '../errors/AppError.js';
import { nilaiRepo } from '../repositories/nilai.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { userRepo } from '../repositories/users.repo.js';
import { kelasRepo } from '../repositories/kelas.repo.js';

function assertOwnerOrAdmin(ownerId, actor) {
  if (!actor || (actor.role !== 'admin' && actor.id !== ownerId)) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'You are not allowed to modify this data');
  }
}
async function buildNilaiScope(actor) {
  if (!actor) return { id: { in: [] } }; // default-deny kalau actor tidak ada
  if (actor.role === 'admin') return {};
  if (actor.role === 'murid') return { muridId: actor.id };

  const user = await userRepo.findById(actor.id);
  const conditions = [];
  if (user?.mataPelajaranId) {
    conditions.push({ mataPelajaranId: user.mataPelajaranId });
  }

  const kelasWaliIds = await kelasRepo.findWaliKelasIds(actor.id);
  if (kelasWaliIds.length > 0) {
    conditions.push({ murid: { kelasId: { in: kelasWaliIds } } });
  }

  if (conditions.length === 0) return { id: { in: [] } }; // guru tanpa mapel & bukan wali
  if (conditions.length === 1) return conditions[0];
  return { OR: conditions };
}

async function assertCanReadNilai(nilai, actor) {
  if (!actor) {
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Not authenticated!');
  }
  if (actor.role === 'admin') return;
  if (actor.role === 'murid') {
    if (nilai.muridId === actor.id) return;
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
  }
  // guru: nilai mapel yang diajar, atau murid dari kelas yang diwali
  const user = await userRepo.findById(actor.id);
  if (user?.mataPelajaranId && nilai.mataPelajaranId === user.mataPelajaranId) return;

  const kelasWaliIds = await kelasRepo.findWaliKelasIds(actor.id);
  if (nilai.murid?.kelasId && kelasWaliIds.includes(nilai.murid.kelasId)) return;

  throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
}

export const nilaiService = {
  async create(data) {
    return await nilaiRepo.create(data);
  },

  async findAll(params = {}, actor) {
    const {
      page = 1,
      limit = 10,
      tipe,
      mataPelajaranId,
      tahunAjaran,
      semester,
      sortBy,
      sortOrder,
    } = params;

    const hasFilter =
      tipe !== undefined ||
      mataPelajaranId !== undefined ||
      tahunAjaran !== undefined ||
      semester !== undefined;

    const filter = hasFilter ? { tipe, mataPelajaranId, tahunAjaran, semester } : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'desc' } : undefined;

    const scope = await buildNilaiScope(actor);
    return await nilaiRepo.findAll({ page, limit, filter, sort, scope, actorId: actor?.id });
  },

  async findById(id, actor) {
    const result = await nilaiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    await assertCanReadNilai(result, actor);
    return result;
  },

  async updateById(id, data, actor) {
    const nilai = await nilaiRepo.findById(id);
    if (!nilai) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    assertOwnerOrAdmin(nilai.guruId, actor);
    return await nilaiRepo.updateById(id, data);
  },

  async deleteById(id, actor) {
    const result = await nilaiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    assertOwnerOrAdmin(result.guruId, actor);
    return await nilaiRepo.deleteById(id);
  },
};

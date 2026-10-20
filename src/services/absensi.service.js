import { absensiRepo } from '../repositories/absensi.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';

function assertOwnerOrAdmin(ownerId, actor) {
  if (!actor || (actor.role !== 'admin' && actor.id !== ownerId)) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'You are not allowed to modify this data');
  }
}
function buildAbsensiScope(actor) {
  if (!actor) return { id: { in: [] } }; // default-deny
  if (actor.role === 'admin') return {};
  if (actor.role === 'murid') return { muridId: actor.id };
  return { guruId: actor.id }; // guru → absensi yang dia catat sendiri
}

function assertCanReadAbsensi(absensi, actor) {
  if (!actor) {
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Not authenticated!');
  }
  if (actor.role === 'admin') return;
  const allowed =
    (actor.role === 'murid' && absensi.muridId === actor.id) ||
    (actor.role === 'guru' && absensi.guruId === actor.id);
  if (!allowed) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
  }
}

export const absensiService = {
  async create(data) {
    const existing = await absensiRepo.findConflict(data.muridId, data.jadwalId, data.tanggal);
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Conflict: cannot have the same data');
    }
    return await absensiRepo.create(data);
  },

  async findAll(params = {}, actor) {
    const { page = 1, limit = 10, status, sortBy, sortOrder } = params;
    const filter = status !== undefined ? { status } : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'desc' } : undefined;

    const scope = buildAbsensiScope(actor);
    return await absensiRepo.findAll({ page, limit, filter, sort, scope, actorId: actor?.id });
  },

  async findById(id, actor) {
    const result = await absensiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    assertCanReadAbsensi(result, actor);
    return result;
  },

  async updateById(id, data, actor) {
    const absensi = await absensiRepo.findById(id);
    if (!absensi) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    assertOwnerOrAdmin(absensi.guruId, actor);
    if (data.muridId && data.jadwalId && data.tanggal) {
      const existing = await absensiRepo.findConflict(data.muridId, data.jadwalId, data.tanggal);
      if (existing && existing.id !== id) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Conflict: cannot have absen twice');
      }
    }
    return await absensiRepo.updateById(id, data);
  },

  async deleteById(id, actor) {
    const absensi = await absensiRepo.findById(id);
    if (!absensi) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    assertOwnerOrAdmin(absensi.guruId, actor);
    return await absensiRepo.deleteById(id);
  },
};

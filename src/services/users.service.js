import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepo } from '../repositories/users.repo.js';
import { refreshTokenRepo } from '../repositories/refresh-token.repo.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { config } from '../config/index.js';

const SALT_ROUNDS = 12;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role, kelasId: user.kelasId, typ: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  const refreshToken = jwt.sign(
    { sub: user.id, typ: 'refresh', jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    },
  );
  const { exp } = jwt.decode(refreshToken);
  await refreshTokenRepo.create({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(exp * 1000),
  });

  return { token, refreshToken };
}

export const userService = {
  async register(data) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Email already registered');
    }

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    if (data.role === 'guru') {
      if (!data.nip) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'NIP is required for guru!');
      }
      if (!data.mataPelajaranId) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Mata Pelajaran is required for guru!',
        );
      }
    }
    if (data.role === 'murid') {
      if (!data.nis) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'nis is required for murid!');
      }
      if (!data.kelasId) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Kelas is required for murid!');
      }
    }

    data.password = hashed;
    const user = await userRepo.create(data);

    const { token, refreshToken } = await issueTokens(user);

    return {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nis: user.nis,
        nip: user.nip,
        kelasId: user.kelasId,
        mataPelajaranId: user.mataPelajaranId,
      },
      token,
      refreshToken,
    };
  },

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid email or password');
    }

    const { token, refreshToken } = await issueTokens(user);

    return {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        kelasId: user.kelasId,
      },
      token,
      refreshToken,
    };
  },

  async refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    if (payload.typ !== 'refresh') {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token type');
    }

    const row = await refreshTokenRepo.findByHash(hashToken(refreshToken));
    if (!row) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    if (row.revokedAt) {
      await refreshTokenRepo.revokeAllForUser(row.userId);
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Refresh token reuse detected');
    }

    if (row.expiresAt < new Date()) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const { count } = await refreshTokenRepo.revoke(hashToken(refreshToken));
    if (count === 0) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const user = await userRepo.findById(row.userId);
    if (!user) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    return await issueTokens(user);
  },

  async logout(refreshToken) {
    if (!refreshToken) return;

    await refreshTokenRepo.revoke(hashToken(refreshToken));
  },

  async findAll({ page = 1, limit = 10, role, nama, email, sortBy, sortOrder } = {}) {
    const filter =
      role !== undefined || nama !== undefined || email !== undefined
        ? { role, nama, email }
        : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'asc' } : undefined;

    return await userRepo.findAll({ page, limit, filter, sort });
  },

  async getById(id) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }
    return user;
  },

  async updateById(id, data) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    if (data.email) {
      const existing = await userRepo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Email already registered!');
      }
    }

    return await userRepo.updateById(id, data);
  },

  async deleteById(id) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }
    return await userRepo.deleteById(id);
  },
};

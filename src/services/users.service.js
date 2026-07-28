import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepo } from '../repositories/users.repo.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { config } from '../config/index.js';

const SALT_ROUNDS = 12;

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

    const token = jwt.sign(
      { sub: user.id, role: user.role, kelas: user.kelas },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      },
    );

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

    const token = jwt.sign(
      { sub: user.id, role: user.role, kelasId: user.kelasId },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      },
    );

    return {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        kelasId: user.kelasId,
      },
      token,
    };
  },

  async findAll() {
    const user = await userRepo.findAll();
    return user;
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
    //hash password
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    // validasi email
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

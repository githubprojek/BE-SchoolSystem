import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepo } from '../../src/repositories/users.repo.js';
import { refreshTokenRepo } from '../../src/repositories/refresh-token.repo.js';
import { userService } from '../../src/services/users.service.js';
import { AppError } from '../../src/errors/AppError.js';

describe('User tests', { concurrency: false }, () => {
  const guruId = '507f1f77bcf86cd799439011';
  const muridId = '23423592u5345345345';
  const mapelId = '507f1f77bcf86cd799439012';
  const kelasId = '23jk5h32kj5h34kjh5j34kh5';

  const mockGuru = {
    id: guruId,
    nama: 'Budi',
    email: 'budi@test.com',
    role: 'guru',
    nip: 12345,
    mataPelajaranId: mapelId,
  };

  const guruInput = {
    nama: 'Budi',
    email: 'budi@test.com',
    password: 'password123',
    role: 'guru',
    nip: 12345,
    mataPelajaranId: mapelId,
  };

  // JWT tiruan berformat header.payload.signature supaya jwt.decode() tidak null
  function fakeJwt(payload) {
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString('base64url');
    return `eyJhbGciOiJIUzI1NiJ9.${body}.signature`;
  }

  beforeEach(() => {
    // sign di-call 2x (access + refresh) → hasilkan token tiruan yang tetap bisa di-decode
    mock.method(jwt, 'sign', (payload) => fakeJwt(payload));
    // jangan sampai unit test menyentuh database
    mock.method(refreshTokenRepo, 'create', async () => ({ id: 'rt-1' }));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('register', () => {
    it('creates a guru user', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed-password');
      mock.method(userRepo, 'create', async () => mockGuru);

      const result = await userService.register(guruInput);

      assert.equal(result.user.nama, 'Budi');
      assert.equal(result.user.role, 'guru');
      assert.equal(result.user.nip, 12345);
      assert.ok(result.token);
      assert.ok(result.refreshToken);
      assert.equal(jwt.decode(result.token).typ, 'access');
      assert.equal(jwt.decode(result.refreshToken).typ, 'refresh');
      assert.equal(refreshTokenRepo.create.mock.calls.length, 1);
      assert.equal(bcrypt.hash.mock.calls.length, 1);
    });

    it('creates a murid user', async () => {
      const muridInput = {
        nama: 'Siti',
        email: 'siti@test.com',
        password: 'password123',
        role: 'murid',
        nis: 67890,
        kelasId: '507f1f77bcf86cd799439013',
      };

      const mockMurid = {
        id: muridId,
        nama: 'Siti',
        email: 'siti@test.com',
        role: 'murid',
        nis: 67890,
        kelasId: '507f1f77bcf86cd799439013',
      };

      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed-password');
      mock.method(userRepo, 'create', async () => mockMurid);

      const result = await userService.register(muridInput);

      assert.equal(result.user.nama, 'Siti');
      assert.equal(result.user.role, 'murid');
      assert.equal(result.user.nis, 67890);
      assert.ok(result.token);
      assert.ok(result.refreshToken);
    });

    it('throws 409 when email already exists', async () => {
      mock.method(userRepo, 'findByEmail', async () => ({
        id: 'existing',
        email: 'budi@test.com',
      }));

      await assert.rejects(
        () => userService.register(guruInput),
        (err) => {
          assert(err instanceof AppError);
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });

    it('throws 400 when guru has no NIP', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed');

      await assert.rejects(
        () => userService.register({ ...guruInput, nip: undefined }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });

    it('throws 400 when guru has no mataPelajaran', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed');

      await assert.rejects(
        () => userService.register({ ...guruInput, mataPelajaranId: undefined }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });

    it('throws 400 when murid has no NIS', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed');

      await assert.rejects(
        () =>
          userService.register({
            nama: 'Siti',
            email: 'siti@test.com',
            password: 'password123',
            role: 'murid',
            nis: undefined,
            kelasId: '507f1f77bcf86cd799439013',
            nip: undefined,
            mataPelajaranId: undefined,
          }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });

    it('throws 400 when murid has no kelas', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(bcrypt, 'hash', async () => 'hashed');

      await assert.rejects(
        () =>
          userService.register({
            nama: 'Siti',
            email: 'siti@test.com',
            password: 'password123',
            role: 'murid',
            nis: 12345,
            kelasId: undefined,
            nip: undefined,
            mataPelajaranId: undefined,
          }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });
  });

  describe('login', () => {
    const mockUser = {
      id: guruId,
      nama: 'Budi',
      email: 'budi@test.com',
      role: 'guru',
      password: 'hashed-password',
      kelasId: kelasId,
    };

    it('returns user + token with valid credentials', async () => {
      mock.method(userRepo, 'findByEmail', async () => mockUser);
      mock.method(bcrypt, 'compare', async () => true);

      const result = await userService.login({ email: 'budi@test.com', password: 'password123' });

      assert.equal(result.user.email, 'budi@test.com');
      assert.ok(result.token);
      assert.ok(result.refreshToken);
      assert.equal(jwt.decode(result.token).typ, 'access');
      assert.equal(jwt.decode(result.refreshToken).typ, 'refresh');
      assert.equal(refreshTokenRepo.create.mock.calls.length, 1);
    });

    it('throws 401 when email not found', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);

      await assert.rejects(
        () => userService.login({ email: 'unknown@test.com', password: 'password123' }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });

    it('throws 401 when password is wrong', async () => {
      mock.method(userRepo, 'findByEmail', async () => mockUser);
      mock.method(bcrypt, 'compare', async () => false);

      await assert.rejects(
        () => userService.login({ email: 'budi@test.com', password: 'wrongpassword' }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.equal(err.code, 'VALIDATION_ERROR');
          return true;
        },
      );
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [
        { id: '1', nama: 'Budi', email: 'budi@test.com' },
        { id: '2', nama: 'Siti', email: 'siti@test.com' },
      ];
      mock.method(userRepo, 'findAll', async () => users);

      const result = await userService.findAll();

      assert.equal(result.length, 2);
      assert.equal(result[0].nama, 'Budi');
    });
  });

  describe('getById', () => {
    it('returns user when found', async () => {
      mock.method(userRepo, 'findById', async () => ({ id: guruId, nama: 'Budi' }));

      const result = await userService.getById(guruId);

      assert.equal(result.nama, 'Budi');
    });

    it('throws 404 when not found', async () => {
      mock.method(userRepo, 'findById', async () => null);

      await assert.rejects(
        () => userService.getById('nonexistent'),
        (err) => {
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('updateById', () => {
    const existingUser = {
      id: guruId,
      nama: 'Budi',
      email: 'budi@test.com',
    };

    it('updates user successfully', async () => {
      mock.method(userRepo, 'findById', async () => existingUser);
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(userRepo, 'updateById', async () => ({ ...existingUser, nama: 'Budi Updated' }));

      const result = await userService.updateById(guruId, { nama: 'Budi Updated' });

      assert.equal(result.nama, 'Budi Updated');
    });

    it('re-hashes password when password is provided', async () => {
      mock.method(userRepo, 'findById', async () => existingUser);
      mock.method(bcrypt, 'hash', async () => 'new-hashed-password');
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(userRepo, 'updateById', async () => ({
        ...existingUser,
        password: 'new-hashed-password',
      }));

      await userService.updateById(guruId, { password: 'newpassword123' });

      assert.equal(bcrypt.hash.mock.calls.length, 1);
      assert.equal(bcrypt.hash.mock.calls[0].arguments[0], 'newpassword123');
    });

    it('throws 409 when email is taken by another user', async () => {
      mock.method(userRepo, 'findById', async () => existingUser);
      mock.method(userRepo, 'findByEmail', async () => ({
        id: 'other-id',
        email: 'other@test.com',
      }));

      await assert.rejects(
        () => userService.updateById(guruId, { email: 'other@test.com' }),
        (err) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CONFLICT');
          return true;
        },
      );
    });

    it('allows updating to own email', async () => {
      mock.method(userRepo, 'findById', async () => existingUser);
      mock.method(userRepo, 'findByEmail', async () => ({
        id: guruId,
        email: 'budi@test.com',
      }));
      mock.method(userRepo, 'updateById', async () => ({
        ...existingUser,
        email: 'budi@test.com',
      }));

      const result = await userService.updateById(guruId, { email: 'budi@test.com' });

      assert.equal(result.email, 'budi@test.com');
    });

    it('throws 404 when user not found for update', async () => {
      mock.method(userRepo, 'findByEmail', async () => null);
      mock.method(userRepo, 'updateById', async () => null);

      await assert.rejects(
        () => userService.updateById('nonexistent', { nama: 'X' }),
        (err) => {
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('deleteById', () => {
    it('deletes user successfully', async () => {
      mock.method(userRepo, 'findById', async () => ({ id: guruId }));
      mock.method(userRepo, 'deleteById', async () => ({ id: guruId }));

      await assert.doesNotReject(() => userService.deleteById(guruId));
    });

    it('throws 404 when user not found for delete', async () => {
      mock.method(userRepo, 'deleteById', async () => null);

      await assert.rejects(
        () => userService.deleteById('nonexistent'),
        (err) => {
          assert.equal(err.statusCode, 404);
          assert.equal(err.code, 'NOT_FOUND');
          return true;
        },
      );
    });
  });

  describe('refresh', () => {
    const activeRow = {
      id: 'rt-1',
      tokenHash: 'some-hash',
      userId: guruId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };

    it('returns new token pair when refresh token is valid', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => activeRow);
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 1 }));
      mock.method(refreshTokenRepo, 'revokeAllForUser', async () => ({ count: 0 }));
      mock.method(userRepo, 'findById', async () => ({ id: guruId, role: 'guru', kelasId }));

      const result = await userService.refresh('valid-refresh-token');

      assert.ok(result.token);
      assert.ok(result.refreshToken);
      assert.notEqual(result.refreshToken, 'valid-refresh-token');
      assert.equal(jwt.decode(result.token).typ, 'access');
      assert.equal(jwt.decode(result.refreshToken).typ, 'refresh');
      // rotasi: token lama di-revoke, sesi TIDAK dicabut semua
      assert.equal(refreshTokenRepo.revoke.mock.calls.length, 1);
      assert.equal(refreshTokenRepo.revokeAllForUser.mock.calls.length, 0);
      assert.equal(refreshTokenRepo.create.mock.calls.length, 1);
    });

    it('throws 401 when refresh token is invalid or expired', async () => {
      mock.method(jwt, 'verify', () => {
        throw new Error('jwt expired');
      });

      await assert.rejects(
        () => userService.refresh('expired-token'),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          return true;
        },
      );
    });

    it('throws 401 when access token is used as refresh token', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'access' }));

      await assert.rejects(
        () => userService.refresh('access-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          assert.equal(err.message, 'Invalid token type');
          return true;
        },
      );
    });

    it('throws 401 when token hash is not stored in db', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => null);

      await assert.rejects(
        () => userService.refresh('unknown-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          return true;
        },
      );
    });

    it('revokes all user sessions when revoked token is reused', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => ({
        ...activeRow,
        revokedAt: new Date(),
      }));
      mock.method(refreshTokenRepo, 'revokeAllForUser', async () => ({ count: 3 }));

      await assert.rejects(
        () => userService.refresh('reused-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          assert.equal(err.message, 'Refresh token reuse detected');
          return true;
        },
      );

      assert.equal(refreshTokenRepo.revokeAllForUser.mock.calls.length, 1);
      assert.equal(refreshTokenRepo.revokeAllForUser.mock.calls[0].arguments[0], guruId);
    });

    it('throws 401 when stored token is already expired', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => ({
        ...activeRow,
        expiresAt: new Date(Date.now() - 1000),
      }));

      await assert.rejects(
        () => userService.refresh('stale-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          return true;
        },
      );
    });

    it('throws 401 when rotation loses the race (count 0)', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => activeRow);
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 0 }));

      await assert.rejects(
        () => userService.refresh('concurrent-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          return true;
        },
      );
    });

    it('throws 401 when user no longer exists', async () => {
      mock.method(jwt, 'verify', () => ({ sub: guruId, typ: 'refresh' }));
      mock.method(refreshTokenRepo, 'findByHash', async () => activeRow);
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 1 }));
      mock.method(userRepo, 'findById', async () => null);

      await assert.rejects(
        () => userService.refresh('orphan-token'),
        (err) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'UNAUTHORIZED');
          return true;
        },
      );
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 1 }));

      await assert.doesNotReject(() => userService.logout('some-refresh-token'));

      assert.equal(refreshTokenRepo.revoke.mock.calls.length, 1);
      assert.equal(refreshTokenRepo.revoke.mock.calls[0].arguments[0].length, 64); // sha256 hex
    });

    it('does nothing when token is empty', async () => {
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 0 }));

      await assert.doesNotReject(() => userService.logout(''));

      assert.equal(refreshTokenRepo.revoke.mock.calls.length, 0);
    });

    it('does not throw when token is unknown', async () => {
      mock.method(refreshTokenRepo, 'revoke', async () => ({ count: 0 }));

      await assert.doesNotReject(() => userService.logout('unknown-token'));

      assert.equal(refreshTokenRepo.revoke.mock.calls.length, 1);
    });
  });
});

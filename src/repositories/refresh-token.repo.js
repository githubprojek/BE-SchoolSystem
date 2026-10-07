import { prisma } from '../db/client.js';

export const refreshTokenRepo = {
  async create({ tokenHash, userId, expiresAt }) {
    return await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
  },

  async findByHash(tokenHash) {
    return await prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  async revoke(tokenHash) {
    return await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId) {
    return await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async deleteExpired() {
    return await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};

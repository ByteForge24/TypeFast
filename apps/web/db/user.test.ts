import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserByEmail, getUserById } from '../db/user';

// Mock Prisma
vi.mock('../DB_prisma/src/index', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '../DB_prisma/src/index';

describe('Database: User Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: new Date(),
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await getUserByEmail('test@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should find user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: new Date(),
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const result = await getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return null when user not found by ID', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await getUserById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database query failed')
      );

      const result = await getUserById('user-123');

      expect(result).toBeNull();
    });
  });
});

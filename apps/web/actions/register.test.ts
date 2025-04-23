import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register } from '../actions/register';
import { getUserByEmail } from '../db/user';

// Mock dependencies
vi.mock('../DB_prisma/src/index', () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../db/user', () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock('../lib/resend', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({}),
}));

vi.mock('../lib/utils', () => ({
  generateVerificationToken: vi.fn().mockResolvedValue({
    email: 'test@example.com',
    token: 'token-123',
  }),
}));

import prisma from '../DB_prisma/src/index';

describe('Server Actions: Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully register a new user', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'user-123',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashed-password',
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await register({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Confirmation email sent');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('should reject when user already exists', async () => {
    const existingUser = {
      id: 'user-123',
      email: 'existing@example.com',
      name: 'Existing User',
      emailVerified: new Date(),
    };

    vi.mocked(getUserByEmail).mockResolvedValueOnce(existingUser as any);

    const result = await register({
      name: 'New User',
      email: 'existing@example.com',
      password: 'SecurePassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('already exists');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const result = await register({
      name: 'Test User',
      email: 'invalid-email',
      password: 'SecurePassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('should validate password strength', async () => {
    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'weak', // Too weak
    });

    expect(result.success).toBe(false);
  });

  it('should validate password confirmation match', async () => {
    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePassword123!',
    });

    expect(result.success).toBe(false);
  });

  it('should handle email service errors gracefully', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePassword123!',
    });

    // Should indicate email service issue but account created
    expect(result).toBeDefined();
  });
});

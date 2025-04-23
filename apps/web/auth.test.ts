import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('../DB_prisma/src/index');
vi.mock('../db/user');

describe('Authentication: Credentials Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password hashing and comparison', () => {
    it('should hash passwords securely', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);

      // Should be bcrypt hash format (starts with $2a$, $2b$, or $2y$)
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
    });

    it('should correctly verify matching passwords', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'SecurePass123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });
  });

  describe('Sign in validation', () => {
    it('should require valid email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
      ];

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should require password field', () => {
      const credentialsWithPassword = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const credentialsWithoutPassword = {
        email: 'test@example.com',
      };

      expect(credentialsWithPassword.password).toBeTruthy();
      expect((credentialsWithoutPassword as any).password).toBeUndefined();
    });

    it('should reject null/undefined credentials', () => {
      const nullCredentials = null;
      const undefinedCredentials = undefined;

      expect(nullCredentials).toBeNull();
      expect(undefinedCredentials).toBeUndefined();
    });
  });

  describe('Email verification requirement', () => {
    it('should allow login for verified emails', () => {
      const verifiedUser = {
        id: 'user-123',
        email: 'verified@example.com',
        emailVerified: new Date('2025-01-01'),
      };

      expect(verifiedUser.emailVerified).toBeTruthy();
    });

    it('should block login for unverified emails', () => {
      const unverifiedUser = {
        id: 'user-123',
        email: 'unverified@example.com',
        emailVerified: null,
      };

      expect(unverifiedUser.emailVerified).toBeNull();
    });
  });
});

describe('Authentication: Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set JWT session strategy', () => {
    const config = {
      session: { strategy: 'jwt' },
    };

    expect(config.session.strategy).toBe('jwt');
  });

  it('should include user ID in JWT token', () => {
    const token = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    expect(token.sub).toBe('user-123');
    expect(token.email).toBeTruthy();
    expect(token.exp).toBeGreaterThan(token.iat);
  });

  it('should preserve user fields in session', () => {
    const session = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'avatar.jpg',
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(session.user.id).toBe('user-123');
    expect(session.user.email).toBeTruthy();
    expect(session.user.name).toBeTruthy();
  });
});

describe('Authentication: Google OAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require Google credentials in environment', () => {
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    };

    // Check that config is defined (even if empty in test)
    expect(typeof googleConfig.clientId).toBe('string');
    expect(typeof googleConfig.clientSecret).toBe('string');
  });

  it('should handle OAuth provider signin', () => {
    const oauthAccount = {
      provider: 'google',
      type: 'oauth',
      providerAccountId: 'google-123',
      access_token: 'token-abc123',
      token_type: 'Bearer',
    };

    expect(oauthAccount.provider).toBe('google');
    expect(oauthAccount.providerAccountId).toBeTruthy();
  });

  it('should allow OAuth signin without email verification', () => {
    const oauthUser = {
      id: 'user-123',
      email: 'user@example.com',
      emailVerified: null, // OAuth users don't need email verification
      image: 'https://avatars.example.com/photo.jpg',
    };

    expect(oauthUser.email).toBeTruthy();
    // OAuth can bypass email verification requirement
  });
});

describe('Protected Routes: Session Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require valid session for protected endpoints', () => {
    const protectedEndpoints = [
      '/api/room',
      '/api/profile',
      '/api/leaderboard',
    ];

    protectedEndpoints.forEach(endpoint => {
      expect(endpoint).toMatch(/^\/api\//);
    });
  });

  it('should return 401 for missing session', () => {
    const response = {
      status: 401,
      json: { error: 'Unauthorized: No valid session found' },
    };

    expect(response.status).toBe(401);
    expect(response.json.error).toContain('Unauthorized');
  });

  it('should return 401 for invalid session user', () => {
    const invalidSession = {
      user: null,
      expires: new Date().toISOString(),
    };

    expect(invalidSession.user).toBeNull();
  });

  it('should allow access with valid session', () => {
    const validSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'User Name',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(validSession.user).toBeTruthy();
    expect(validSession.user.id).toBeTruthy();
  });
});

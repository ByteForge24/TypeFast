/**
 * Playwright test fixtures with database setup
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Dynamic import to avoid ES module issues at startup
let prisma: any = null;
async function getPrismaClient() {
  if (!prisma) {
    // Check if running against deployed URLs
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || '';
    const isDeployed = baseUrl.startsWith('https://');
    
    if (isDeployed && process.env.RENDER_DATABASE_URL) {
      // For deployed testing, dynamically create a Prisma client with Render DB
      console.log('[Fixture] Using RENDER_DATABASE_URL for deployed tests');
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.RENDER_DATABASE_URL,
          },
        },
      });
    } else {
      // Import the prisma singleton directly for local testing
      const prismaModule = await import('../../DB_prisma/src/index');
      prisma = prismaModule.default;
    }
  }
  return prisma;
}

export const TEST_USERS = {
  standard: {
    email: 'test-e2e@typefast.local',
    password: 'Test123456!',
    name: 'E2E Test User',
  },
  profile: {
    email: 'profile-e2e@typefast.local',
    password: 'Test654321!',
    name: 'Profile E2E User',
  },
};

export async function cleanupTestUsers() {
  try {
    const client = await getPrismaClient();
    await client.user.deleteMany({
      where: {
        email: {
          in: [TEST_USERS.standard.email, TEST_USERS.profile.email],
        },
      },
    });
    console.log('[Fixture] Cleaned up test users');
  } catch (error) {
    console.log('[Fixture] Cleanup failed (may not be needed):', error);
  }
}

export async function createTestUser(email: string, password: string, name: string) {
  try {
    const client = await getPrismaClient();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await client.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`[Fixture] User ${email} already exists`);
      return;
    }
    
    // Create new user
    await client.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: new Date(), // Mark as verified for tests
      },
    });
    console.log(`[Fixture] Created test user: ${email}`);
  } catch (error: any) {
    if (error?.code === 'P2002' || error?.message?.includes('Unique')) {
      console.log(`[Fixture] User ${email} already exists`);
      return;
    }
    if (error?.message?.includes('DATABASE_URL')) {
      console.log('[Fixture] Skipping user creation - DATABASE_URL not configured');
      return;
    }
    console.log(`[Fixture] Warning: Could not create user ${email}:`, error);
  }
}

// Custom fixtures for authenticated page and context
export const test = base.extend<{ 
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Create and login test user before providing authenticated page
    await createTestUser(
      TEST_USERS.profile.email,
      TEST_USERS.profile.password,
      TEST_USERS.profile.name
    );
    
    // Navigate to auth page with callback URL for profile redirect after login
    await page.goto('/auth?callbackUrl=/profile');
    
    // Monitor console for sign-in errors
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[SignInForm]')) {
        console.log('[Page Console]', msg.text());
      }
    });
    
    await page.fill('input[name="email"]', TEST_USERS.profile.email);
    await page.fill('input[name="password"]', TEST_USERS.profile.password);
    
    // Submit login form and wait for navigation
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for navigation to complete - either /type or /profile
    try {
      await page.waitForURL(/\/(type|profile|leaderboard|multiplayer)?$/, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
    } catch (error) {
      console.log('[Fixture] Navigation error during login:', error.message);
      const currentUrl = page.url();
      console.log('[Fixture] Current URL after timeout:', currentUrl);
      throw error;
    }
    
    await use(page);
  },
  authenticatedContext: async ({ context }, use) => {
    // For multi-browser context tests, also setup authentication
    const page = await context.newPage();
    
    // Create and login test user
    await createTestUser(
      TEST_USERS.profile.email,
      TEST_USERS.profile.password,
      TEST_USERS.profile.name
    );
    
    // Navigate to auth page and log in
    await page.goto('/auth');
    await page.fill('input[name="email"]', TEST_USERS.profile.email);
    await page.fill('input[name="password"]', TEST_USERS.profile.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    try {
      await page.waitForURL(/\/(type|leaderboard|multiplayer|profile)?$/, {
        waitUntil: 'domcontentloaded',
      });
    } catch (error) {
      console.log('[Fixture] Warning: Expected redirect after login may not have occurred');
    }
    
    await page.close();
    await use(context);
  },
});

export { expect } from '@playwright/test';

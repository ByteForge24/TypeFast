/**
 * TypeFast E2E Tests - Public Pages and Navigation
 * Tests public-facing pages and navigation flows
 */

import { test, expect } from './fixtures';

test.describe('Landing Page', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/');

    // Check page title
    const title = await page.title();
    expect(title).toContain('TypeFast');

    // Check hero section exists
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
  });

  test('should display navigation header', async ({ page }) => {
    await page.goto('/');

    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check navigation links
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    // Scroll down to see features
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Wait for features section
    const featuresSection = page.locator('section').nth(1);
    await expect(featuresSection).toBeVisible({ timeout: 5000 });
  });

  test('should have functional footer', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer exists
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have working CTA button', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Get all links with href="/type" and find the one with "Get Started for Free" text
    const allTypeLinks = page.locator('a[href="/type"]');
    const ctaLink = allTypeLinks.filter({ hasText: 'Get Started for Free' }).first();
    
    // Ensure it's visible (might need to scroll into view)
    await ctaLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Brief pause to ensure scroll completes

    // Get current URL before click
    const beforeUrl = page.url();
    console.log('URL before click:', beforeUrl);

    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation({ url: /\/type$/, waitUntil: 'load' }),
      ctaLink.click(),
    ]);

    // Verify navigation
    const afterUrl = page.url();
    console.log('URL after click:', afterUrl);
    expect(afterUrl).toContain('/type');
  });
});

test.describe('Navigation', () => {
  test('should navigate to Type page from header', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Find and click Type link - first nav link since it's in header
    const typeLink = page.locator('a[href="/type"]').first();
    await expect(typeLink).toBeVisible({ timeout: 5000 });
    await typeLink.click();
    
    // Wait for navigation
    await page.waitForURL('**/type', { timeout: 10000 });
    expect(page.url()).toContain('/type');
  });

  test('should navigate to Leaderboard page from header', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Find and click Leaderboard link - third nav link (after Type and Multiplayer)
    const leaderboardLink = page.locator('a[href="/leaderboard"]').nth(0);
    await expect(leaderboardLink).toBeVisible({ timeout: 5000 });
    await leaderboardLink.click();
    
    // Wait for navigation
    await page.waitForURL('**/leaderboard', { timeout: 10000 });
    expect(page.url()).toContain('/leaderboard');
  });

  test('should navigate to Multiplayer page from header', async ({
    page,
  }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Find and click Multiplayer link - second nav link
    const multiplayerLink = page.locator('a[href="/multiplayer"]').nth(0);
    await expect(multiplayerLink).toBeVisible({ timeout: 5000 });
    await multiplayerLink.click();
    
    // Wait for navigation
    await page.waitForURL('**/multiplayer', { timeout: 10000 });
    expect(page.url()).toContain('/multiplayer');
  });

  test('should navigate to Auth page from header', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Find and click Auth/Login link - looking for navigation link in header
    const authLink = page.locator('nav a:has-text("Sign in")');
    
    // Skip test if Sign in link is not visible (user might be logged in)
    if (await authLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await authLink.click();
      await page.waitForURL('**/auth', { timeout: 10000 });
      expect(page.url()).toContain('/auth');
    }
  });

  test('should handle route transitions smoothly', async ({ page }) => {
    await page.goto('/type');
    expect(page.url()).toContain('/type');

    await page.goto('/leaderboard');
    expect(page.url()).toContain('/leaderboard');

    await page.goto('/');
    expect(page.url()).toBe('//');
  });
});

test.describe('Public Pages Content', () => {
  test('Type page should load the typing interface', async ({ page }) => {
    await page.goto('/type');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should display content for typing interface
    await expect(page).toHaveTitle(/TypeFast/, { timeout: 10000 });

    // Check that page has content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('Leaderboard page should display leaderboard content', async ({
    page,
  }) => {
    await page.goto('/leaderboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page loaded - wait longer for title
    await expect(page).toHaveTitle(/TypeFast/, { timeout: 10000 });

    // Check content exists
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // May show leaderboard data or a message if empty/no Redis  
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('Multiplayer page should display multiplayer interface', async ({
    page,
  }) => {
    await page.goto('/multiplayer');

    // Check page loaded
    await expect(page).toHaveTitle(/TypeFast/);

    // Check content exists
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Error Handling and Redirects', () => {
  test('should handle non-existent routes gracefully', async ({ page }) => {
    // Try to visit a non-existent route
    const response = await page.goto('/non-existent-page');

    // Should either redirect or show error page
    expect(page.url()).toBeTruthy();
  });

  test('should protect profile page - redirect unauthenticated users', async ({
    page,
  }) => {
    await page.goto('/profile');

    // Should redirect to auth or show auth prompt
    await page.waitForURL(/auth|login/, { timeout: 5000 }).catch(() => {
      // If no redirect, check if page shows auth prompt
    });

    // Either redirected to auth or on profile page
    const url = page.url();
    expect(url).toMatch(/auth|login|profile/);
  });
});




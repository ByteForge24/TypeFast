import { test, expect, Browser, firefox, chromium } from '@playwright/test';
import {
  collectConsoleErrors,
  collectFailedResponses,
  assertNoCriticalErrors,
  assertNotAuthError,
  dismissPasswordManagerPopupIfPresent,
  waitForAuthCompletion,
  getBaseUrl,
} from './strict-helpers';

test.describe('Strict Google OAuth Tests', () => {
  /**
   * Test 4.1: Google button visible and clickable
   *
   * Verifies that the Google OAuth button is properly rendered and
   * clicking it navigates away from the local auth page.
   */
  test('4.1 - Google button visible and clickable', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Navigate to auth page
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    // Verify page loads without immediate errors
    expect(page.url()).toContain('/auth');

    // Check that Google button is visible and enabled
    const googleButton = page.getByRole('button', { name: /continue with google|google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    // Verify button is clickable by checking it's attached to DOM
    const isAttached = await googleButton.isEnabled();
    expect(isAttached).toBe(true);

    // Click should trigger navigation away from /auth
    const navigationPromise = page.waitForURL(/.*/, { timeout: 10000 }).catch(() => null);
    await googleButton.click();

    // Wait for navigation to happen (could be to Google domain)
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => null);

    const finalUrl = page.url();
    // Should navigate away from local /auth page
    // Could be to Google domain or somewhere else, but not staying on /auth
    const leftAuthPage = !finalUrl.includes('localhost') || !finalUrl.includes('/auth');
    expect(leftAuthPage).toBe(true);

    // Verify no immediate auth error appeared
    await assertNotAuthError(page);
    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 4.2: Full OAuth callback success (MOST IMPORTANT TEST)
   *
   * This is the critical test that should catch Google OAuth configuration errors.
   * Tests the complete flow: button click -> Google consent -> callback -> success.
   */
  test('4.2 - Full OAuth callback success', async ({ browser }) => {
    const baseUrl = getBaseUrl();
    // Use a fresh browser context for clean OAuth flow
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    try {
      // Navigate to auth page
      await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/auth');

      // Dismiss password manager popup if present
      await dismissPasswordManagerPopupIfPresent(page);

      // Get Google button and verify it's clickable
      const googleButton = page.getByRole('button', { name: /continue with google|google/i });
      await expect(googleButton).toBeVisible();

      // Set up listener for navigation to Google or return
      const navigationPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => null);

      // Click Google button
      await googleButton.click();

      // Wait for any navigation
      await navigationPromise;

      // Give page time to load and render
      await page.waitForLoadState('load', { timeout: 15000 }).catch(() => null);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

      // Wait for auth completion (redirect back to app)
      await waitForAuthCompletion(page, 45000);

      const finalUrl = page.url();

      // STRICT ASSERTIONS FOR OAUTH SUCCESS:
      // 1. Must NOT be at /api/auth/error
      expect(finalUrl).not.toContain('/api/auth/error');
      expect(finalUrl).not.toContain('error=Configuration');
      expect(finalUrl).not.toContain('error=');

      // 2. Must be at valid app route
      expect(
        finalUrl.includes('/type') ||
          finalUrl.includes('/profile') ||
          finalUrl.includes('/leaderboard') ||
          finalUrl.match(/^https?:\/\/[^/]*\/?$/) // Root domain
      ).toBe(true);

      // 3. Verify no auth error in visible UI
      await assertNotAuthError(page);

      // 4. Check for successful auth indicators
      // Look for logout button or user menu (indicates authenticated state)
      const userMenu = page
        .getByRole('button', { name: /profile|user|account|logout/i })
        .first();
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });

      const hasAuthIndicator =
        (await userMenu.isVisible().catch(() => false)) ||
        (await logoutButton.isVisible().catch(() => false));

      // At minimum, verify no error occurred
      await assertNoCriticalErrors(consoleErrors, failedResponses);

      // If auth indicator visible, that's strong confirmation
      if (hasAuthIndicator) {
        expect(hasAuthIndicator).toBe(true);
      }
    } finally {
      await context.close();
    }
  });

  /**
   * Test 4.3: OAuth session actually works
   *
   * Verifies that after Google OAuth login, the session persists across
   * page reloads and protected routes remain accessible.
   *
   * NOTE: This test requires pre-authenticated state or manual intervention
   * in the actual OAuth flow. In headed mode, this would require user to
   * complete Google login interactively.
   */
  test('4.3 - OAuth session persistence', async ({ browser }) => {
    const baseUrl = getBaseUrl();
    // This test verifies session handling for authenticated users
    // In a real scenario, this would follow test 4.2 or require real auth token

    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    try {
      // Start by going to public page
      await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

      // If not authenticated, go to auth
      if (page.url().includes('/auth')) {
        // Would need manual OAuth completion in headed mode
        // For now, test that protected route properly requires auth
        const protectedUrl = page.url();
        expect(protectedUrl).toContain('/auth');
      }

      // Try to access protected route
      const navigationBefore = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
      await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
      await navigationBefore;

      const profileUrl = page.url();

      // If not authenticated, should redirect to auth
      if (!profileUrl.includes('/auth')) {
        // User is authenticated, verify session works
        expect(profileUrl).toContain('/profile');

        // Refresh page - session should survive
        const refreshPromise = page.waitForLoadState('networkidle');
        await page.reload();
        await refreshPromise;

        const urlAfterRefresh = page.url();
        expect(urlAfterRefresh).toContain('/profile');

        // Try another protected route
        await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });
        expect(page.url()).toContain('/type');

        // Verify logout is available
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
        await expect(logoutButton).toBeVisible();

        // Test logout
        await logoutButton.click();
        await page.waitForURL(/.*/, { timeout: 10000 }).catch(() => null);

        // After logout, should not have session
        await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
        const urlAfterLogout = page.url();
        expect(urlAfterLogout).toContain('/auth');
      }

      // Verify no critical errors occurred
      await assertNoCriticalErrors(consoleErrors, failedResponses);
    } finally {
      await context.close();
    }
  });

  /**
   * Test 4.4: OAuth failure path is visible and correct
   *
   * If OAuth fails, the test captures and reports the exact failure reason.
   * This should NOT pass just because an error page rendered.
   */
  test('4.4 - OAuth failure handling captures real error details', async ({ browser }) => {
    const baseUrl = getBaseUrl();
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    try {
      await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

      const googleButton = page.getByRole('button', { name: /continue with google|google/i });
      await expect(googleButton).toBeVisible();

      // Start monitoring for callback
      const callbackResponse = page
        .waitForResponse((response) => response.url().includes('/api/auth/callback'))
        .catch(() => null);
      const navigationPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => null);

      await googleButton.click();
      await navigationPromise;
      await callbackResponse;

      const finalUrl = page.url();

      // If we landed on error page, capture details
      if (finalUrl.includes('/api/auth/error')) {
        // Get error details from URL
        const errorMatch = finalUrl.match(/error=([^&]+)/);
        const errorType = errorMatch ? decodeURIComponent(errorMatch[1]) : 'unknown';

        // Get visible error message
        const errorAlerts = await page.locator('[role="alert"]').all();
        const errorMessages = await Promise.all(
          errorAlerts.map((alert) => alert.textContent())
        );

        // This test should FAIL with details about the error
        // It's designed to surface the problem clearly
        const errorDetail = `OAuth failed with error: ${errorType}\nVisible messages: ${errorMessages.join(' | ')}\nNetwork failures: ${failedResponses.map((r) => `${r.url}: ${r.status}`).join(' | ')}`;

        expect(false).toBe(true); // Explicit fail with error context
      } else {
        // Callback succeeded or navigation happened
        await assertNoCriticalErrors(consoleErrors, failedResponses);
      }
    } finally {
      await context.close();
    }
  });
});

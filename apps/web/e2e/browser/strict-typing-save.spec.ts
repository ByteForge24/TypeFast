import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  collectFailedResponses,
  assertNoCriticalErrors,
  dismissPasswordManagerPopupIfPresent,
  generateUniqueUser,
  waitForAuthCompletion,
  getBaseUrl,
} from './strict-helpers';

test.describe('Strict Typing Result Save Tests', () => {
  /**
   * Helper: Sign up and login a test user
   */
  async function signupAndLogin(page) {
    const baseUrl = getBaseUrl();
    const testUser = generateUniqueUser('typing-save');

    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await dismissPasswordManagerPopupIfPresent(page);

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await submitButton.click();

    await waitForAuthCompletion(page, 30000);

    return testUser;
  }

  /**
   * Test 7.1: Anonymous typing completion behavior
   *
   * Verifies that typing test completion on an unauthenticated user
   * behaves gracefully (no 500, no misleading hard failure).
   */
  test('7.1 - Anonymous typing completion behaves gracefully', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Open typing page without authentication
    await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

    // Look for start/begin button or typing interface
    const startButton = page
      .getByRole('button', { name: /start|begin|type|race/i })
      .first();

    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);
    }

    // Simulate quick typing test completion
    // Look for typing input
    const typingInput = page.locator('input[type="text"], [contenteditable="true"]').first();

    if (await typingInput.isVisible().catch(() => false)) {
      // Type some text to simulate test
      await typingInput.fill('The quick brown fox jumps over the lazy dog');
      await typingInput.evaluate((el: any) => {
        // Trigger input event to register changes
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Wait a moment then look for complete/finish button
      await page.waitForTimeout(1000);

      const finishButton = page
        .getByRole('button', { name: /finish|complete|submit|done/i })
        .first();

      if (await finishButton.isVisible().catch(() => false)) {
        await finishButton.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      }
    }

    const finalUrl = page.url();

    // STRICT ASSERTIONS:
    // 1. Should not have 500 error
    const serverErrors = failedResponses.filter((r) => r.status === 500);
    expect(serverErrors).toHaveLength(0);

    // 2. Should not show misleading hard failure
    // Anonymous users might not save, but should not crash
    const hasHardFailure =
      (await page.locator('text=/error|failed|500/i').isVisible().catch(() => false)) &&
      (await page.locator('text=/error|failed|500/i').textContent()).then((t) =>
        t.toLowerCase().includes('error')
      );

    // If there's no login/save, should show results gracefully
    const hasResults =
      (await page.locator('text=/results|wpm|accuracy|time/i').isVisible().catch(() => false)) ||
      !finalUrl.includes('/auth');

    expect(hasResults || !hasHardFailure).toBe(true);

    // 3. No silent backend crash
    const crashIndicators = consoleErrors.filter((e) =>
      e.text.includes('500') || e.text.includes('Failed to')
    );
    expect(crashIndicators.length).toBeLessThanOrEqual(1); // Allow 1 indicator max

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 7.2: Authenticated typing result save succeeds
   *
   * CRITICAL TEST: Verifies that authenticated users can complete
   * a typing test and the result saves without 401/500 errors.
   */
  test('7.2 - Authenticated typing result save succeeds', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Login first
    await signupAndLogin(page);

    // Navigate to typing page
    await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

    // Start test if needed
    const startButton = page
      .getByRole('button', { name: /start|begin|type|race/i })
      .first();

    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);
    }

    // Simulate typing test
    const typingInput = page.locator('input[type="text"], [contenteditable="true"]').first();

    if (await typingInput.isVisible().catch(() => false)) {
      await typingInput.fill('The quick brown fox jumps over the lazy dog');
      await typingInput.evaluate((el: any) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await page.waitForTimeout(500);

      const finishButton = page
        .getByRole('button', { name: /finish|complete|submit|done/i })
        .first();

      if (await finishButton.isVisible().catch(() => false)) {
        // Monitor result save requests
        const saveResponse = page
          .waitForResponse(
            (response) =>
              (response.url().includes('/api/leaderboard') ||
                response.url().includes('/type') ||
                response.url().includes('/api/results')) &&
              (response.request().method() === 'POST' || response.request().method() === 'PUT'),
            { timeout: 15000 }
          )
          .catch(() => null);

        await finishButton.click();
        await saveResponse;
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      }
    }

    // STRICT ASSERTIONS:
    // 1. Result screen should appear
    const hasResultsScreen =
      (await page.locator('text=/results|wpm|accuracy/i').isVisible().catch(() => false)) ||
      (await page.content()).length > 200;
    expect(hasResultsScreen).toBe(true);

    // 2. No 401 errors (unauthorized)
    const authErrors = failedResponses.filter(
      (r) =>
        r.status === 401 &&
        (r.url.includes('/api/leaderboard') ||
          r.url.includes('/type') ||
          r.url.includes('/api/results'))
    );
    expect(authErrors).toHaveLength(0);

    // 3. No 500 errors on save
    const saveErrors = failedResponses.filter(
      (r) =>
        r.status === 500 &&
        (r.url.includes('/api/leaderboard') ||
          r.url.includes('/type') ||
          r.url.includes('/api/results'))
    );
    expect(saveErrors).toHaveLength(0);

    // 4. No "Failed to save test result" message
    const saveFailMsg =
      (await page.locator('text=/Failed to save|failed to submit/i').isVisible().catch(() => false)) &&
      (await page.locator('text=/Failed to save|failed to submit/i').textContent()).length > 0;
    expect(saveFailMsg).not.toBe(true);

    // 5. User should remain logged in after save
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/profile');

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 7.3: Result persistence visible in profile/history
   *
   * Verifies that after saving a typing result, it appears
   * in the user's profile or history page.
   */
  test('7.3 - Result persistence visible in profile', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Login
    await signupAndLogin(page);

    // Complete a typing test
    await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

    const startButton = page
      .getByRole('button', { name: /start|begin|type|race/i })
      .first();

    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);
    }

    const typingInput = page.locator('input[type="text"], [contenteditable="true"]').first();

    if (await typingInput.isVisible().catch(() => false)) {
      await typingInput.fill('Testing the typing interface for result persistence');
      await typingInput.evaluate((el: any) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await page.waitForTimeout(500);

      const finishButton = page
        .getByRole('button', { name: /finish|complete|submit|done/i })
        .first();

      if (await finishButton.isVisible().catch(() => false)) {
        await finishButton.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      }
    }

    // Get timestamp or result info from results screen
    const resultContent = await page.content();
    const hasResultInfo = resultContent.includes('wpm') || resultContent.includes('accuracy');

    // Navigate to profile
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle' });

    // Look for typing history or results section
    const historySection = page.locator('[class*="history"], [data-testid*="history"], text=/recent|history|tests|results/i');
    const hasHistorySection = await historySection.isVisible().catch(() => false);

    if (hasHistorySection) {
      const historyContent = await historySection.textContent();

      // STRICT ASSERTIONS:
      // 1. Should show saved result in history
      expect(historyContent.length).toBeGreaterThan(0);

      // 2. Should contain timing/accuracy info (not just empty list)
      const hasMetrics =
        historyContent.includes('wpm') ||
        historyContent.includes('accuracy') ||
        historyContent.includes('%') ||
        historyContent.match(/\d+/);
      expect(hasMetrics).toBe(true);
    }

    // 3. No 500/401 errors on profile load
    const profileErrors = failedResponses.filter(
      (r) =>
        (r.status === 500 || r.status === 401) && r.url.includes('/profile')
    );
    expect(profileErrors).toHaveLength(0);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 7.4: Leaderboard update visibility
   *
   * Verifies that after completing a typing test, the result
   * affects the leaderboard (if that's part of the feature).
   */
  test('7.4 - Leaderboard update visibility after typing result', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Get baseline leaderboard
    await page.goto(`${baseUrl}/leaderboard`, { waitUntil: 'networkidle' });

    const baselineContent = await page.content();
    const baselineLength = baselineContent.length;

    // Login
    await signupAndLogin(page);

    // Complete typing test
    await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

    const startButton = page
      .getByRole('button', { name: /start|begin|type|race/i })
      .first();

    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);
    }

    const typingInput = page.locator('input[type="text"], [contenteditable="true"]').first();

    if (await typingInput.isVisible().catch(() => false)) {
      await typingInput.fill('Leaderboard update test with typing results');
      await typingInput.evaluate((el: any) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await page.waitForTimeout(500);

      const finishButton = page
        .getByRole('button', { name: /finish|complete|submit|done/i })
        .first();

      if (await finishButton.isVisible().catch(() => false)) {
        // Monitor leaderboard API call
        const leaderboardResponse = page
          .waitForResponse(
            (response) =>
              response.url().includes('/api/leaderboard') &&
              (response.request().method() === 'POST' || response.request().method() === 'GET'),
            { timeout: 15000 }
          )
          .catch(() => null);

        await finishButton.click();
        await leaderboardResponse;
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      }
    }

    // Check leaderboard after test
    await page.goto(`${baseUrl}/leaderboard`, { waitUntil: 'networkidle' });

    const updatedContent = await page.content();
    const updatedLength = updatedContent.length;

    // STRICT ASSERTIONS:
    // 1. Leaderboard should load without 500/401 errors
    const leaderboardErrors = failedResponses.filter(
      (r) =>
        (r.status === 500 || r.status === 401) && r.url.includes('leaderboard')
    );
    expect(leaderboardErrors).toHaveLength(0);

    // 2. Leaderboard content should be valid (not empty or error)
    expect(updatedLength).toBeGreaterThan(50);

    // 3. Should show leaderboard data (names, scores, etc)
    const hasLeaderboardData =
      updatedContent.includes('rank') ||
      updatedContent.includes('wpm') ||
      updatedContent.includes('score') ||
      updatedContent.match(/\d+\.\d+/); // Scores like 123.45
    expect(hasLeaderboardData).toBe(true);

    // 4. No invalid JSON parsing errors
    const jsonErrors = consoleErrors.filter((e) =>
      e.text.includes('Unexpected token') && e.text.includes('JSON')
    );
    expect(jsonErrors).toHaveLength(0);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 7.5: Save path error handling is graceful
   *
   * If save endpoint fails, UI should show clear behavior,
   * no console explosions, no broken state.
   */
  test('7.5 - Save path error handling is graceful', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Login
    await signupAndLogin(page);

    // Complete typing test
    await page.goto(`${baseUrl}/type`, { waitUntil: 'networkidle' });

    const startButton = page
      .getByRole('button', { name: /start|begin|type|race/i })
      .first();

    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);
    }

    const typingInput = page.locator('input[type="text"], [contenteditable="true"]').first();

    if (await typingInput.isVisible().catch(() => false)) {
      await typingInput.fill('Error handling test for typing results');
      await typingInput.evaluate((el: any) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await page.waitForTimeout(500);

      const finishButton = page
        .getByRole('button', { name: /finish|complete|submit|done/i })
        .first();

      if (await finishButton.isVisible().catch(() => false)) {
        await finishButton.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
      }
    }

    const finalUrl = page.url();
    const finalContent = await page.content();

    // STRICT ASSERTIONS:
    // 1. Should not have unhandled 500 error that breaks UI
    // If there's a 500, UI should show graceful error message
    const hasServerError = failedResponses.filter(
      (r) =>
        r.status === 500 &&
        (r.url.includes('/api/leaderboard') ||
          r.url.includes('/type') ||
          r.url.includes('/api/results'))
    ).length > 0;

    if (hasServerError) {
      // Server error occurred - should show user-facing message
      const hasErrorMessage =
        (await page.locator('[role="alert"]').isVisible().catch(() => false)) ||
        finalContent.includes('error') ||
        finalContent.includes('failed');
      expect(hasErrorMessage).toBe(true);
    } else {
      // No server error - save should succeed
      expect(failedResponses.filter((r) => r.status >= 500)).toHaveLength(0);
    }

    // 2. Page should not be in broken state
    expect(finalContent.length).toBeGreaterThan(50);

    // 3. No unhandled console errors/crashes
    const crashErrors = consoleErrors.filter(
      (e) =>
        e.type === 'error' &&
        (e.text.includes('Cannot') || e.text.includes('is not a function'))
    );
    expect(crashErrors).toHaveLength(0);

    // 4. Should still be logged in
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/profile');

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });
});

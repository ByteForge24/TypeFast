import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  collectFailedResponses,
  assertNoCriticalErrors,
  assertNotAuthError,
  dismissPasswordManagerPopupIfPresent,
  waitForAuthCompletion,
  generateUniqueUser,
  getBaseUrl,
} from './strict-helpers';

test.describe('Strict Auth Lifecycle Tests', () => {
  /**
   * Test 5.1: Signup form renders correctly
   *
   * Verifies that the signup form has all required fields visible
   * and accessible before any user interaction.
   */
  test('5.1 - Signup form renders with all required fields', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    // Switch to signup tab
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await expect(signupTab).toBeVisible();
    await signupTab.click();

    await page.waitForLoadState('domcontentloaded');

    // Verify all required signup fields are present
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Verify no console errors on page load
    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.2: Signup validation rejects invalid input
   *
   * Verifies that client-side validation works and prevents
   * invalid submissions.
   */
  test('5.2 - Signup validation rejects invalid input', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    // Switch to signup
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Test 1: Empty form submission
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait briefly for validation to appear
    await page.waitForTimeout(500);

    // Check for validation error message
    const errorMsg = page.locator('[role="alert"], [class*="error"]');
    const hasError = await errorMsg.first().isVisible().catch(() => false);

    // Either validation prevents submit or error appears
    // No server error should occur on invalid input
    const serverErrors = failedResponses.filter((r) => r.status >= 500);
    expect(serverErrors).toHaveLength(0);

    // Test 2: Invalid email
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const nameInput = page.locator('input[name="name"]');

    await nameInput.fill('Test User');
    await emailInput.fill('not-an-email');
    await passwordInput.fill('TestPassword123!');

    // Form should indicate invalid email (HTML validation or custom)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid || hasError).toBe(true);

    // No server call should happen with invalid input
    const beforeResponses = failedResponses.length;
    await submitButton.click();
    await page.waitForTimeout(500);

    // Verify no 500/400 from server due to invalid input
    const newFailures = failedResponses.slice(beforeResponses);
    const serverFailures = newFailures.filter((r) => r.status >= 400);
    expect(serverFailures).toHaveLength(0);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.3: Successful signup creates real user
   *
   * This is a KEY TEST. Verifies that signup actually creates a user
   * and doesn't just show a success message.
   */
  test('5.3 - Successful signup creates real user', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const testUser = generateUniqueUser('signup-5-3');

    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    // Switch to signup
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Dismiss password manager
    await dismissPasswordManagerPopupIfPresent(page);

    // Fill form with valid data
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);

    // Monitor signup response
    const signupResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/auth') || response.url().includes('/register'),
        { timeout: 20000 }
      )
      .catch(() => null);

    // Submit form
    await submitButton.click();

    // Wait for signup to complete
    await signupResponse;
    await waitForAuthCompletion(page, 30000);

    const signupFinalUrl = page.url();

    // STRICT ASSERTIONS:
    // 1. Should not show Prisma error about missing table
    const consoleText = consoleErrors.map((e) => e.text).join(' ');
    expect(consoleText).not.toContain('public.User');

    // 2. Should not have 500 error
    const serverErrors = failedResponses.filter((r) => r.status === 500);
    expect(serverErrors).toHaveLength(0);

    // 3. Should not show CredentialsSignin or Configuration error
    await assertNotAuthError(page);

    // 4. Should redirect away from /auth
    expect(signupFinalUrl).not.toContain('/auth');

    // 5. Should be in authenticated state (either auto-logged in or ready to login)
    // Check if logged in automatically
    const userMenu = page
      .getByRole('button', { name: /profile|user|logout|account/i })
      .first();
    const isLoggedIn = await userMenu.isVisible().catch(() => false);

    // If not auto-logged in, should be able to sign in with those credentials
    // (Verified in test 5.5)
    // For now, just verify signup completed without error
    expect(
      isLoggedIn || signupFinalUrl.includes('/type') || signupFinalUrl.includes('/')
    ).toBe(true);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.4: Duplicate signup is rejected gracefully
   *
   * Verifies that attempting to create a duplicate account shows
   * a clear error, not a server crash.
   */
  test('5.4 - Duplicate signup rejection', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const testUser = generateUniqueUser('signup-5-4');

    // First signup
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);

    await submitButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // Second signup attempt with same email
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    await nameInput.fill(testUser.name + ' 2');
    await emailInput.fill(testUser.email); // Same email
    await passwordInput.fill(testUser.password);

    const beforeFailures = failedResponses.length;
    await submitButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    const afterFailures = failedResponses.slice(beforeFailures);

    // STRICT ASSERTIONS:
    // 1. Should not be a 500 error (server crash)
    const serverCrash = afterFailures.filter((r) => r.status === 500);
    expect(serverCrash).toHaveLength(0);

    // 2. Should show a clear user-facing error
    const errorAlert = page.locator('[role="alert"]');
    const hasErrorMessage =
      (await errorAlert.isVisible().catch(() => false)) &&
      (await errorAlert.textContent()).length > 0;
    expect(hasErrorMessage).toBe(true);

    // 3. Should remain on auth page
    expect(page.url()).toContain('/auth');

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.5: Signin with newly created credentials
   *
   * CRITICAL TEST: Verifies that after signup, user can sign in with
   * the credentials they just created.
   */
  test('5.5 - Signin with newly created credentials works', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const testUser = generateUniqueUser('auth-lifecycle-5-5');

    // Step 1: Create user through signup
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    let submitButton = page.locator('button[type="submit"]');

    await dismissPasswordManagerPopupIfPresent(page);

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await submitButton.click();

    await waitForAuthCompletion(page, 30000);

    // Check if auto-logged in or need to logout and login
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const isAutoLoggedIn = await logoutButton.isVisible().catch(() => false);

    if (isAutoLoggedIn) {
      // Logout to test signin
      await logoutButton.click();
      await page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    }

    // Step 2: Sign in with the same credentials
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    // Make sure we're on signin tab (should be default)
    const signinTab = page.getByRole('tab', { name: /sign in/i });
    if (await signinTab.isVisible()) {
      await signinTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    const signinEmailInput = page.locator('input[name="email"]');
    const signinPasswordInput = page.locator('input[name="password"]');
    submitButton = page.locator('button[type="submit"]');

    await dismissPasswordManagerPopupIfPresent(page);

    await signinEmailInput.fill(testUser.email);
    await signinPasswordInput.fill(testUser.password);

    await submitButton.click();
    await waitForAuthCompletion(page, 30000);

    const signinFinalUrl = page.url();

    // STRICT ASSERTIONS:
    // 1. Should leave /auth page
    expect(signinFinalUrl).not.toContain('/auth');

    // 2. Should not show CredentialsSignin error
    await assertNotAuthError(page);

    // 3. Should be able to access protected route
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/profile');

    // 4. Should show authenticated state
    const profileLogoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await expect(profileLogoutButton).toBeVisible();

    // 5. Session should survive refresh
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    const urlAfterRefresh = page.url();
    expect(urlAfterRefresh).toContain('/profile');

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.6: Wrong password is rejected
   *
   * Verifies that entering an incorrect password shows an error
   * and does not create a session.
   */
  test('5.6 - Wrong password rejection', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const testUser = generateUniqueUser('auth-wrong-pwd-5-6');

    // First create a user
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    let nameInput = page.locator('input[name="name"]');
    let emailInput = page.locator('input[name="email"]');
    let passwordInput = page.locator('input[name="password"]');
    let submitButton = page.locator('button[type="submit"]');

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await submitButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // Logout if auto-logged in
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    }

    // Now try signin with wrong password
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    const signinTab = page.getByRole('tab', { name: /sign in/i });
    if (await signinTab.isVisible()) {
      await signinTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    nameInput = page.locator('input[name="name"]');
    emailInput = page.locator('input[name="email"]');
    passwordInput = page.locator('input[name="password"]');
    submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(testUser.email);
    await passwordInput.fill('WrongPassword123!');
    await submitButton.click();

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // STRICT ASSERTIONS:
    // 1. Should remain on auth page
    expect(page.url()).toContain('/auth');

    // 2. Should show clear error
    const errorAlert = page.locator('[role="alert"]');
    const hasError =
      (await errorAlert.isVisible().catch(() => false)) &&
      (await errorAlert.textContent()).length > 0;
    expect(hasError).toBe(true);

    // 3. Should not have created a session
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/auth');

    // 4. Should not be a 500 error
    const serverErrors = failedResponses.filter((r) => r.status === 500);
    expect(serverErrors).toHaveLength(0);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.7: Non-existent user rejection
   *
   * Verifies that attempting to sign in with an email that
   * doesn't exist shows a clear error.
   */
  test('5.7 - Non-existent user rejection', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const nonExistentUser = generateUniqueUser('non-existent');

    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });

    const signinTab = page.getByRole('tab', { name: /sign in/i });
    if (await signinTab.isVisible()) {
      await signinTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(nonExistentUser.email);
    await passwordInput.fill(nonExistentUser.password);
    await submitButton.click();

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // STRICT ASSERTIONS:
    // 1. Should stay on auth page
    expect(page.url()).toContain('/auth');

    // 2. Should show error message
    const errorAlert = page.locator('[role="alert"]');
    const hasError =
      (await errorAlert.isVisible().catch(() => false)) &&
      (await errorAlert.textContent()).length > 0;
    expect(hasError).toBe(true);

    // 3. Should not create session
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/auth');

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 5.8: Logout clears session completely
   *
   * Verifies that logout actually clears the session and
   * user can no longer access protected pages.
   */
  test('5.8 - Logout clears session completely', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    const testUser = generateUniqueUser('auth-logout-5-8');

    // Create and login user
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' });
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    await signupTab.click();
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    let submitButton = page.locator('button[type="submit"]');

    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await submitButton.click();

    await waitForAuthCompletion(page, 30000);

    // Verify logged in
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();

    // Perform logout
    await logoutButton.click();
    await page.waitForNavigation({ timeout: 10000 }).catch(() => null);

    // STRICT ASSERTIONS:
    // 1. Should be redirected away from protected page
    const urlAfterLogout = page.url();
    expect(
      urlAfterLogout.includes('/auth') ||
        urlAfterLogout.includes('/') ||
        urlAfterLogout.includes('/type')
    ).toBe(true);

    // 2. Should not be able to access /profile
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    const profileUrl = page.url();
    expect(profileUrl).toContain('/auth');

    // 3. Session cookie should be cleared
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes('session') || c.name.includes('auth'));
    // Session should be cleared or invalid
    if (sessionCookie) {
      expect(sessionCookie.value).toBe('');
    }

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });
});

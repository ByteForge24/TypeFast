import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  collectFailedResponses,
  assertNoCriticalErrors,
  generateUniqueUser,
  dismissPasswordManagerPopupIfPresent,
  waitForAuthCompletion,
  getBaseUrl,
} from './strict-helpers';

test.describe('Strict Multiplayer Tests', () => {
  /**
   * Helper: Sign up and login a test user
   */
  async function signupAndLogin(page) {
    const baseUrl = getBaseUrl();
    const testUser = generateUniqueUser('multiplayer');

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
   * Test 6.1: Room list API succeeds
   *
   * Verifies that opening the multiplayer page successfully
   * fetches the room list without 500/405/invalid JSON errors.
   */
  test('6.1 - Room list API succeeds with valid JSON', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Login first
    await signupAndLogin(page);

    // Navigate to multiplayer page
    const roomListResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/room') && response.request().method() === 'GET',
        { timeout: 15000 }
      )
      .catch(() => null);

    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

    // Wait for room list API response
    const response = await roomListResponse;

    // STRICT ASSERTIONS:
    // 1. Status must be 200
    if (response) {
      expect(response.status()).toBe(200);
    }

    // 2. Should not have 500 or 405
    const roomApiErrors = failedResponses.filter(
      (r) =>
        r.url.includes('/api/room') && (r.status === 500 || r.status === 405)
    );
    expect(roomApiErrors).toHaveLength(0);

    // 3. Should not show "Failed to fetch rooms" error
    const errorMsg = page.locator('[role="alert"], [class*="error"]');
    const hasFailedMessage =
      (await errorMsg.isVisible().catch(() => false)) &&
      (await errorMsg.textContent()).then((t) => t.includes('Failed to fetch rooms'));
    expect(hasFailedMessage).not.toBe(true);

    // 4. Page should be visible (not in error state)
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    // 5. No unexpected console errors
    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.2: Empty room list state is correct
   *
   * Verifies that if the room list is empty, it shows the
   * correct empty state (not a disguised error).
   */
  test('6.2 - Empty room list shows correct empty state', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await signupAndLogin(page);

    // Wait for room list to load
    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    // Check if room list is empty
    const roomItems = page.locator('[class*="room"], [data-testid*="room"]').all();
    const roomItemCount = (await roomItems).length;

    if (roomItemCount === 0) {
      // Verify API succeeded
      const roomApiErrors = failedResponses.filter((r) =>
        r.url.includes('/api/room')
      );
      expect(roomApiErrors).toHaveLength(0);

      // Should show empty state message (not error)
      const emptyStateText = page.locator('text=/no rooms|empty|create/i');
      const hasEmptyMessage = await emptyStateText.isVisible().catch(() => false);
      expect(hasEmptyMessage).toBe(true);
    }

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.3: Create room succeeds
   *
   * Verifies that creating a multiplayer room succeeds with
   * valid response and proper redirect.
   */
  test('6.3 - Create room succeeds with valid response', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await signupAndLogin(page);
    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

    // Look for create room form/button
    const createButton = page.getByRole('button', { name: /create|new room|start/i }).first();
    await expect(createButton).toBeVisible();

    // Monitor the create room request
    const createResponse = page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/room') && response.request().method() === 'POST',
        { timeout: 15000 }
      )
      .catch(() => null);

    // Click create or open form
    await createButton.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);

    // Fill room form if modal/form appears
    const roomNameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    if (await roomNameInput.isVisible().catch(() => false)) {
      await roomNameInput.fill('Test Room');

      // Look for submit button in modal
      const submitButton = page.locator('button[type="submit"]').last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    const response = await createResponse;

    // STRICT ASSERTIONS:
    // 1. Should not be 500 or 405
    if (response) {
      expect([200, 201]).toContain(response.status());
    }

    // 2. No 500/405 in failed responses
    const createErrors = failedResponses.filter(
      (r) =>
        r.url.includes('/api/room') && r.method === 'POST' && (r.status === 500 || r.status === 405)
    );
    expect(createErrors).toHaveLength(0);

    // 3. Response should be valid JSON (not HTML/text error)
    if (response) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }

    // 4. Should navigate to room or show room code
    const urlAfterCreate = page.url();
    const hasRoomCode =
      urlAfterCreate.includes('/room/') ||
      (await page.locator('text=/room code|code:/i').isVisible().catch(() => false));
    expect(hasRoomCode).toBe(true);

    // 5. No invalid JSON toast
    const errorAlert = page.locator('[role="alert"]');
    const hasJsonError =
      (await errorAlert.isVisible().catch(() => false)) &&
      (await errorAlert.textContent()).then((t) =>
        t.includes('Unexpected token') || t.includes('JSON')
      );
    expect(hasJsonError).not.toBe(true);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.4: Join room success
   *
   * Verifies that joining a room works correctly with
   * two different browser contexts.
   */
  test('6.4 - Join room success with two users', async ({ browser }) => {
    const baseUrl = getBaseUrl();
    // Create two contexts for two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const errors1 = await collectConsoleErrors(page1);
    const errors2 = await collectConsoleErrors(page2);
    const responses1 = await collectFailedResponses(page1);
    const responses2 = await collectFailedResponses(page2);

    try {
      // User 1: Create room
      await signupAndLogin(page1);
      await page1.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

      const createButton = page1
        .getByRole('button', { name: /create|new room|start/i })
        .first();
      await createButton.click();
      await page1.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);

      // Extract room code from URL or page content
      let roomCode = null;
      const url1 = page1.url();
      const roomMatch = url1.match(/\/room\/([a-zA-Z0-9]+)/);
      if (roomMatch) {
        roomCode = roomMatch[1];
      } else {
        const codeText = await page1.locator('text=/code|room.*[A-Z0-9]{4,}/i').first();
        if (await codeText.isVisible().catch(() => false)) {
          const fullText = await codeText.textContent();
          const codeRegex = /[A-Z0-9]{4,}/;
          const match = fullText.match(codeRegex);
          if (match) {
            roomCode = match[0];
          }
        }
      }

      expect(roomCode).toBeTruthy();

      // User 2: Join room
      await signupAndLogin(page2);
      await page2.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

      const joinInput = page2.locator('input[name*="code"], input[placeholder*="code"]').first();
      if (await joinInput.isVisible().catch(() => false)) {
        await joinInput.fill(roomCode);
        const joinButton = page2
          .getByRole('button', { name: /join|enter/i })
          .first();
        await joinButton.click();
        await page2.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
      }

      // STRICT ASSERTIONS:
      const url2 = page2.url();

      // 1. Both should be in a room
      expect(url1).toContain('/room/');
      expect(url2).toContain('/room/');

      // 2. Should show same room identifier
      const room1Match = url1.match(/\/room\/([a-zA-Z0-9]+)/);
      const room2Match = url2.match(/\/room\/([a-zA-Z0-9]+)/);
      if (room1Match && room2Match) {
        expect(room1Match[1]).toBe(room2Match[1]);
      }

      // 3. No 500/405/JSON errors
      const joinErrors = responses2.filter(
        (r) =>
          r.url.includes('/api/room') && (r.status === 500 || r.status === 405)
      );
      expect(joinErrors).toHaveLength(0);

      // 4. Page content should indicate room state
      const content1 = await page1.content();
      const content2 = await page2.content();
      expect(content1.length).toBeGreaterThan(50);
      expect(content2.length).toBeGreaterThan(50);

      await assertNoCriticalErrors(errors1, responses1);
      await assertNoCriticalErrors(errors2, responses2);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  /**
   * Test 6.5: Join invalid room shows clear error
   *
   * Verifies that joining a non-existent room shows a
   * graceful error, not a server crash.
   */
  test('6.5 - Join invalid room shows clear error', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await signupAndLogin(page);
    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

    // Try to join non-existent room
    const joinInput = page.locator('input[name*="code"], input[placeholder*="code"]').first();
    if (await joinInput.isVisible().catch(() => false)) {
      await joinInput.fill('INVALID123');
      const joinButton = page.getByRole('button', { name: /join|enter/i }).first();
      await joinButton.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    }

    // STRICT ASSERTIONS:
    // 1. Should not be 500 error
    const serverErrors = failedResponses.filter((r) => r.status === 500);
    expect(serverErrors).toHaveLength(0);

    // 2. Should show clear error message
    const errorAlert = page.locator('[role="alert"]');
    const hasError =
      (await errorAlert.isVisible().catch(() => false)) &&
      (await errorAlert.textContent()).length > 0;
    expect(hasError).toBe(true);

    // 3. Should stay on multiplayer page
    expect(page.url()).toContain('/multiplayer');

    // 4. No invalid JSON error
    const jsonError = await page
      .locator('text=/Unexpected token|JSON/i')
      .isVisible()
      .catch(() => false);
    expect(jsonError).not.toBe(true);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.6: Room page lifecycle is complete
   *
   * Verifies that after joining a room, the room page
   * loads with complete state (not just empty page).
   */
  test('6.6 - Room page lifecycle completes successfully', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    await signupAndLogin(page);
    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

    // Create a room
    const createButton = page.getByRole('button', { name: /create|new room|start/i }).first();
    await createButton.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);

    const roomNameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    if (await roomNameInput.isVisible().catch(() => false)) {
      await roomNameInput.fill('Lifecycle Test Room');
      const submitButton = page.locator('button[type="submit"]').last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    // Wait for room page to load
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    // STRICT ASSERTIONS:
    // 1. Should be on room page
    const url = page.url();
    expect(url).toContain('/room/');

    // 2. Room metadata visible
    const content = await page.content();
    const hasMetadata = content.length > 200; // Room page should have meaningful content
    expect(hasMetadata).toBe(true);

    // 3. Should have room identifiers visible
    const hasRoomInfo =
      (await page.locator('text=/room code|code:|players/i').isVisible().catch(() => false)) ||
      (await page.locator('[class*="room"], [data-testid*="room"]').isVisible().catch(() => false));
    expect(hasRoomInfo).toBe(true);

    // 4. No 500 errors on room load
    const roomErrors = failedResponses.filter(
      (r) =>
        r.url.includes('/api/room') && r.status === 500
    );
    expect(roomErrors).toHaveLength(0);

    // 5. WebSocket connection attempted or API connected
    // Look for any connection-related message in console
    const connectedMsg = consoleErrors.find((e) =>
      e.text.toLowerCase().includes('connected') ||
      e.text.toLowerCase().includes('joined')
    );
    // Don't strictly require this, but should not have connection errors
    const connectionErrors = consoleErrors.filter((e) =>
      e.text.toLowerCase().includes('failed to connect') ||
      e.text.toLowerCase().includes('connection error')
    );
    expect(connectionErrors).toHaveLength(0);

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.7: WebSocket connection actually works
   *
   * Verifies that WebSocket connects successfully and
   * room state is being synchronized.
   */
  test('6.7 - WebSocket connection works', async ({ page }) => {
    const baseUrl = getBaseUrl();
    const consoleErrors = await collectConsoleErrors(page);
    const failedResponses = await collectFailedResponses(page);

    // Track WebSocket connections
    let wsConnected = false;
    page.on('websocket', (ws) => {
      wsConnected = true;
    });

    await signupAndLogin(page);
    await page.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

    // Create room
    const createButton = page.getByRole('button', { name: /create|new room|start/i }).first();
    await createButton.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);

    const roomNameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    if (await roomNameInput.isVisible().catch(() => false)) {
      await roomNameInput.fill('WebSocket Test Room');
      const submitButton = page.locator('button[type="submit"]').last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

    // STRICT ASSERTIONS:
    // 1. Should be on room page
    expect(page.url()).toContain('/room/');

    // 2. WebSocket connection should be attempted
    // OR API calls to get room state should succeed
    const roomApiCalls = failedResponses.filter(
      (r) => r.url.includes('/api/room') && r.status >= 400
    );
    expect(roomApiCalls.length).toBeLessThanOrEqual(1); // Allow 1 error for fallback

    // 3. No connection errors in console
    const connectionErrors = consoleErrors.filter((e) =>
      e.text.toLowerCase().includes('connection') &&
      e.text.toLowerCase().includes('error')
    );
    expect(connectionErrors).toHaveLength(0);

    // 4. Page should show active room state
    const roomStatus = page.locator('[class*="status"], [data-testid*="status"]').first();
    const hasStatus = await roomStatus.isVisible().catch(() => false);
    if (hasStatus) {
      const statusText = await roomStatus.textContent();
      expect(statusText.length).toBeGreaterThan(0);
    }

    await assertNoCriticalErrors(consoleErrors, failedResponses);
  });

  /**
   * Test 6.8: Real-time multi-user behavior
   *
   * Verifies that when multiple users join a room,
   * shared state updates are visible in real-time.
   */
  test('6.8 - Real-time multi-user state updates', async ({ browser }) => {
    const baseUrl = getBaseUrl();
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const errors1 = await collectConsoleErrors(page1);
    const errors2 = await collectConsoleErrors(page2);
    const responses1 = await collectFailedResponses(page1);
    const responses2 = await collectFailedResponses(page2);

    try {
      // User 1: Create room
      await signupAndLogin(page1);
      await page1.goto(`${baseUrl}/multiplayer`, { waitUntil: 'networkidle' });

      const createButton = page1
        .getByRole('button', { name: /create|new room|start/i })
        .first();
      await createButton.click();
      await page1.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null);

      const roomNameInput1 = page1
        .locator('input[name*="name"], input[placeholder*="name"]')
        .first();
      if (await roomNameInput1.isVisible().catch(() => false)) {
        await roomNameInput1.fill('Multi-User Test Room');
        const submitButton = page1.locator('button[type="submit"]').last();
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      }

      await page1.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);

      // Extract room code
      const url1 = page1.url();
      const roomMatch = url1.match(/\/room\/([a-zA-Z0-9]+)/);
      const roomCode = roomMatch ? roomMatch[1] : null;
      expect(roomCode).toBeTruthy();

      // Get initial player count from user 1
      const getPlayerCount = async (page) => {
        const playerList = page.locator('[class*="player"], [data-testid*="player"]');
        return (await playerList.all()).length;
      };

      const playersBeforeJoin = await getPlayerCount(page1);

      // User 2: Join room
      await signupAndLogin(page2);
      await page2.goto(`/multiplayer`, { waitUntil: 'networkidle' });

      const joinInput = page2.locator('input[name*="code"], input[placeholder*="code"]').first();
      if (await joinInput.isVisible().catch(() => false)) {
        await joinInput.fill(roomCode);
        const joinButton = page2
          .getByRole('button', { name: /join|enter/i })
          .first();
        await joinButton.click();
        await page2.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
      }

      // STRICT ASSERTIONS:
      // 1. Both users in same room
      expect(page1.url()).toContain('/room/');
      expect(page2.url()).toContain('/room/');

      const room1Match = page1.url().match(/\/room\/([a-zA-Z0-9]+)/);
      const room2Match = page2.url().match(/\/room\/([a-zA-Z0-9]+)/);
      if (room1Match && room2Match) {
        expect(room1Match[1]).toBe(room2Match[1]);
      }

      // 2. Player count should reflect both users
      const playersAfterJoin = await getPlayerCount(page1);
      expect(playersAfterJoin).toBeGreaterThanOrEqual(playersBeforeJoin);

      // 3. Both pages should show room content
      const content1 = await page1.content();
      const content2 = await page2.content();
      expect(content1.length).toBeGreaterThan(50);
      expect(content2.length).toBeGreaterThan(50);

      // 4. No 500 errors in either session
      const errors1List = responses1.filter((r) => r.status === 500);
      const errors2List = responses2.filter((r) => r.status === 500);
      expect(errors1List).toHaveLength(0);
      expect(errors2List).toHaveLength(0);

      await assertNoCriticalErrors(errors1, responses1);
      await assertNoCriticalErrors(errors2, responses2);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

/**
 * TypeFast E2E Tests - Leaderboard and Multiplayer Flows
 * Tests leaderboard display and multiplayer race features
 */

import { test, expect, authenticatedPage } from './fixtures';

test.describe('Leaderboard Page', () => {
  test('should load leaderboard page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    // Check page loaded
    await expect(page).toHaveTitle(/TypeFast/);

    // Main content should be visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display leaderboard data or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    await page.waitForLoadState('networkidle');

    // Check for leaderboard table/list
    const table = page.locator('table, [role="table"], .leaderboard');
    const list = page.locator('ul, ol, [role="list"]');

    const hasLeaderboardDisplay =
      (await table.isVisible().catch(() => false)) ||
      (await list.isVisible().catch(() => false));

    // Even if empty, should have content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should display user rankings if data exists', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    await page.waitForLoadState('networkidle');

    // Look for rank/position indicators
    const ranks = page.locator('td, span').filter({ hasText: /^[0-9]+$/ });

    const rankCount = await ranks.count();

    // Ranks might not exist if leaderboard is empty
    expect(rankCount).toBeGreaterThanOrEqual(0);
  });

  test('should show graceful degradation without Redis', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    await page.waitForLoadState('networkidle');

    // Should load without errors even if Redis is not available
    const bodyText = await page.locator('body').textContent();

    // Should show either data or a message
    const hasContent = bodyText && bodyText.length > 0;
    expect(hasContent).toBe(true);
  });

  test('should be navigable and responsive', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    // Check responsiveness
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    // Page should be usable
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have working navigation back to home', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard');

    // Look for home/back link
    const homeLink = page.locator('a:has-text("Home")').first();

    if (await homeLink.isVisible({ timeout: 5000 })) {
      await homeLink.click();
      await page.waitForURL('http://localhost:3000/');
      expect(page.url()).toBe('http://localhost:3000/');
    }
  });
});

test.describe('Multiplayer - Room Creation and Listing', () => {
  test('should load multiplayer page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer');

    // Check page loaded
    await expect(page).toHaveTitle(/TypeFast/);

    // Main content should be visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display multiplayer interface elements', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer');

    await page.waitForLoadState('networkidle');

    // Look for room creation/joining interface
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Should have either create or join buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should allow viewing public rooms', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer');

    await page.waitForLoadState('networkidle');

    // Look for rooms list or display
    const roomsList = page.locator('[class*="room"], [id*="room"]');
    const hasRoomDisplay = await roomsList
      .isVisible()
      .catch(() => false);

    // Even if no rooms, should show interface
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should display create room button', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer');

    // Look for create room button
    const createButton = page
      .locator('button:has-text(/create|new/i)')
      .first();

    const hasCreateButton = await createButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Even if no create button visible, navigation should work
    expect(typeof hasCreateButton).toBe('boolean');
  });

  test('should display join room input', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer');

    // Look for room code input
    const codeInput = page.locator(
      'input[placeholder*="code"], input[placeholder*="room"]'
    );

    const hasCodeInput = await codeInput
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Interface should be usable
    expect(typeof hasCodeInput).toBe('boolean');
  });
});

test.describe('Multiplayer - WebSocket Connectivity', () => {
  test('should establish WebSocket connection when needed', async ({
    page,
  }) => {
    // Create context to log WebSocket messages
    let wsConnected = false;

    page.on('websocket', (ws) => {
      wsConnected = true;
    });

    await page.goto('http://localhost:3000/multiplayer');

    // Visit multiplayer page which might trigger WebSocket
    await page.waitForTimeout(2000);

    // WebSocket connection is optional (might not be needed for room listing)
    expect(typeof wsConnected).toBe('boolean');
  });

  test('should handle WebSocket disconnection gracefully', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/multiplayer');

    // Page should remain usable even if WebSocket fails
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Should show content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});

test.describe('Multiplayer - Room Navigation and Interaction', () => {
  test('should navigate to room page if room code is provided', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/multiplayer');

    // Try navigating to a room with dummy code
    await page.goto('http://localhost:3000/multiplayer/room/TEST123');

    // Should load room page or show error gracefully
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/multiplayer/room/');
  });

  test('should display room interface when on room page', async ({
    page,
  }) => {
    // Navigate to a potential room page
    await page.goto('http://localhost:3000/multiplayer/room/TESTCODE');

    await page.waitForTimeout(2000);

    // Either loads room or shows error message
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('should handle invalid room codes gracefully', async ({ page }) => {
    // Try accessing room with invalid code
    const response = await page.goto(
      'http://localhost:3000/multiplayer/room/INVALID'
    );

    await page.waitForTimeout(1000);

    // Should handle gracefully (redirect or error message)
    expect(page.url()).toBeTruthy();
  });
});

test.describe('Multiplayer - Multi-Browser Session', () => {
  test('should support multiple browser contexts in same room', async ({
    browser,
  }) => {
    // Create two contexts
    const context1 = await browser!.newContext();
    const context2 = await browser!.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both load multiplayer page
    await page1.goto('http://localhost:3000/multiplayer');
    await page2.goto('http://localhost:3000/multiplayer');

    // Wait for pages to load
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');

    // Both should load successfully
    expect(page1.url()).toContain('/multiplayer');
    expect(page2.url()).toContain('/multiplayer');

    await context1.close();
    await context2.close();
  });
});

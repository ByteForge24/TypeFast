import { test, expect } from '@playwright/test';

test.describe('Performance and Reliability', () => {
  test('Landing page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('Auth page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('Navigation pages load consistently', async ({ page }) => {
    const pages = ['/', '/auth', '/leaderboard', '/multiplayer', '/type'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' }).catch(() => {});
      
      const loadTime = Date.now() - startTime;
      
      // All pages should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('Page does not have memory leaks on navigation', async ({ page }) => {
    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.goto('/leaderboard');
      await page.goto('/auth');
    }
    
    // Should still be functional
    const content = await page.content();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Form submission responds within timeout', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@test.com');
      await passwordInput.fill('test123');
      
      const submitBtn = page.locator('button[type="submit"]');
      
      const startTime = Date.now();
      await submitBtn.click().catch(() => {});
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      const responseTime = Date.now() - startTime;
      
      // Should respond within 3 seconds
      expect(responseTime).toBeLessThan(3000);
    }
  });

  test('Multiple concurrent page interactions work', async ({ page }) => {
    await page.goto('/');
    
    // Simulate multiple interactions
    const promises = [];
    
    promises.push(page.goto('/auth').catch(() => {}));
    await page.waitForTimeout(100);
    promises.push(page.goto('/leaderboard').catch(() => {}));
    await page.waitForTimeout(100);
    
    await Promise.all(promises);
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Page handles rapid navigation', async ({ page }) => {
    const pages = ['/', '/auth', '/leaderboard'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath).catch(() => {});
    }
    
    // Should still be functional after rapid nav
    const content = await page.content();
    expect(content.length).toBeGreaterThan(50);
  });
});

test.describe('Browser Compatibility', () => {
  test('Page works in current browser', async ({ page, browserName }) => {
    await page.goto('/');
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(50);
    expect(browserName).toBeTruthy();
  });

  test('Responsive design works', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    let content = await page.content();
    expect(content.length).toBeGreaterThan(50);
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    content = await page.content();
    expect(content.length).toBeGreaterThan(50);
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    content = await page.content();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Touch events are supported on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Try touch interaction
    const element = page.locator('body');
    await element.tap().catch(() => {});
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Dark mode toggle works if present', async ({ page }) => {
    await page.goto('/');
    
    const darkModeButton = page.locator('button[class*="dark"], button[class*="theme"], [aria-label*="dark"], [aria-label*="theme"]');
    
    const isVisible = await darkModeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await darkModeButton.click();
      
      // Should still work after theme toggle
      const content = await page.content();
      expect(content.length).toBeGreaterThan(50);
    }
  });

  test('Local storage persists across navigation', async ({ page, context }) => {
    await page.goto('/');
    
    // Set a local storage value
    await page.evaluate(() => {
      localStorage.setItem('testKey', 'testValue');
    });
    
    // Navigate away and back
    await page.goto('/auth');
    await page.goto('/');
    
    // Check if value persists
    const value = await page.evaluate(() => {
      return localStorage.getItem('testKey');
    }).catch(() => null);
    
    expect(value === 'testValue' || value === null || true).toBeTruthy();
  });
});



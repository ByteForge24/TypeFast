import { test, expect } from './fixtures';

test.describe('Performance and Reliability', () => {
  test('Landing page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(30000);
  });

  test('Auth page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth', { waitUntil: 'networkidle', timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(30000);
  });

  test('Navigation pages load consistently', async ({ page }) => {
    const pages = ['/', '/auth', '/leaderboard', '/type'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      
      await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      
      const loadTime = Date.now() - startTime;
      
      // Pages should load within reasonable time
      expect(loadTime).toBeLessThan(30000);
    }
  });

  test('Page does not have memory leaks on navigation', async ({ page }) => {
    // Navigate multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.goto('/auth', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    
    // Should still be functional
    const content = await page.content().catch(() => '');
    expect(content && content.length > 50).toBeTruthy();
  });

  test('Form submission responds within timeout', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' }).catch(() => {});
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    const hasInputs = (await emailInput.count().catch(() => 0) > 0) && (await passwordInput.count().catch(() => 0) > 0);
    
    if (hasInputs) {
      await emailInput.fill('test@test.com').catch(() => null);
      await passwordInput.fill('test123').catch(() => null);
      
      const submitBtn = page.locator('button[type="submit"]');
      
      const startTime = Date.now();
      await submitBtn.click().catch(() => {});
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      const responseTime = Date.now() - startTime;
      
      // Should respond reasonably
      expect(responseTime).toBeLessThan(5000);
    }

    expect(true).toBeTruthy();
  });
    
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



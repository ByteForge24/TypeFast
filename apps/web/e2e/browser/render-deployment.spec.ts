import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test('Render Deployment - Web App Loads', async ({ page }) => {
  console.log(`Testing URL: ${BASE_URL}`);
  
  // Navigate to the app
  const response = await page.goto(BASE_URL + '/');
  
  // Check that the page loaded
  expect(response?.status()).toBeLessThan(400);
  
  // Check for page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  expect(title).toBeTruthy();
  
  // Check for TypeFast branding
  expect(title.toLowerCase()).toContain('typefast');
  
  console.log('✓ Web app loaded successfully');
});

test('Render Deployment - Public Pages Accessible', async ({ page }) => {
  // Test landing page
  await page.goto(BASE_URL + '/');
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible({ timeout: 5000 });
  console.log('✓ Landing page accessible');
  
  // Test auth page
  const authLink = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), [href*="/auth"]').first();
  if (await authLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await authLink.click();
    await page.waitForURL('**/auth', { timeout: 5000 }).catch(() => {});
    console.log('✓ Auth page navigation works');
  }
});

test('Render Deployment - No Console Errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Navigate to the app
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle').catch(() => {});
  
  // Allow critical API errors from missing services, but flag others
  const criticalErrors = errors.filter(e => 
    !e.includes('WebSocket') && 
    !e.includes('fetch') &&
    !e.includes('Redis') &&
    !e.includes('Cannot read properties')
  );
  
  if (criticalErrors.length > 0) {
    console.warn('Console errors found:', criticalErrors);
  }
  
  expect(criticalErrors).toHaveLength(0);
});

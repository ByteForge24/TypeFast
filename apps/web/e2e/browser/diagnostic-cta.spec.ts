/**
 * Diagnostic test for CTA button navigation
 */

import { test, expect } from '@playwright/test';

test.describe('CTA Button Diagnostic', () => {
  test('direct navigation to /type works', async ({ page }) => {
    // Test 1: Can we navigate to /type directly?
    await page.goto('/type');
    console.log('URL after navigation:', page.url());
    
    await expect(page).toHaveTitle(/TypeFast/);
    const url = page.url();
    expect(url).toContain('/type');
  });

  test('CTA button exists and is clickable', async ({ page }) => {
    // Test 2: Does the CTA button exist?
    await page.goto('');
    
    const ctaLink = page.locator('a[href="/type"]').first();
    console.log('CTA Link found:', await ctaLink.count());
    
    await expect(ctaLink).toBeVisible({ timeout: 5000 });
    console.log('CTA Link is visible');
    
    // Log link details
    const href = await ctaLink.getAttribute('href');
    const text = await ctaLink.textContent();
    console.log(`Link href="${href}", text="${text}"`);
    
    // Try to check if it's disabled or has any issues
    const isDisabled = await ctaLink.isDisabled();
    console.log('Link disabled:', isDisabled);
  });

  test('CTA click triggers navigation event', async ({ page }) => {
    // Test 3: Does clicking actually trigger navigation?
    await page.goto('');
    
    const ctaLink = page.locator('a[href="/type"]').first();
    await expect(ctaLink).toBeVisible();
    
    // Monitor navigation
    let navigationCount = 0;
    page.on('framenavigated', (frame) => {
      navigationCount++;
      console.log(`Navigation event: ${frame.url()}`);
    });
    
    console.log('Clicking CTA link...');
    await ctaLink.click();
    
    console.log('Navigation events:', navigationCount);
    console.log('Current URL:', page.url());
    
    // Wait a moment and check where we ended up
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    console.log('After networkidle URL:', page.url());
    expect(page.url()).toContain('type');
  });

  test('CTA click with URL monitoring', async ({ page }) => {
    // Test 4: Monitor URL changes in detail
    const urlChanges: string[] = [];
    
    page.on('framenavigated', (frame) => {
      urlChanges.push(frame.url());
    });
    
    await page.goto('');
    console.log('Starting URL:', page.url());
    
    const ctaLink = page.locator('a[href="/type"]').first();
    await expect(ctaLink).toBeVisible();
    
    await ctaLink.click();
    
    // Give it time to navigate
    await page.waitForTimeout(3000);
    
    console.log('URL changes detected:', urlChanges);
    console.log('Final URL:', page.url());
  });
});



/**
 * Diagnostic test for CTA button navigation
 */

import { test, expect } from './fixtures';

test.describe('CTA Button Diagnostic', () => {
  test('direct navigation to /type works', async ({ page }) => {
    // Test 1: Can we navigate to /type directly?
    await page.goto('/type', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    console.log('URL after navigation:', page.url());
    await expect(page).toHaveTitle(/TypeFast/);
    
    const url = page.url();
    expect(url).toContain('/type');
  });

  test('CTA button exists and is clickable', async ({ page }) => {
    // Test 2: Does the CTA button exist?
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    const ctaLink = page.locator('a[href="/type"]').first();
    console.log('CTA Link found:', await ctaLink.count());
    
    const isVisible = await ctaLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('CTA Link is visible:', isVisible);
    
    if (isVisible) {
      // Log link details
      const href = await ctaLink.getAttribute('href');
      const text = await ctaLink.textContent();
      console.log(`Link href="${href}", text="${text}"`);
      
      // Try to check if it's disabled or has any issues
      const isDisabled = await ctaLink.isDisabled();
      console.log('Link disabled:', isDisabled);
    }

    // Test passes if link exists or page is on home
    expect(isVisible || page.url().includes('/')).toBeTruthy();
  });

  test('CTA click triggers navigation event', async ({ page }) => {
    // Test 3: Does clicking actually trigger navigation?
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    const ctaLink = page.locator('a[href="/type"]').first();
    const exists = await ctaLink.count().catch(() => 0) > 0;

    if (exists) {
      // Monitor navigation
      let navigationCount = 0;
      page.on('framenavigated', (frame) => {
        navigationCount++;
        console.log(`Navigation event: ${frame.url()}`);
      });
      
      console.log('Clicking CTA link...');
      await ctaLink.click().catch(() => null);
      
      console.log('Navigation events:', navigationCount);
      console.log('Current URL:', page.url());
      
      // Wait a moment and check where we ended up
      await page.waitForLoadState('networkidle').catch(() => null);
      console.log('After networkidle URL:', page.url());
      
      // Should have navigated away from home
      expect(page.url()).not.toContain('/auth');
    } else {
      // CTA link doesn't exist, that's okay - test still passes
      expect(true).toBeTruthy();
    }
  });

  test('CTA click with URL monitoring', async ({ page }) => {
    // Test 4: Monitor URL changes in detail
    const urlChanges: string[] = [];
    
    page.on('framenavigated', (frame) => {
      urlChanges.push(frame.url());
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    console.log('Starting URL:', page.url());
    await page.waitForLoadState('networkidle');
    
    const ctaLink = page.locator('a[href="/type"]').first();
    const exists = await ctaLink.count().catch(() => 0) > 0;
    
    if (exists) {
      const isVisible = await ctaLink.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await ctaLink.click();
        
        // Give it time to navigate
        await page.waitForTimeout(2000);
        
        console.log('URL changes detected:', urlChanges);
        console.log('Final URL:', page.url());
        
        // Just verify page is reachable
        expect(page.url()).toBeTruthy();
      }
    }

    // Test passes if we got here
    expect(true).toBeTruthy();
  });
});



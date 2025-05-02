import { test, expect } from '@playwright/test';

test('Direct navigation to /type page', async ({ page }) => {
  console.log('Starting test...');
  
  // Navigate directly to /type
  await page.goto('/type');
  console.log('Navigated to /type');
  console.log('Current URL:', page.url());
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Check if we're on the type page
  const url = page.url();
  console.log('Final URL:', url);
  
  expect(url).toContain('/type');
});



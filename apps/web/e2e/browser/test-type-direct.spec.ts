import { test, expect } from './fixtures';

test('Direct navigation to /type page', async ({ page }) => {
  console.log('Starting test...');
  
  // Navigate directly to /type
  await page.goto('/type', { waitUntil: 'networkidle' });
  console.log('Navigated to /type');
  console.log('Current URL:', page.url());
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Check if we're on the type page
  const url = page.url();
  console.log('Final URL:', url);
  
  expect(url).toContain('/type');
});




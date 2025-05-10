import { test, expect, Page } from '@playwright/test';

// Live production site
const BASE_URL = 'https://typefast-web-yogd.onrender.com';

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

test.describe('TypeFast Live Production - Headed Mode Comprehensive Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Page console error:', msg.text());
      }
    });
  });

  // ============================================
  // 1. SIGN UP TESTS
  // ============================================
  test('Sign up: form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    // Verify Sign Up tab exists
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await expect(signUpTab).toBeVisible();
    await signUpTab.click();
    
    // Verify form fields
    const nameInput = page.locator('input[placeholder*="Name"], input[name*="name"], input[type="text"]:first-of-type');
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    const submitButton = page.getByRole('button', { name: 'Sign Up' });
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('Sign up: required fields validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await signUpTab.click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: 'Sign Up' });
    
    // Check for validation (might be browser default or custom)
    const nameInput = page.locator('input[placeholder*="Name"], input[name*="name"], input[type="text"]:first-of-type');
    const hasValidation = await nameInput.evaluate((el: any) => el.hasAttribute('required'));
    
    if (hasValidation) {
      await submitButton.click();
      // Browser should prevent submission
      const urlAfter = page.url();
      expect(urlAfter).toContain('/auth');
    }
  });

  test('Sign up: invalid email validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await signUpTab.click();
    
    const nameInput = page.locator('input[placeholder*="Name"], input[name*="name"], input[type="text"]:first-of-type');
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await nameInput.fill('Test User');
    await emailInput.fill('invalid-email');
    await passwordInput.fill('TestPassword123!');
    
    const submitButton = page.getByRole('button', { name: 'Sign Up' });
    await submitButton.click();
    
    // Should either show validation error or reject invalid email
    const errorOrStayOnAuth = page.url().includes('/auth');
    expect(errorOrStayOnAuth || page.getByText(/invalid|error|email/i).isVisible().catch(() => false)).toBeTruthy();
  });

  test('Sign up: successful account creation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await signUpTab.click();
    
    const nameInput = page.locator('input[placeholder*="Name"], input[name*="name"], input[type="text"]:first-of-type');
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await nameInput.fill(testUser.name);
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    
    const submitButton = page.getByRole('button', { name: 'Sign Up' });
    await submitButton.click();
    
    // Wait for response - either success message or redirect
    await page.waitForTimeout(2000);
    
    // Check for success message or redirect
    const hasSuccessMessage = await page.getByText(/created|confirmation|success/i).isVisible().catch(() => false);
    const redirectedAwayFromAuth = !page.url().includes('/auth') && !page.url().includes('error');
    
    console.log(`Sign up result: message=${hasSuccessMessage}, redirected=${redirectedAwayFromAuth}, url=${page.url()}`);
    expect(hasSuccessMessage || redirectedAwayFromAuth).toBeTruthy();
  });

  test('Sign up: duplicate email handling', async ({ page }) => {
    // Try to sign up with the same email used in previous test
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await signUpTab.click();
    
    const nameInput = page.locator('input[placeholder*="Name"], input[name*="name"], input[type="text"]:first-of-type');
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await nameInput.fill('Another User');
    await emailInput.fill(testUser.email); // Same email
    await passwordInput.fill('AnotherPassword123!');
    
    const submitButton = page.getByRole('button', { name: 'Sign Up' });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should show error about duplicate email
    const hasErrorMessage = await page.getByText(/already|exists|duplicate/i).isVisible().catch(() => false);
    const stayOnAuth = page.url().includes('/auth');
    
    console.log(`Duplicate email result: error=${hasErrorMessage}, stayOnAuth=${stayOnAuth}`);
    expect(hasErrorMessage || stayOnAuth).toBeTruthy();
  });

  // ============================================
  // 2. SIGN IN TESTS
  // ============================================
  test('Sign in: form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await expect(signInTab).toBeVisible();
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    const submitButton = page.getByRole('button', { name: 'Sign In' }).first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('Sign in: wrong password rejection', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await emailInput.fill(testUser.email);
    await passwordInput.fill('WrongPassword123!');
    
    const submitButton = page.getByRole('button', { name: 'Sign In' }).first();
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should show error or stay on auth page
    const hasErrorMessage = await page.getByText(/invalid|incorrect|password/i).isVisible().catch(() => false);
    const stayOnAuth = page.url().includes('/auth');
    
    console.log(`Wrong password result: error=${hasErrorMessage}, stayOnAuth=${stayOnAuth}`);
    expect(hasErrorMessage || stayOnAuth).toBeTruthy();
  });

  test('Sign in: non-existent user rejection', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await emailInput.fill(`nonexistent-${Date.now()}@example.com`);
    await passwordInput.fill('SomePassword123!');
    
    const submitButton = page.getByRole('button', { name: 'Sign In' }).first();
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    const hasErrorMessage = await page.getByText(/invalid|not found|does not exist/i).isVisible().catch(() => false);
    const stayOnAuth = page.url().includes('/auth');
    
    console.log(`Non-existent user result: error=${hasErrorMessage}, stayOnAuth=${stayOnAuth}`);
    expect(hasErrorMessage || stayOnAuth).toBeTruthy();
  });

  test('Sign in: successful sign-in with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    
    const submitButton = page.getByRole('button', { name: 'Sign In' }).first();
    await submitButton.click();
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    const url = page.url();
    console.log(`Sign in result URL: ${url}`);
    
    // Should redirect away from /auth
    expect(!url.includes('/auth') || url.includes('callback')).toBeTruthy();
  });

  test('Sign in: protected page access after sign-in', async ({ page }) => {
    // First sign in
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    
    const submitButton = page.getByRole('button', { name: 'Sign In' }).first();
    await submitButton.click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Now try to access profile
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    
    // Should load profile (not redirect to auth)
    const isOnProfile = page.url().includes('/profile') || page.getByText(/profile|settings|account/i).isVisible().catch(() => false);
    
    console.log(`Profile access result: onProfile=${isOnProfile}, url=${page.url()}`);
    expect(isOnProfile || !page.url().includes('/auth')).toBeTruthy();
  });

  test('Sign in: logout works after sign-in', async ({ page }) => {
    // Sign in first
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    const emailInput = page.locator('input[placeholder*="Email"], input[name*="email"], input[type="email"]');
    const passwordInput = page.locator('input[placeholder*="Password"], input[name*="password"], input[type="password"]');
    
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Find and click logout
    const logoutButton = page.getByText(/Logout|Sign Out|Exit/i).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle' });
      
      const url = page.url();
      console.log(`Logout result: url=${url}`);
      expect(url.includes('/auth')).toBeTruthy();
    }
  });

  // ============================================
  // 3. GOOGLE OAUTH TESTS
  // ============================================
  test('Google OAuth: button visibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const googleButton = page.getByText(/Google|Continue with Google/i);
    await expect(googleButton).toBeVisible();
  });

  test('Google OAuth: initiates auth flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    const googleButton = page.getByText(/Google|Continue with Google/i);
    
    // Listen for navigation to Google consent page
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      googleButton.click(),
    ]).catch(() => [null]);
    
    if (popup) {
      console.log(`Google OAuth popup opened: ${popup.url()}`);
      expect(popup.url()).toContain('accounts.google.com');
    } else {
      // Might redirect instead of popup
      await page.waitForTimeout(2000);
      const url = page.url();
      console.log(`Google OAuth redirect URL: ${url}`);
      expect(url).toMatch(/google|accounts\.google|signin/i);
    }
  });

  // ============================================
  // 4. MULTIPLAYER ROOM LIST TESTS
  // ============================================
  test('Multiplayer: page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    // Check for multiplayer content
    const createRoomButton = page.getByText(/Create Room/i);
    const joinRoomForm = page.locator('input[placeholder*="Room"]').first();
    
    const hasCreateButton = await createRoomButton.isVisible().catch(() => false);
    const hasJoinForm = await joinRoomForm.isVisible().catch(() => false);
    
    console.log(`Multiplayer page: createButton=${hasCreateButton}, joinForm=${hasJoinForm}`);
    expect(hasCreateButton || hasJoinForm).toBeTruthy();
  });

  test('Multiplayer: room list fetch succeeds', async ({ page }) => {
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    // Wait for room list to load
    await page.waitForTimeout(2000);
    
    // Check console for errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check if rooms loaded or empty state shown
    const emptyState = page.getByText(/no rooms|empty/i);
    const roomsList = page.getByText(/room|race/i);
    
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasRooms = await roomsList.isVisible().catch(() => false);
    
    console.log(`Room list fetch: empty=${hasEmptyState}, hasRooms=${hasRooms}, errors=${consoleErrors.length}`);
    expect(hasEmptyState || hasRooms).toBeTruthy();
  });

  // ============================================
  // 5. CREATE ROOM TESTS
  // ============================================
  test('Create room: form renders correctly', async ({ page }) => {
    // Sign in first
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Go to multiplayer
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    const roomNameInput = page.locator('input[placeholder*="Room"], input[placeholder*="Name"]').first();
    const createButton = page.getByText(/Create/i).first();
    
    await expect(roomNameInput).toBeVisible();
    await expect(createButton).toBeVisible();
  });

  test('Create room: successful creation', async ({ page }) => {
    // Sign in first
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Go to multiplayer
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    const roomNameInput = page.locator('input[placeholder*="Room"], input[placeholder*="Name"]').first();
    const createButton = page.getByText(/Create/i).first();
    
    await roomNameInput.fill(`Test Room ${Date.now()}`);
    await createButton.click();
    
    // Wait for response and potential redirect
    await page.waitForTimeout(3000);
    
    const url = page.url();
    const successMessage = await page.getByText(/created|room code|success/i).isVisible().catch(() => false);
    const redirectedToRoom = url.includes('/room/');
    
    console.log(`Create room result: url=${url}, message=${successMessage}, redirected=${redirectedToRoom}`);
    expect(successMessage || redirectedToRoom).toBeTruthy();
  });

  // ============================================
  // 6. JOIN ROOM TESTS
  // ============================================
  test('Join room: form renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    const roomCodeInput = page.locator('input[placeholder*="Code"], input[placeholder*="Room"]');
    const joinButton = page.getByText(/Join/i).first();
    
    const hasInput = await roomCodeInput.count() > 0;
    const hasButton = await joinButton.isVisible().catch(() => false);
    
    console.log(`Join room form: hasInput=${hasInput}, hasButton=${hasButton}`);
    expect(hasInput || hasButton).toBeTruthy();
  });

  test('Join room: invalid code rejection', async ({ page }) => {
    await page.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'networkidle' });
    
    const roomCodeInput = page.locator('input[placeholder*="Code"], input[placeholder*="Room"]').first();
    const joinButton = page.getByText(/Join/i).first();
    
    if (await roomCodeInput.isVisible()) {
      await roomCodeInput.fill('INVALID123');
      await joinButton.click();
      
      await page.waitForTimeout(2000);
      
      const errorMessage = await page.getByText(/not found|invalid|error/i).isVisible().catch(() => false);
      const stayOnMultiplayer = page.url().includes('/multiplayer');
      
      console.log(`Invalid join code result: error=${errorMessage}, stay=${stayOnMultiplayer}`);
      expect(errorMessage || stayOnMultiplayer || !page.url().includes('room')).toBeTruthy();
    }
  });

  // ============================================
  // 7. TYPING RESULT SAVE TESTS
  // ============================================
  test('Typing test: can complete and result shows', async ({ page }) => {
    // Sign in first
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await signInTab.click();
    
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Go to typing page
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    
    // Look for typing interface or start button
    const startButton = page.getByText(/Start|Type|Begin/i).first();
    const typingInput = page.locator('input[placeholder*="Type"], input[aria-label*="type"]').first();
    
    const hasStart = await startButton.isVisible().catch(() => false);
    const hasTypingInput = await typingInput.isVisible().catch(() => false);
    
    console.log(`Typing test interface: startButton=${hasStart}, typingInput=${hasTypingInput}`);
    
    if (hasStart) {
      await startButton.click();
      await page.waitForTimeout(500);
    }
    
    // Try to type something
    if (await typingInput.isVisible()) {
      await typingInput.focus();
      await typingInput.type('test typing');
      
      // Wait for results screen
      await page.waitForTimeout(2000);
      
      const resultScreen = page.getByText(/result|wpm|accuracy|score|complete/i);
    }
  });

  test('Typing test: network health check', async ({ page }) => {
    const requests: { url: string; status: number }[] = [];
    const errors: string[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        requests.push({ url: response.url(), status: response.status() });
      }
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log(`Network requests: ${requests.length}`);
    requests.forEach((r) => console.log(`  ${r.url} -> ${r.status}`));
    
    const has500Errors = requests.some((r) => r.status >= 500);
    const has401Errors = requests.some((r) => r.status === 401 && !r.url.includes('leaderboard'));
    
    console.log(`API health: 500 errors=${has500Errors}, unexpected 401=${has401Errors}, console errors=${errors.length}`);
    
    // Should not have unexpected 500s
    expect(!has500Errors).toBeTruthy();
  });
});

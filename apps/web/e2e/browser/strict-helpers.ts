import { Page, expect } from '@playwright/test';

/**
 * Represents a collected console error message
 */
export interface ConsoleError {
  type: string;
  text: string;
  timestamp: number;
}

/**
 * Represents a failed network response
 */
export interface FailedResponse {
  url: string;
  status: number;
  method: string;
  contentType?: string;
  body?: string;
}

/**
 * Collects console errors during page interaction.
 * Tracks errors, warnings, and logs containing critical failure indicators.
 */
export async function collectConsoleErrors(page: Page): Promise<ConsoleError[]> {
  const errors: ConsoleError[] = [];
  const criticalKeywords = [
    '500',
    '401',
    '405',
    'Configuration',
    'CredentialsSignin',
    'Failed',
    'Prisma',
    'Unexpected token',
    'public.User does not exist',
    'Failed to fetch rooms',
    'Failed to save test result',
  ];

  // Listen to console events
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Capture all errors and warnings
    if (type === 'error' || type === 'warning') {
      errors.push({
        type,
        text,
        timestamp: Date.now(),
      });
    }

    // Capture logs/errors containing critical keywords
    if (criticalKeywords.some((keyword) => text.includes(keyword))) {
      errors.push({
        type,
        text,
        timestamp: Date.now(),
      });
    }
  });

  return errors;
}

/**
 * Collects failed network responses during page interaction.
 * Monitors API calls and captures 4xx/5xx responses and invalid JSON.
 */
export async function collectFailedResponses(page: Page): Promise<FailedResponse[]> {
  const responses: FailedResponse[] = [];

  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    const method = response.request().method();

    // Capture any 4xx or 5xx responses
    if (status >= 400) {
      let body = '';
      try {
        body = await response.text();
      } catch {
        body = '[unable to read response body]';
      }

      responses.push({
        url,
        status,
        method,
        contentType: response.headers()['content-type'],
        body: body.substring(0, 500), // Limit body size
      });
    }
  });

  return responses;
}

/**
 * Asserts that no critical errors occurred during the test.
 * Fails if any unexpected errors or failed responses are detected.
 */
export async function assertNoCriticalErrors(
  errors: ConsoleError[],
  responses: FailedResponse[],
  context?: {
    allowedStatuses?: number[];
    allowedErrorPatterns?: string[];
  }
) {
  const allowedStatuses = context?.allowedStatuses || [];
  const allowedPatterns = context?.allowedErrorPatterns || [];

  // Check for critical response failures
  const criticalResponses = responses.filter((r) => {
    if (allowedStatuses.includes(r.status)) return false;

    // Always critical
    if ([500, 405].includes(r.status)) return true;
    if (r.url.includes('/api/auth/error')) return true;
    if (r.url.includes('/api/room')) return true;
    if (r.url.includes('/api/leaderboard')) return true;
    if (r.url.includes('/type') && r.method === 'POST') return true;

    // Check for 401 on protected endpoints
    if (r.status === 401 && !r.url.includes('public')) return true;

    return false;
  });

  if (criticalResponses.length > 0) {
    const errorSummary = criticalResponses
      .map((r) => `${r.method} ${r.url} -> ${r.status}`)
      .join('\n');
    throw new Error(`Critical network failures detected:\n${errorSummary}`);
  }

  // Check for critical console errors
  const criticalErrors = errors.filter((e) => {
    if (allowedPatterns.some((pattern) => e.text.includes(pattern))) return false;

    const text = e.text.toLowerCase();
    return (
      text.includes('configuration') ||
      text.includes('credentialssignin') ||
      text.includes('public.user does not exist') ||
      text.includes('failed to fetch rooms') ||
      text.includes('failed to save test result') ||
      text.includes('unexpected token') ||
      (text.includes('500') && !text.includes('status: 200'))
    );
  });

  if (criticalErrors.length > 0) {
    const errorSummary = criticalErrors.map((e) => `[${e.type}] ${e.text}`).join('\n');
    throw new Error(`Critical console errors detected:\n${errorSummary}`);
  }
}

/**
 * Generates a unique test user with timestamp-based uniqueness.
 */
export function generateUniqueUser(suffix?: string) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}-${randomId}`;
  const finalSuffix = suffix ? `-${suffix}` : '';

  return {
    name: `E2E User ${uniqueId}${finalSuffix}`,
    email: `e2e-${uniqueId}${finalSuffix}@test.typefast`,
    password: 'TestPassword123!',
  };
}

/**
 * Dismisses browser password manager popup if present.
 * This prevents password manager UI from interfering with tests.
 */
export async function dismissPasswordManagerPopupIfPresent(page: Page) {
  try {
    // Try to close Chrome password manager popup by clicking elsewhere
    await page.click('body', { timeout: 1000 }).catch(() => null);

    // Wait a bit for UI to settle
    await page.waitForTimeout(500);

    // Try to dismiss by pressing Escape
    await page.keyboard.press('Escape').catch(() => null);
  } catch {
    // Popup not present, continue
  }
}

/**
 * Wait for a successful network response to a specific URL pattern.
 * Useful for confirming API calls complete successfully.
 */
export async function waitForSuccessfulResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const matches =
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());
      return matches && response.status() < 400;
    },
    { timeout }
  );
}

/**
 * Wait for authentication to complete and page to load after auth action.
 * Handles redirect to authenticated state.
 */
export async function waitForAuthCompletion(page: Page, timeout = 30000) {
  // Wait for either navigation or network to settle
  await Promise.race([
    page.waitForURL(/^\w+:\/\/[^/]*\/(type|profile|leaderboard|multiplayer)?(?:\?|$)/, {
      timeout,
    }),
    page.waitForLoadState('networkidle', { timeout }),
  ]).catch(() => {
    // Either condition is acceptable
  });
}

/**
 * Verify that the page is NOT showing an auth error.
 */
export async function assertNotAuthError(page: Page) {
  const url = page.url();
  expect(url).not.toContain('/api/auth/error');
  expect(url).not.toContain('error=Configuration');
  expect(url).not.toContain('error=CredentialsSignin');

  // Check for visible error messages
  const errorAlerts = await page.locator('[role="alert"]').all();
  for (const alert of errorAlerts) {
    const text = await alert.textContent();
    expect(text).not.toContain('Configuration');
    expect(text).not.toContain('CredentialsSignin');
    expect(text).not.toContain('public.User');
  }
}

/**
 * Verify that user is in authenticated state (session exists).
 * Checks for typical auth indicators.
 */
export async function assertAuthenticatedState(page: Page) {
  // Attempt to access a protected route
  await page.goto('/profile');
  const url = page.url();

  // Should be on profile or similar protected page, not redirected to auth
  expect(!url.includes('/auth')).toBeTruthy();

  // Session should be in page context (check localStorage or cookie)
  const sessionInfo = await page.evaluate(() => {
    // Check if there's any session-related data
    return (
      localStorage.getItem('next-auth.session-token') ||
      document.cookie.includes('next-auth.session-token') ||
      !!document.body.innerHTML.match(/profile|user|account/i)
    );
  });

  expect(sessionInfo).toBeTruthy();
}

/**
 * Get the base URL for testing.
 * Uses PLAYWRIGHT_BASE_URL environment variable.
 * Should always be a real deployed URL, never localhost.
 */
export function getBaseUrl(): string {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'PLAYWRIGHT_BASE_URL must be set to a real deployed URL (not localhost). ' +
        'Example: PLAYWRIGHT_BASE_URL=https://typefast-web-yogd.onrender.com'
    );
  }
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('0.0.0.0')) {
    throw new Error(
      'Tests must run against real deployed URLs only. ' +
        `Received: ${baseUrl}`
    );
  }
  return baseUrl;
}

# TypeFast Strict E2E Test Suite

**IMPORTANT:** These tests are designed to run **ONLY against real deployed URLs**. They will fail fast if you try to run them against `localhost` or `127.0.0.1`.

## Overview

This suite replaces shallow smoke tests with **strict, real-world E2E tests** that would have caught all the bugs shown in your screenshots:

- ✅ Google OAuth callback errors (`Configuration`)
- ✅ Signup failures (`public.User does not exist`)
- ✅ Signin session creation failures
- ✅ Multiplayer API failures (`500`, `405`, invalid JSON)
- ✅ Typing result save failures (`401`, `500`)

## What These Tests Test

### 1. `strict-google-oauth.spec.ts` (4 tests)
- **4.1** - Google button is clickable and navigates away from auth page
- **4.2** - Full OAuth callback succeeds (CRITICAL - catches Configuration errors)
- **4.3** - OAuth session persists across page reloads
- **4.4** - OAuth failures show clear, visible error details

### 2. `strict-auth-lifecycle.spec.ts` (8 tests)
- **5.1** - Signup form renders with all required fields
- **5.2** - Signup validation rejects invalid input
- **5.3** - Signup creates real user (CRITICAL - catches `public.User does not exist`)
- **5.4** - Duplicate signup rejected gracefully
- **5.5** - Signin works with newly created credentials (CRITICAL)
- **5.6** - Wrong password rejected properly
- **5.7** - Non-existent user rejected properly
- **5.8** - Logout clears session completely

### 3. `strict-multiplayer.spec.ts` (8 tests)
- **6.1** - Room list API succeeds with valid JSON (catches `500`, `405`)
- **6.2** - Empty room list shows correct empty state
- **6.3** - Create room succeeds with valid response
- **6.4** - Join room works with two users
- **6.5** - Join invalid room shows clear error
- **6.6** - Room page lifecycle completes successfully
- **6.7** - WebSocket connection works
- **6.8** - Real-time multi-user state updates

### 4. `strict-typing-save.spec.ts` (5 tests)
- **7.1** - Anonymous typing completion behaves gracefully
- **7.2** - Authenticated typing result save succeeds (CRITICAL)
- **7.3** - Result persistence visible in profile
- **7.4** - Leaderboard update visibility
- **7.5** - Save path error handling is graceful

## Running the Tests

### Prerequisites

1. Node.js 18+ and yarn/npm
2. A **real deployed TypeFast instance** (not localhost)
3. Playwright installed: `npm install` or `yarn install`

### Basic Usage

```bash
# Run against production
PLAYWRIGHT_BASE_URL=https://typefast-web-yogd.onrender.com \
npx playwright test apps/web/e2e/browser/strict-*.spec.ts --headed --project=chromium --reporter=html

# Or use the provided script
./run-strict-tests.sh https://typefast-web-yogd.onrender.com
```

### View Results

After tests complete, open the HTML report:

```bash
npx playwright show-report
```

This will display:
- ✅ Passed tests (all features work end-to-end)
- ❌ Failed tests (bugs found with exact stack traces)
- Screenshots & video of each failure (--headed mode)

## How These Tests Are Different

### What They DON'T Do
- ❌ Use `localhost` or `127.0.0.1`
- ❌ Insert users directly into the database
- ❌ Skip real OAuth flow
- ❌ Pass on "button is visible"
- ❌ Pass on "URL changed"
- ❌ Use weak assertions

### What They DO Do
- ✅ Run against deployed, real-world URLs
- ✅ Create actual users through signup UI
- ✅ Complete real OAuth flow (even with headless browser tricks)
- ✅ Assert network responses are successful (no 500/405/401)
- ✅ Assert console has no critical errors
- ✅ Assert final success state (session exists, page loaded, etc.)
- ✅ Track failed network requests and report them clearly
- ✅ Create unique test users each run (timestamp-based)

## Test Quality Standards

Every test in this suite follows **Core Testing Rules**:

### 1.1 No Fake Success
A test only passes if **feature completes successfully**, not just because:
- A page loaded
- A button is visible
- Content length > 0
- URL changed
- Redirect was attempted

### 1.2 Real User Flows
For feature tests (signup, OAuth, multiplayer), tests **never** use DB bypass helpers. They create real users through the UI.

### 1.3 Complete Assertions
Every critical flow asserts:
- ✅ UI outcome
- ✅ Network outcome (no 500/405/401)
- ✅ No unexpected console errors
- ✅ No auth error pages
- ✅ Final success state

### 1.4 Fail on These Issues
Tests explicitly fail if they encounter:
- `/api/auth/error`
- `CredentialsSignin`
- `Configuration`
- `500` (unless expected)
- `401` (where success is expected)
- `405`
- `Unexpected token ... is not valid JSON`
- `Failed to fetch rooms`
- `Failed to save test result`
- `public.User does not exist`
- Prisma table errors

## Shared Helper Functions

File: `strict-helpers.ts`

**Error Collection:**
- `collectConsoleErrors(page)` - Capture console errors during test
- `collectFailedResponses(page)` - Capture failed network responses

**Assertions:**
- `assertNoCriticalErrors(errors, responses)` - Fail if critical errors detected
- `assertNotAuthError(page)` - Verify no auth error page shown
- `assertAuthenticatedState(page)` - Verify user is logged in
- `getBaseUrl()` - Get deployed URL, enforce no localhost

**Utilities:**
- `generateUniqueUser()` - Create unique test user (timestamp-based)
- `dismissPasswordManagerPopupIfPresent(page)` - Handle browser password manager
- `waitForSuccessfulResponse(page, pattern)` - Wait for successful API response
- `waitForAuthCompletion(page)` - Wait for auth redirect to complete

## Environment Configuration

### Required Variables

```bash
PLAYWRIGHT_BASE_URL=https://your-deployed-typefast-instance.com
```

### Optional Variables

```bash
# Browser timeout (default 30000ms)
PLAYWRIGHT_TIMEOUT=60000

# Number of workers (default 1 for strict tests)
PLAYWRIGHT_WORKERS=1

# Specific project
PLAYWRIGHT_PROJECT=chromium  # or firefox
```

## Understanding Test Failures

When a strict test fails, the output clearly shows:

```
Test: 5.3 - Successful signup creates real user
Status: FAILED

Reason: Critical network failures detected:
POST https://typefast-web-yogd.onrender.com/api/auth/register -> 500

Trace:
- User entered: test-user@example.com
- Form submitted successfully
- Server returned 500 error
- Toast message: "Database error: table 'User' does not exist"
```

This gives you:
1. **What failed** - Exact test assertion
2. **Why it failed** - Network status, console errors
3. **How to reproduce** - Test steps, user data
4. **Where to look** - Server logs, specific API endpoint

## Common Issues & Solutions

### Error: "PLAYWRIGHT_BASE_URL must be set..."
**Solution:** Set the environment variable before running:
```bash
export PLAYWRIGHT_BASE_URL=https://your-deployed-url.com
npx playwright test apps/web/e2e/browser/strict-*.spec.ts --headed
```

### Error: "Tests must run against real deployed URLs only..."
**Solution:** Don't use localhost. Your URL must be an actual deployed instance:
```bash
# ❌ Wrong
PLAYWRIGHT_BASE_URL=http://localhost:3000

# ✅ Correct
PLAYWRIGHT_BASE_URL=https://typefast-web-yogd.onrender.com
```

### Test: "OAuth callback succeeds" - FAILS with Configuration error
**This is the test working correctly!** It's catching a real bug:
- Google OAuth is not properly configured
- Check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` on deployed instance
- Check NextAuth configuration in environment variables

### Test: "Signup creates real user" - FAILS with 500
**This is the test working correctly!** It's catching a real bug:
- Database migration may have failed
- Check server logs for schema issues
- Verify `public.User` table exists
- Check database connection string

### Test: "Multiplayer room list" - FAILS with 405 Method Not Allowed
**This is the test working correctly!** It's catching a real bug:
- API route is misconfigured
- Check `/api/room` GET handler
- Verify route is accepting GET requests

## Phase-Based Execution Strategy

### Phase 1: Run Strict Suite First
```bash
./run-strict-tests.sh https://your-deployed-url.com
```
This identifies all critical bugs before any other testing.

### Phase 2: Fix Identified Issues
Review test failures and fix bugs in priority order:
1. Auth flow failures (blocks everything)
2. Multiplayer failures (blocks feature)
3. Typing save failures (affects user experience)

### Phase 3: Verify Fixes
Re-run strict tests to confirm fixes:
```bash
./run-strict-tests.sh https://your-deployed-url.com
```

### Phase 4: Expand Testing
Once all strict tests pass, run broader test suites if available.

## Expected Results

### Full Success
```
====================================================
TypeFast Strict E2E Test Suite
====================================================
Testing against: https://typefast-web-yogd.onrender.com

✓ 4.1 - Google button visible and clickable
✓ 4.2 - Full OAuth callback success
✓ 4.3 - OAuth session persistence
✓ 4.4 - OAuth failure handling captures real error details
✓ 5.1 - Signup form renders with all required fields
✓ 5.2 - Signup validation rejects invalid input
✓ 5.3 - Successful signup creates real user
✓ 5.4 - Duplicate signup rejection
✓ 5.5 - Signin with newly created credentials works
✓ 5.6 - Wrong password rejection
✓ 5.7 - Non-existent user rejection
✓ 5.8 - Logout clears session completely
✓ 6.1 - Room list API succeeds with valid JSON
✓ 6.2 - Empty room list shows correct empty state
✓ 6.3 - Create room succeeds with valid response
✓ 6.4 - Join room success with two users
✓ 6.5 - Join invalid room shows clear error
✓ 6.6 - Room page lifecycle completes successfully
✓ 6.7 - WebSocket connection works
✓ 6.8 - Real-time multi-user state updates
✓ 7.1 - Anonymous typing completion behaves gracefully
✓ 7.2 - Authenticated typing result save succeeds
✓ 7.3 - Result persistence visible in profile
✓ 7.4 - Leaderboard update visibility
✓ 7.5 - Save path error handling is graceful

25 passed ✓
====================================================
```

## Troubleshooting

### Tests hang on Google OAuth
The browser may get stuck on Google's login page. Check:
1. Is `GOOGLE_CLIENT_ID` correctly configured?
2. Is redirect URI correctly set in Google Cloud Console?
3. Try with `--debug` flag to see browser state

### Tests timeout waiting for network response
Check network connectivity:
```bash
curl -v https://your-deployed-url.com/api/health
```

### Database errors in test output
Example: `public.User does not exist`

This means:
1. Migrations haven't run on deployed instance
2. Database connection is wrong
3. Schema is out of sync

Fix:
```bash
# Run migrations on deployed database
yarn db:migrate
```

### WebSocket tests fail
Check:
1. WebSocket endpoint is deployed and accessible
2. Firewall/proxy allows WebSocket connections
3. Check server logs for WebSocket errors

## Next Steps

1. **Copy these test files** to your repository
2. **Update `playwright.config.ts`** if needed (verify baseURL handling)
3. **Run against staging first** to catch issues before production
4. **Fix identified bugs** following test failure messages
5. **Add to CI/CD pipeline** to catch regressions

## Support

For issues or questions:
1. Check test failure details in HTML report
2. Review test code comments for context
3. Look at captured screenshots/video in report
4. Check server logs for errors

---

**Remember:** These tests are designed to fail loudly and clearly when real bugs exist. A passing test suite means your deployed instance is working correctly.

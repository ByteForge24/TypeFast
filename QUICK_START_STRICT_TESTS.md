# ⚡ Quick Start - Strict E2E Tests

## What You Just Got

✅ **25 production-grade E2E tests** that catch real bugs  
✅ **4 focused test suites** (OAuth, Auth Lifecycle, Multiplayer, Typing Save)  
✅ **Shared error tracking** (network, console, auth errors)  
✅ **Deployment-only enforcement** (no localhost testing)  
✅ **Real user flows** (signup, OAuth, multiplayer joins)  
✅ **Complete documentation** (README, implementation guide, this quickstart)

## Files Created

```
apps/web/e2e/browser/
  ├── strict-helpers.ts              ← Shared utilities & error tracking
  ├── strict-google-oauth.spec.ts    ← 4 tests: OAuth flow
  ├── strict-auth-lifecycle.spec.ts  ← 8 tests: Signup/signin/logout
  ├── strict-multiplayer.spec.ts     ← 8 tests: Room creation/joining
  └── strict-typing-save.spec.ts     ← 5 tests: Result save & persistence

run-strict-tests.sh                   ← Easy test runner script

STRICT_E2E_TESTS_README.md            ← Full documentation
STRICT_TESTS_IMPLEMENTATION.md        ← Technical details
```

## 🚀 Run Tests in 30 Seconds

```bash
# 1. Make script executable
chmod +x run-strict-tests.sh

# 2. Run against your deployed instance
./run-strict-tests.sh https://typefast-web-yogd.onrender.com

# 3. View results
npx playwright show-report
```

## What Tests Check

| Issue | Test | Catches |
|-------|------|---------|
| **Google OAuth fails** | Test 4.2 | `/api/auth/error?error=Configuration` |
| **Signup DB error** | Test 5.3 | `public.User does not exist` |
| **Signin broken** | Test 5.5 | `CredentialsSignin` or no session |
| **Multiplayer API error** | Test 6.1 | 500, 405, invalid JSON |
| **Result won't save** | Test 7.2 | 401, 500, save failures |

## Key Features

✅ **Real URLs only** - `getBaseUrl()` blocks localhost  
✅ **Real users** - Creates via signup UI (not DB bypass)  
✅ **Real flows** - OAuth callback, room joins, typing tests  
✅ **Real monitoring** - Captures network + console errors  
✅ **Real success** - Asserts UI state, session, persistence  

## Expected Output

```
✓ 4.1 - Google button visible and clickable
✓ 4.2 - Full OAuth callback success
✓ 4.3 - OAuth session persistence
✓ 4.4 - OAuth failure handling
✓ 5.1 - Signup form renders
✓ 5.2 - Signup validation rejects invalid input
✓ 5.3 - Successful signup creates real user
✓ 5.4 - Duplicate signup rejection
✓ 5.5 - Signin with newly created credentials
✓ 5.6 - Wrong password rejection
✓ 5.7 - Non-existent user rejection
✓ 5.8 - Logout clears session
✓ 6.1 - Room list API succeeds
✓ 6.2 - Empty room list shows correct state
✓ 6.3 - Create room succeeds
✓ 6.4 - Join room with two users
✓ 6.5 - Join invalid room shows clear error
✓ 6.6 - Room page lifecycle completes
✓ 6.7 - WebSocket connection works
✓ 6.8 - Real-time multi-user updates
✓ 7.1 - Anonymous typing completes gracefully
✓ 7.2 - Authenticated typing result saves
✓ 7.3 - Result persistence visible in profile
✓ 7.4 - Leaderboard update visibility
✓ 7.5 - Save error handling is graceful

25 passed ✓
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "PLAYWRIGHT_BASE_URL must be set" | `export PLAYWRIGHT_BASE_URL=https://your-url.com` |
| "Tests must run against real deployed URLs" | Don't use localhost - use actual deployed URL |
| OAuth test hangs | Normal - it needs manual account selection in headed mode |
| Tests timeout | Your deployed instance is slow - increase timeout |
| Database errors appear | Your deployment is missing migrations - run them |

## Understanding Failures

When a test fails:

1. **Check HTML Report** → `playwright-report/index.html`
2. **See Screenshot** → Visual state of page
3. **See Error Message** → Exact failure reason
4. **See Network Calls** → Failed API endpoints
5. **See Console** → Browser errors

Example failure:
```
Test: 5.3 - Successful signup creates real user
Status: FAILED

Reason: Critical network failures detected:
POST https://typefast-web-yogd.onrender.com/api/auth/register -> 500

Details:
- User: test-user-1111-abcdef@test.typefast
- Response: "Error: table 'public.User' does not exist"
```

This tells you:
- Signup endpoint is returning 500
- Database table is missing
- Need to run migrations on deployed instance

## Environment Variables

```bash
# Required
PLAYWRIGHT_BASE_URL=https://your-deployed-typefast.com

# Optional
PLAYWRIGHT_TIMEOUT=60000        # Timeout in ms
PLAYWRIGHT_WORKERS=1            # Number of parallel workers
PLAYWRIGHT_PROJECT=chromium     # Browser type
```

## For CI/CD

Add to your GitHub Actions:

```yaml
- name: Run Strict E2E Tests
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.DEPLOYED_URL }}
  run: |
    npx playwright test \
      apps/web/e2e/browser/strict-*.spec.ts \
      --headed \
      --project=chromium \
      --reporter=html
```

## Common Tasks

### Run only Google OAuth tests
```bash
export PLAYWRIGHT_BASE_URL=https://your-url.com
npx playwright test apps/web/e2e/browser/strict-google-oauth.spec.ts --headed
```

### Run only auth lifecycle tests
```bash
export PLAYWRIGHT_BASE_URL=https://your-url.com
npx playwright test apps/web/e2e/browser/strict-auth-lifecycle.spec.ts --headed
```

### Run specific test
```bash
export PLAYWRIGHT_BASE_URL=https://your-url.com
npx playwright test -g "5.3"  # Runs test 5.3 only
```

### Debug a failing test
```bash
export PLAYWRIGHT_BASE_URL=https://your-url.com
npx playwright test apps/web/e2e/browser/strict-auth-lifecycle.spec.ts --headed --debug
```

### Generate HTML report without running tests
```bash
npx playwright show-report playwright-report
```

## Documentation

- **Full guide:** `STRICT_E2E_TESTS_README.md`
- **Technical details:** `STRICT_TESTS_IMPLEMENTATION.md`
- **Test code comments:** Each test has detailed comments

## Phase-Based Strategy

### Phase 1: Run Tests
```bash
./run-strict-tests.sh https://typefast-web-yogd.onrender.com
```

### Phase 2: Review Failures
- Check HTML report
- Identify failed tests
- Note error messages

### Phase 3: Fix Issues
- Address failed endpoints
- Fix database schema
- Configure missing env vars

### Phase 4: Verify Fixes
```bash
./run-strict-tests.sh https://typefast-web-yogd.onrender.com
```

### Phase 5: Success
All 25 tests pass = Production ready ✅

## What These Tests Are NOT

❌ Smoke tests (they're strict E2E)  
❌ Unit tests (they're integration)  
❌ Performance tests (they measure correctness)  
❌ Load tests (they're sequential)  
❌ Compatibility tests (they use Chromium only)  

## What These Tests ARE

✅ Real-world flow tests (actual user journeys)  
✅ Strict correctness tests (fail on any error)  
✅ Deployment tests (only on real URLs)  
✅ Bug detection tests (catch screenshot issues)  
✅ Regression tests (ensure features work)  

---

## Next Steps

1. ✅ Review the files created (you just did!)
2. 🚀 Run tests: `./run-strict-tests.sh <your-deployed-url>`
3. 📊 Check report: `npx playwright show-report`
4. 🐛 Fix any failures using error details
5. ✅ Re-run to confirm fixes
6. 📈 Add to CI/CD for ongoing validation

## Questions?

- **How do I...?** → Check `STRICT_E2E_TESTS_README.md`
- **Why did this fail?** → Check HTML report with screenshot
- **What does test X do?** → Read comments in test file
- **How to debug?** → Use `--debug` flag

---

**You have everything needed to validate your TypeFast deployment. Start with the quick start command above!** 🎉

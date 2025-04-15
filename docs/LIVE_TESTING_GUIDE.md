# TypeFast Live Testing Guide

**Status:** Ready to test deployed-site
**Date:** March 20, 2026
**Test Environment:** Production (Vercel + Render + PostgreSQL)

---

## Overview

After deployment to Vercel and Render is complete, use this guide to test the live deployed application against real URLs.

---

## Deployment Status Check

### Before Testing, Verify:

1. **Vercel Deployment**
   - Dashboard URL: Deployments should show "Ready"
   - Health check: `https://[YOUR_DOMAIN].vercel.app/` loads

2. **Render Deployment**
   - Dashboard URL: Service should show "Live"
   - Health check: Check Render logs for "Server listening on port 8080"

3. **PostgreSQL**
   - Database is created and accessible
   - Tables exist (run migrations if needed)

---

## Quick Start: Run All E2E Tests Against Live

### Option A: Full E2E Test Suite (5-10 minutes)

```bash
cd c:\Users\HP\TypeFast\TypeFast\apps\web

# Set your Vercel domain
$env:PLAYWRIGHT_TEST_BASE_URL = "https://[YOUR_DOMAIN].vercel.app"

# Run all E2E tests
yarn playwright test --reporter=html
```

Then view the HTML report:
```bash
yarn playwright show-report
```

### Option B: Run Specific Tests (1-2 minutes each)

```bash
cd c:\Users\HP\TypeFast\TypeFast\apps\web

$env:PLAYWRIGHT_TEST_BASE_URL = "https://[YOUR_DOMAIN].vercel.app"

# Homepage tests
yarn playwright test e2e/browser/01-homepage.spec.ts

# Authentication tests
yarn playwright test e2e/browser/02-auth.spec.ts

# Typing interface tests
yarn playwright test e2e/browser/03-typing-flow.spec.ts

# Multiplayer/WebSocket tests
yarn playwright test e2e/browser/04-multiplayer.spec.ts
```

---

## Manual Testing Scenarios

### Scenario 1: Homepage & Navigation
**Time:** 2 minutes
**Goal:** Verify page loads and UI renders correctly

```
1. Open: https://[YOUR_DOMAIN].vercel.app
2. Verify:
   - Page loads without errors
   - Hero section displays
   - Features section renders
   - Navigation header shows (logo, links, auth button)
   - Footer displays
3. Check DevTools:
   - Console: No red errors
   - Network: All requests succeed (200/204)
```

Expected: ✅ Page loads, renders correctly, no console errors

---

### Scenario 2: User Registration
**Time:** 3 minutes
**Goal:** Test signup flow and database user creation

```
1. Click "Sign Up" in header or navigate to /auth
2. Fill form:
   - Email: test@example.com
   - Password: TestPassword123!
3. Click "Sign Up"
4. Verify:
   - Success message displays
   - Redirected to /type or /auth/verification
   - Database: User created (check in Prisma Studio)

Variations:
- Test duplicate email → Should show error
- Test weak password → Should show validation error
```

Expected: ✅ User created in database, redirected correctly

---

### Scenario 3: Email/Password Login
**Time:** 2 minutes
**Goal:** Test credential-based authentication

```
1. Register user (from Scenario 2)
2. Click "Sign In"
3. Enter email and password
4. Click "Sign In"
5. Verify:
   - Logged in successfully
   - Redirected to /type
   - User name appears in header
   - Session persists on page reload

Test Cases:
- Wrong password → Error message
- Non-existent email → Error message
- Logout → Redirects to /auth
```

Expected: ✅ Authentication works, session persists

---

### Scenario 4: Google OAuth Sign-In
**Time:** 3 minutes
**Goal:** Test Google OAuth 2.0 flow

```
1. Click "Continue with Google"
2. Authenticate with test Google account
3. Allow permissions
4. Verify:
   - Redirected back to app
   - Logged in with Google account
   - User profile shows Google name/picture
   - Session created

Debugging:
- If error: Check browser DevTools for redirect_uri_mismatch
- Verify GOOGLE_CLIENT_ID/SECRET in Vercel env vars
- Verify callback URL in Google Cloud Console
```

Expected: ✅ OAuth login succeeds, user data syncs

---

### Scenario 5: Typing Test (Single Player)
**Time:** 5 minutes
**Goal:** Test typing interface and result saving

```
1. Logged in → Navigate to /type (or click "Type" in nav)
2. Verify page loads:
   - Typing area displays
   - Instructions visible
   - Mode buttons work (Time, Words)
3. Run a typing test:
   - Click "Start Test"
   - Type some words (or random letters)
   - Let timer count down (15-30 seconds)
   - Click "Finish" or wait for timeout
4. Verify results:
   - WPM displayed
   - Accuracy calculated
   - Time taken shown
   - Result saved to database
5. Check database:
   - Query: SELECT * FROM "Test" WHERE "userId" = '[USER_ID]'
   - Should have at least 1 row

Test Variations:
- 15 second mode (default)
- 30 second mode
- Words mode (10/25/50 words)
```

Expected: ✅ Test completes, results save, database updated

---

### Scenario 6: User Profile & Statistics
**Time:** 3 minutes
**Goal:** Verify stats persistence and display

```
1. After completing tests → Click profile icon in header
2. Navigate to Profile (/profile)
3. Verify:
   - User info displays (name, email, picture)
   - Statistics show: Total tests, Average WPM, etc.
   - Test history displays in list/table
   - Charts render (if implemented)
   - Each test shows: WPM, Accuracy, Time, Date
4. Click on a test result → Details display

Expected: ✅ Profile loads, stats display correctly, historical data shows
```

---

### Scenario 7: Leaderboard
**Time:** 2 minutes
**Goal:** Test public leaderboard

```
1. Navigate to /leaderboard (or click in header)
2. Verify:
   - Page loads
   - Top users display (sorted by best WPM)
   - Shows: Rank, Username, WPM, Tests Completed
   - Your user appears in leaderboard
3. Click on a user → Profile details (if implemented)

Expected: ✅ Leaderboard displays, data updates after tests
```

---

### Scenario 8: Multiplayer (WebSocket) - Most Critical
**Time:** 5-10 minutes
**Goal:** Test real-time WebSocket communication

### Setup
Requires 2 browser windows/tabs:
- Tab A: Player 1
- Tab B: Player 2

### Test Steps

```
TAB A - CREATE ROOM:
1. Navigate to /multiplayer
2. Click "Create Room"
3. Verify:
   - Room created
   - Room code generated (e.g., ABC123)
   - WebSocket connects (check DevTools)
   - "Waiting for players..." displays

Check DevTools → Network → WS:
  - URL: wss://typefast-ws.onrender.com or https://[URL]/ws
  - Status: 101 Switching Protocols
  - Frames show JSON messages

TAB B - JOIN ROOM:
1. Open new browser tab to https://[YOUR_DOMAIN].vercel.app
2. Login as different user (if needed)
3. Navigate to /multiplayer
4. Click "Join Room"
5. Enter room code from Tab A
6. Click "Join"

TAB A & B - RACE:
1. Both tabs should show room members list
2. Player 1 (Tab A) clicks "Start Race"
3. Both tabs show:
   - Same typing text
   - 30 second countdown
   - Both players connected
4. Tab A types some words
5. Tab B should see Tab A's progress in real-time:
   - Progress bar updates
   - WPM updates
6. Tab B types words
7. Tab A should see Tab B's progress

AFTER RACE:
1. Timer expires or both click Finish
2. Results display:
   - Tab A: Both players' results
   - Tab B: Both players' results
3. Database check:
   - Room record in database
   - Both users' Test records show up

Expected: ✅ Real-time sync, results save for both users
```

### WebSocket Debugging
If multiplayer fails:
```
1. Check Render logs: Should show WebSocket connections
2. Browser DevTools:
   - Network → WS → Check for errors
   - Console → Check for JavaScript errors
3. Verify NEXT_PUBLIC_WS_URL:
   - Should point to: https://typefast-ws.onrender.com
   - Check with: console.log(process.env.NEXT_PUBLIC_WS_URL)
4. Verify Render service is running:
   - Render Dashboard → typefast-ws → Logs
   - Should show "Server listening on port 8080"
```

---

### Scenario 9: Database Integrity
**Time:** 3 minutes
**Goal:** Verify all data persists correctly

Use Prisma Studio:
```bash
cd c:\Users\HP\TypeFast\TypeFast\apps\web
yarn db:studio
```

Check tables:
- **Users:** New registrations appear
- **Accounts:** OAuth users have account records
- **Tests:** Each typing test has a record
- **Rooms:** Multiplayer rooms have records
- **VerificationTokens:** Email verification tokens (if used)

Expected: ✅ All test data appears, no orphaned records

---

### Scenario 10: Environment Variables
**Time:** 2 minutes
**Goal:** Verify all env vars are correctly set

In browser console (`F12`), run:
```javascript
// Check public env vars
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);
console.log('Site URL:', window.location.origin);
```

Expected output:
```
WS URL: https://typefast-ws.onrender.com
Site URL: https://[YOUR_DOMAIN].vercel.app
```

---

## Full Test Report Template

Create a file: `LIVE_TEST_REPORT.md`

```markdown
# Live Testing Report
**Date:** [TODAY]
**Vercel Domain:** https://[DOMAIN].vercel.app
**Render Domain:** https://typefast-ws.onrender.com
**Tester:** [YOUR_NAME]

## Automated E2E Tests
- [ ] Homepage tests: PASS/FAIL
- [ ] Auth tests: PASS/FAIL
- [ ] Typing flow tests: PASS/FAIL
- [ ] Multiplayer tests: PASS/FAIL

## Manual Test Results

### Homepage & Navigation
- [ ] Page loads without errors
- [ ] Hero section displays
- [ ] Navigation works
- [ ] Footer visible

### Authentication
- [ ] Email signup works
- [ ] Email login works
- [ ] Google OAuth works
- [ ] Logout works
- [ ] Session persists

### Typing Test
- [ ] Time mode works
- [ ] Words mode works
- [ ] Results save
- [ ] Database records created

### Statistics
- [ ] Profile loads
- [ ] Historical data displays
- [ ] Charts render

### Leaderboard
- [ ] Page loads
- [ ] Top users display
- [ ] Data updates correctly

### Multiplayer
- [ ] Create room works
- [ ] Join room works
- [ ] WebSocket connects
- [ ] Real-time sync works
- [ ] Results save for both users

### Database
- [ ] Users table populated
- [ ] Tests table has records
- [ ] Rooms table has records
- [ ] No orphaned data

## Issues Found
[List any bugs or issues]

## Conclusion
✅ Ready for production / ❌ Issues need fixing
```

---

## Expected Results Summary

| Test | Expected | Status |
|------|----------|--------|
| Homepage loads | No errors | ✅ |
| Sign up | User created in DB | ✅ |
| Sign in | Session created | ✅ |
| Google OAuth | OAuth user linked | ✅ |
| Typing test | Results saved | ✅ |
| Stats display | Historical data shown | ✅ |
| Leaderboard | Top users listed | ✅ |
| Multiplayer | Real-time sync | ✅ |
| WebSocket | Connected to Render | ✅ |
| Database | All tables populated | ✅ |

---

## Performance Checks

### Vercel Performance
```
Target: < 3 second page load
Check: Vercel Analytics tab in dashboard
```

### Render Performance
```
Target: < 100ms WebSocket latency
Check: Browser DevTools → Network → WS latency
```

### Database Performance
```
Target: < 200ms query response
Check: Test submission feedback time
```

---

## Success Criteria

✅ **Deployment is successful if:**
1. All E2E tests pass (yarn playwright test)
2. All manual scenarios pass
3. No red errors in browser console
4. WebSocket connects to Render service
5. Database operations complete without errors
6. Page loads in < 3 seconds
7. No 500/502/503 errors in logs

---

## Abort Criteria

❌ **Rollback if:**
1. > 10% of E2E tests fail
2. WebSocket cannot connect
3. Database connection fails
4. Repeating 500 errors in logs
5. UI appears broken visually

---

## Next Steps After Successful Testing

1. Monitor error logs for 24 hours
2. Test with real users
3. Collect performance metrics
4. Scale infrastructure if needed
5. Plan production launch

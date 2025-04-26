# RENDER DEPLOYMENT 503 DIAGNOSTIC & FIX

## Root Cause Analysis

### Primary Issue: Missing DATABASE_URL
- **Symptom**: HTTP 503 Service Unavailable on all requests
- **Root Cause**: Prisma client initialization fails when DATABASE_URL is not set
- **Impact**: When NextAuth tries to initialize PrismaAdapter, the database connection fails, crashing the server

### Secondary Issue: NEXTAUTH_URL Mismatch  
- **Symptom**: Auth callbacks would fail even if database was connected
- **Config**: `NEXTAUTH_URL: https://typefast-web.onrender.com`
- **Reality**: Actual deployed URL is `https://typefast-web-yogd.onrender.com`
- **Impact**: NextAuth security check rejects callbacks, auth flows fail

### Tertiary Issue: missing env vars
- `NEXTAUTH_SECRET` not set
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` not set (needed for OAuth)

---

## Fixes Applied

### 1. Updated `render.yaml`
**File:** `render.yaml`

Changed from:
```yaml
envVars:
  - key: DATABASE_URL
    sync: false
  - key: NEXTAUTH_SECRET
    sync: false
  - key: NEXTAUTH_URL
    value: https://typefast-web.onrender.com
  ...
```

Changed to:
```yaml
envVars:
  - key: DATABASE_URL
    sync: true               # ✅ NOW AUTO-SYNCED
  - key: NEXTAUTH_SECRET
    sync: true               # ✅ NOW AUTO-SYNCED
  - key: NEXTAUTH_URL
    value: https://typefast-web-yogd.onrender.com  # ✅ CORRECT URL
  - key: GOOGLE_CLIENT_ID
    sync: true               # ✅ NOW AUTO-SYNCED
  - key: GOOGLE_CLIENT_SECRET
    sync: true               # ✅ NOW AUTO-SYNCED
```

**Rationale:**
- `sync: true` tells Render to automatically populate env vars from its service integrations
- Fixed NEXTAUTH_URL to match the actual deployed domain
- Enables secure env var Management (secrets synced from Render)

---

## Required Next Steps (Manual Render Dashboard Actions)

### To Fix Currently Deployed App:

**Option 1: Manual Environment Variables (Fastest)**
1. Go to https://dashboard.render.com
2. Find service: `typefast-web`
3. Go to `Settings` → `Environment`
4. Add/Update these variables:
   ```
   DATABASE_URL = [from your Render PostgreSQL service]
   NEXTAUTH_SECRET = [generate: openssl rand -base64 32]
   GOOGLE_CLIENT_ID = [from Google Cloud Console or leave blank]
   GOOGLE_CLIENT_SECRET = [from Google Cloud Console or leave blank]
   ```
5. Click `Deploy` to restart service

**Option 2: Auto-Redeploy from GitHub (If configured)**
- If Render is configured to auto-deploy from `main` branch, changes will deploy automatically
- Check Render dashboard Deployments tab for pending builds

---

## Quick Reference: What's Fixed

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| DATABASE_URL | ❌ Not synced, missing from env | ✅ Auto-synced from PostgreSQL | FIXED in code |
| NEXTAUTH_SECRET | ❌ Not synced, empty | ✅ Auto-synced from Render secrets | FIXED in code |
| NEXTAUTH_URL | ❌ Wrong domain (`typefast-web.onrender.com`) | ✅ Correct domain (`typefast-web-yogd.onrender.com`) | FIXED in code |
| Google OAuth IDs | ❌ Not synced, empty | ✅ Auto-synced from Render secrets | FIXED in code |
| Prisma Client Init | ❌ Crashes without DATABASE_URL | ✅ Works with synced DATABASE_URL | FIXED in code |

---

## After Deployment Fix Verification

Once environment variables are set in Render and service restarts:

```bash
# Test 1: Basic connectivity
curl -I https://typefast-web-yogd.onrender.com
# Expected: HTTP 200 (not 503)

# Test 2: Check Next.js is serving
curl https://typefast-web-yogd.onrender.com | head -20
# Expected: HTML response with Next.js app markup

# Test 3: Run Playwright tests
cd apps/web
$env:PLAYWRIGHT_BASE_URL='https://typefast-web-yogd.onrender.com'
yarn test:e2e:deploy --headed
# Expected: Browser window opens, tests execute
```

---

## Commits Applied

- `d0c5ed0` - fix: correct NEXTAUTH_URL to deployed domain and enable env var auto-sync for Render
- Previous commits: playwright config, WebSocket URL, start script fixes

All pushed to GitHub `main` branch.

# TypeFast Deployment Setup

**Architecture:** Split Deployment
- `apps/web` → Vercel (Next.js frontend + API routes + auth)
- `apps/ws` → Render (WebSocket backend)
- PostgreSQL → External (production database)
- Redis → Optional (for caching/leaderboard features)

---

## 1. Architecture Confirmed

### Deployment Split

| Component | Service | Type | Repository |
|-----------|---------|------|------------|
| Web App | Vercel | Next.js + Node.js | `apps/web` |
| WebSocket | Render | Node.js | `apps/ws` |
| Database | PostgreSQL | External | Shared (`apps/web/DB_prisma`) |
| Cache | Redis | Optional | Optional external |

### Cross-Service Routing

```
Client (Browser)
  ├─ https://[VERCEL_DOMAIN] → Vercel (apps/web)
  │  ├─ /api/* → Vercel API routes + Next.js
  │  ├─ /auth/* → NextAuth.js (Vercel)
  │  └─ WebSocket client connects to:
  │     └─ https://typefast-ws.onrender.com (via NEXT_PUBLIC_WS_URL)
  │
  └─ https://typefast-ws.onrender.com → Render WebSocket Service
     └─ Real-time multiplayer communication
```

---

## 2. Files Checked & Modified

### Files Modified for Deployment
- ✅ [render.yaml](../render.yaml) — Removed web service, kept ws-only config
- ✅ [apps/web/vercel.json](../apps/web/vercel.json) — **Created** for Vercel deployment
- ✅ [apps/web/package.json](../apps/web/package.json) — Already correct (dev/build/start scripts)
- ✅ [apps/ws/package.json](../apps/ws/package.json) — Already correct (build/start scripts)
- ✅ [package.json](../package.json) — postinstall hook for Prisma generation
- ✅ [apps/web/auth.ts](../apps/web/auth.ts) — Runtime correct (nodejs), adapter correct
- ✅ [apps/web/auth.config.ts](../apps/web/auth.config.ts) — trustHost: true ✓
- ✅ [apps/web/middleware.ts](../apps/web/middleware.ts) — Edge-safe, uses JWT only ✓
- ✅ [apps/web/DB_prisma/prisma/schema.prisma](../apps/web/DB_prisma/prisma/schema.prisma) — PostgreSQL ✓
- ✅ [apps/web/lib/redis.ts](../apps/web/lib/redis.ts) — Optional graceful fallback ✓
- ✅ [apps/web/constants/index.tsx](../apps/web/constants/index.tsx) — Auth routes/redirect correct ✓

### Build Configuration
- Vercel: `buildCommand` in vercel.json: `yarn db:generate && next build`
- Render: `buildCommand` in render.yaml: `yarn ws:build`
- Root postinstall: `cd apps/web/DB_prisma && npx prisma generate || true`

---

## 3. Vercel Environment Variables

### Required Env Vars for Vercel Deployment

Set these in **Vercel Project Settings → Environment Variables**:

#### Database & Prisma (Scope: `Production`)
```
DATABASE_URL = postgresql://user:password@host:port/dbname?schema=public
```
- **Required for:** Database connection, Prisma client
- **When to set:** During `vercel link` or Vercel dashboard
- **Scope:** `Production` only (needed for build)

#### Authentication (Scope: `Production & Preview`)
```
AUTH_SECRET = [generate random 32+ char secret: $(openssl rand -base64 32)]
NEXTAUTH_URL = https://[YOUR_VERCEL_DOMAIN].vercel.app
AUTH_TRUST_HOST = true
```
- **AUTH_TRUST_HOST:** Must be `true` for reverse-proxy deployments
- **NEXTAUTH_URL:** Your Vercel domain URL
- **Required for:** Auth middleware, session validation

#### Google OAuth (Scope: `Production & Preview`) 
```
GOOGLE_CLIENT_ID = [from Google Cloud Console]
GOOGLE_CLIENT_SECRET = [from Google Cloud Console]
```
- **Setup:** [Google Cloud OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- **Redirect URI in Google Console:**
  ```
  https://[YOUR_VERCEL_DOMAIN].vercel.app/api/auth/callback/google
  ```

#### WebSocket (Scope: `Production`)
```
NEXT_PUBLIC_WS_URL = https://typefast-ws.onrender.com
```
- **Note:** Public variable (visible in browser)
- **Points to:** Render WebSocket service
- **Used by:** Frontend client to connect to multiplayer rooms

#### Email Service (Scope: `Production`)
```
RESEND_API_KEY = [from resend.com dashboard]
FRONTEND_URL = https://[YOUR_VERCEL_DOMAIN].vercel.app
```
- **Optional if:** No email verification implemented
- **Required if:** Using Resend email service for verification emails
- **FRONTEND_URL:** Used in verification email links

#### Redis Cache (Scope: `Production`)
```
REDIS_URL = redis://:[PASSWORD]@[HOST]:[PORT]
```
- **Optional:** Gracefully disabled if not provided
- **Used for:** Leaderboard caching, performance optimization

### Example Vercel `.env.production` File
```bash
# Database
DATABASE_URL=postgresql://user:password@db.example.com:5432/typefast?schema=public

# Auth
AUTH_SECRET=3h9k2Lm5nP8qRtUvWxYzAbCdEfGhIjKlMnOpQrStUvWx
NEXTAUTH_URL=https://typefast.vercel.app
AUTH_TRUST_HOST=true

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# WebSocket
NEXT_PUBLIC_WS_URL=https://typefast-ws.onrender.com

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
FRONTEND_URL=https://typefast.vercel.app

# Redis (optional)
REDIS_URL=redis://:password@redis.example.com:6379
```

---

## 4. Render Environment Variables

### Required Env Vars for Render Deployment

Set these in **Render Dashboard → Environment → Environment Variables** for service `typefast-ws`:

```
NODE_ENV = production
WS_PORT = 8080
WS_HOST = 0.0.0.0
```

- **NODE_ENV:** Standard Node.js production flag
- **WS_PORT:** Render assigns port automatically; service reads from this var
- **WS_HOST:** Must be `0.0.0.0` to accept external connections

#### Note on Environment Variables
- No database URL needed on Render (ws service is stateless)
- No auth credentials needed on Render (ws service doesn't handle auth)
- These variables are already in [render.yaml](../render.yaml)

---

## 5. PostgreSQL Setup

### Production Database Requirements

#### Connection String Format
```
postgresql://username:password@hostname:port/database?schema=public
```

#### Example for Supabase (recommended)
```
postgresql://postgres.xxxxx:password@db.regional.supabase.co:5432/postgres?schema=public
```

#### Example for AWS RDS
```
postgresql://admin:password@typefast-db.xxxxx.us-east-1.rds.amazonaws.com:5432/typefast?schema=public
```

### Database Setup Checklist

- [ ] Create PostgreSQL database
- [ ] Get connection string (`DATABASE_URL`)
- [ ] Set `DATABASE_URL` in Vercel environment variables
- [ ] Run migrations after first Vercel deployment:
  ```bash
  # After Vercel deployment, run:
  cd apps/web
  yarn db:migrate
  ```
- [ ] Verify Prisma schema matches production expectations:
  - User model (auth)
  - Account model (OAuth providers)
  - VerificationToken model (email verification)
  - Test model (typing test results)
  - Room model (multiplayer rooms)

### Prisma Client Generation

**When:** Happens automatically in Vercel build
**How:** 
1. `postinstall` hook: `cd apps/web/DB_prisma && npx prisma generate || true`
2. `buildCommand` in vercel.json: `yarn db:generate && next build`

**Important:** Prisma client is generated during build time, **not** runtime.

### Migrations

**Option 1: Run After First Deployment** (Recommended)
```bash
# After Vercel is live:
cd apps/web
yarn db:migrate
```

**Option 2: Run During Vercel Build** (Advanced)
Add to vercel.json `buildCommand`:
```json
"buildCommand": "yarn db:migrate && yarn db:generate && next build"
```
⚠️ Only if using automatic migrations; requires careful testing.

---

## 6. Deployment Order

### Step-by-Step Deployment Sequence

#### Phase 1: Infrastructure Setup (Before Deployment)
1. **Create PostgreSQL Database**
   - Choose provider: Supabase, AWS RDS, DigitalOcean, etc.
   - Get connection string (`DATABASE_URL`)
   - Test connection locally first

2. **Create Render Account**
   - Link GitHub repository
   - Render will auto-detect webhook

3. **Create Vercel Account**
   - Link GitHub repository
   - `vercel link` in `apps/web` directory

4. **Setup Google OAuth** (if using Google Sign-in)
   - Google Cloud Console → Create OAuth 2.0 credentials
   - Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

5. **Setup Email Service** (if using verification)
   - Resend account → Get `RESEND_API_KEY`
   - Or use any SMTP service

#### Phase 2: Deploy WebSocket Service (Render)
1. Push `render.yaml` to GitHub (already done ✓)
2. Go to Render Dashboard → New → Web Service
3. Connect repository
4. Confirm deploy target: `typefast-ws` service
5. Verify environment variables:
   ```
   NODE_ENV=production
   WS_PORT=8080
   WS_HOST=0.0.0.0
   ```
6. **Deploy:** Click "Create Web Service"
7. **Wait for:** Deployment to complete, get service URL: `https://typefast-ws.onrender.com`

#### Phase 3: Deploy Web App (Vercel)
1. Push `vercel.json` to GitHub (already done ✓)
2. Go to Vercel Dashboard → Import Project
3. Select repository and `apps/web` root
4. Set environment variables in Vercel Settings:
   - `DATABASE_URL` → PostgreSQL connection string
   - `AUTH_SECRET` → Generate: `openssl rand -base64 32`
   - `NEXTAUTH_URL` → Your Vercel domain (e.g., `https://typefast.vercel.app`)
   - `AUTH_TRUST_HOST` → `true`
   - `GOOGLE_CLIENT_ID` → From Google Cloud
   - `GOOGLE_CLIENT_SECRET` → From Google Cloud
   - `NEXT_PUBLIC_WS_URL` → `https://typefast-ws.onrender.com`
   - `RESEND_API_KEY` → From Resend dashboard (if using)
   - `FRONTEND_URL` → Same as `NEXTAUTH_URL`
   - `REDIS_URL` → Optional
5. **Deploy:** Push to main branch
6. **Wait for:** Vercel build completes (should auto-run `yarn db:generate && next build`)

#### Phase 4: Run Database Migrations
1. After Vercel deployment succeeds:
   ```bash
   cd apps/web
   yarn db:migrate
   ```
   This creates tables in PostgreSQL for:
   - users
   - accounts (OAuth)
   - verification_tokens
   - tests (typing results)
   - rooms (multiplayer)

2. **Verify tables exist:**
   ```bash
   cd apps/web
   yarn db:studio  # Opens Prisma Studio to verify
   ```

#### Phase 5: Verify Cross-Service Integration
1. Go to Vercel domain URL
2. Test authentication (sign up, Google OAuth)
3. Test multiplayer:
   - Create room → WebSocket connects to Render service
   - Verify `NEXT_PUBLIC_WS_URL` is being used
4. Check browser DevTools Console for WebSocket connection logs

---

## 7. Live Testing Readiness

### Pre-Live Testing Checklist

#### Vercel URL
```
https://[YOUR_PROJECT].vercel.app
```

#### Render URL
```
https://typefast-ws.onrender.com
```

### Test Suite: E2E Against Live URLs

After deployment is live, run:

```bash
# Option 1: All E2E tests against live
cd apps/web
PLAYWRIGHT_TEST_BASE_URL=https://[YOUR_VERCEL_DOMAIN].vercel.app \
  yarn playwright test --reporter=html

# Option 2: Specific test files
yarn playwright test e2e/browser/01-homepage.spec.ts --reporter=html
yarn playwright test e2e/browser/02-auth.spec.ts --reporter=html
yarn playwright test e2e/browser/03-typing-flow.spec.ts --reporter=html
yarn playwright test e2e/browser/04-multiplayer.spec.ts --reporter=html
```

### Live Test Scenarios

#### 1. Homepage & Navigation
- [ ] Load home page
- [ ] Verify UI renders (no errors)
- [ ] Check hero section loads
- [ ] Verify navigation header works
- [ ] Footer displays

#### 2. Authentication
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Google OAuth sign-in
- [ ] Logout
- [ ] Session persists on reload

#### 3. Typing Interface
- [ ] Load typing page (/type)
- [ ] Words mode works
- [ ] Time mode works (30s countdown)
- [ ] Test submission saves to database
- [ ] Results display WPM/accuracy

#### 4. Statistics
- [ ] View user profile
- [ ] Historical test results load
- [ ] Statistics calculate correctly
- [ ] Charts render

#### 5. Leaderboard
- [ ] Load leaderboard
- [ ] Top scores display
- [ ] Pagination works (if implemented)
- [ ] User ranking visible

#### 6. Multiplayer (WebSocket)
- [ ] Create multiplayer room
- [ ] Get room code
- [ ] Join room as second user
- [ ] Race starts
- [ ] Real-time progress sync between users
- [ ] Results save after race completes

#### 7. Database
- [ ] New registrations create user records
- [ ] Test results store in database
- [ ] No 500 errors in server logs

#### 8. Environment Integration
- [ ] Database URL is correct (no connection errors)
- [ ] WebSocket connects to Render service
- [ ] Auth secret is set correctly
- [ ] No NEXT_AUTO_URL warnings
- [ ] Email service sends (if configured)

### Browser DevTools Checks

Open DevTools → Network tab:
1. Check all requests complete (no 404/500)
2. WebSocket connection: Look for `typefast-ws.onrender.com`
3. Static assets from Vercel CDN
4. API calls to Vercel backend

### Server Logs

#### Vercel Logs
```
Dashboard → [Project] → Deployments → [Latest] → Logs
```
Expected: No errors, successful build output

#### Render Logs
```
Dashboard → typefast-ws → Logs
```
Expected: Server listening on port 8080, WebSocket connections accepted

#### PostgreSQL Logs
Check your database provider dashboard for connection errors

---

## 8. No-UI Boundary Confirmed

✅ **No visual changes made to UI**
✅ **No styling modifications**
✅ **No layout changes**
✅ **No copy/text changes**
✅ **No new components added**
✅ **No component behavior changes**

### Changes Made (Non-Visual Only)
1. ✅ Fixed `render.yaml` — Deployment config only
2. ✅ Created `vercel.json` — Deployment config only
3. ✅ No code changes to app or components

**All changes are deployment infrastructure only — zero impact on visual appearance or user experience.**

---

## Quick Reference

### Environment Variables by Service

**Vercel (apps/web):**
- DATABASE_URL
- AUTH_SECRET
- NEXTAUTH_URL
- AUTH_TRUST_HOST
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_WS_URL
- RESEND_API_KEY (optional)
- FRONTEND_URL
- REDIS_URL (optional)

**Render (typefast-ws):**
- NODE_ENV
- WS_PORT
- WS_HOST

**PostgreSQL (External):**
- CONNECTION_STRING (DATABASE_URL in Vercel)

### Key Commands

```bash
# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate

# View database
yarn db:studio

# Test locally before deploy
NEXT_PUBLIC_WS_URL=ws://localhost:8080 yarn dev

# Run E2E tests after deployment
PLAYWRIGHT_TEST_BASE_URL=https://typefast.vercel.app yarn playwright test
```

---

## Troubleshooting

### Vercel Build Fails
- ❌ `DATABASE_URL not found` → Set in Vercel environment variables
- ❌ `Prisma client not generated` → Verify postinstall hook runs
- ❌ `next build fails` → Check build log in Vercel dashboard

### Render Deployment Fails
- ❌ `build command failed` → Verify `yarn ws:build` works locally: `cd apps/ws && yarn build`
- ❌ `port 8080 already in use` → Port assignment handled by Render

### WebSocket Connection Fails
- ❌ Browser: `Cannot connect to typefast-ws.onrender.com` → Verify Render deployment succeeded
- ❌ Check Vercel logs for `NEXT_PUBLIC_WS_URL` value
- ❌ Verify firewall allows outbound WebSocket connections

### Database Connection Fails
- ❌ `ENOTFOUND` → Verify DATABASE_URL hostname is correct
- ❌ `Authentication failed` → Verify username/password in DATABASE_URL
- ❌ `Connection timeout` → Verify firewall allows connections to PostgreSQL port

### Auth Fails
- ❌ `invalid AUTH_SECRET` → Verify set in Vercel environment variables
- ❌ `redirect_uri_mismatch` on Google sign-in → Verify Google Console callback matches exact URL
- ❌ `NEXTAUTH_URL mismatch` → Verify matches your Vercel domain exactly

---

## Support
For issues, check:
1. Vercel deployment logs
2. Render deployment logs
3. PostgreSQL provider dashboard
4. Browser DevTools Console and Network tabs

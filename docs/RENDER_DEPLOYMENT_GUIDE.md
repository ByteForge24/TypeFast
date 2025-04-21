# Render Deployment Guide

## Overview

This guide walks through deploying TypeFast on Render with:
- **Web**: Next.js frontend (typefast-web)
- **WebSocket**: Node.js backend (typefast-ws)
- **Database**: PostgreSQL (typefast-db)

**Deployment Time**: 10-15 minutes

---

## Prerequisites

1. **GitHub Account** - Repository: https://github.com/ByteForge24/TypeFast
2. **Render Account** - https://dashboard.render.com
3. **Google OAuth** - https://console.cloud.google.com/
   - Create OAuth 2.0 credentials (Web Application)
   - Authorized redirect URI: `https://typefast-web.onrender.com/api/auth/callback/google`

---

## Step 1: Generate Required Secrets

### NEXTAUTH_SECRET
Generate a secure random string (run in any terminal):
```bash
openssl rand -base64 32
```
**Copy this value - you'll need it in Step 3**

### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth 2.0 Client IDs** → **Web Application**
5. **Authorized redirect URIs** → Add: `https://typefast-web.onrender.com/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret**

---

## Step 2: Deploy Blueprint (Web + WebSocket)

1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect GitHub (select ByteForge24/TypeFast, main branch)
4. Render will auto-detect `render.yaml`
5. You'll see configuration preview:
   - `typefast-web` (Next.js)
   - `typefast-ws` (WebSocket)

### Add Environment Variables:
Click **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `NEXTAUTH_SECRET` | Paste from Step 1 (openssl output) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `DATABASE_URL` | Leave empty for now - update after DB creation |

6. Click **Deploy Blueprints**
7. **Wait 3-5 minutes** for both services to build and start

**Status Check:**
- Both services should show "Live" status
- Build logs will show successful completion

---

## Step 3: Create PostgreSQL Database

1. In Render dashboard, click **New** → **PostgreSQL**
2. Configuration:
   - **Name**: `typefast-db`
   - **Database**: `typefast`
   - **User**: `postgres`
   - **Plan**: Free
   - **Region**: Same as web services (US East recommended)
   - **PostgreSQL Version**: 15
3. Click **Create Database**
4. **Wait 2-3 minutes** for database to initialize

**Once created:**
1. Open `typefast-db` service
2. Copy the **Internal Database URL** from the "Connections" section
   - Format: `postgresql://postgres:PASSWORD@host:5432/typefast`
3. Copy the full connection string

---

## Step 4: Connect Database to Web App

1. Go to `typefast-web` service
2. **Settings** → **Environment** → **Add Environment Variable**
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the connection string from Step 3
3. Click **Save**
4. Click **Redeploy** (or wait for auto-redeploy)

**Wait for redeploy to complete** (2-3 minutes)

---

## Step 5: Run Database Migrations

The web app will auto-run migrations on startup. To verify:

1. Open `typefast-web` service
2. **Logs** tab
3. Look for:
   ```
   Prisma schema loaded from prisma/schema.prisma
   ✔ Generated Prisma Client
   ```

**If you see errors**, check:
- `DATABASE_URL` is correct in environment variables
- PostgreSQL service is "Live"
- Connection string has port 5432 (not pooler)

---

## Step 6: Verify Deployment

### Check Services Status
- **typefast-web**: Should show HTTPS URL (e.g., `https://typefast-web.onrender.com`)
- **typefast-ws**: Should show HTTPS URL (e.g., `https://typefast-ws.onrender.com`)
- **typefast-db**: Should show "Available"

### Test Web App
1. Visit `https://typefast-web.onrender.com`
2. You should see the TypeFast homepage
3. Try signing up with Google OAuth
4. Complete a typing test
5. Create a multiplayer room

### Test WebSocket Connection
1. Visit `https://typefast-ws.onrender.com` in browser
   - Should show connection success/error message
2. Test multiplayer feature in web app

---

## Environment Variables Summary

| Variable | Source | Required | Notes |
|----------|--------|----------|-------|
| `NEXTAUTH_SECRET` | Generated | Yes | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud | Yes | OAuth credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud | Yes | OAuth credentials |
| `DATABASE_URL` | Render PostgreSQL | Yes | Internal connection string |
| `NEXTAUTH_URL` | Auto-set | No | Defaults to web service URL |
| `NEXT_PUBLIC_WS_URL` | Auto-set | No | Defaults to WebSocket service URL |
| `NODE_ENV` | Auto-set | No | Defaults to `production` |

---

## Troubleshooting

### Web App Won't Start
**Error**: `DATABASE_URL not provided`
- **Fix**: Check PostgreSQL service is created and `DATABASE_URL` is in web app environment variables

**Error**: `Can't reach database server`
- **Fix**: Ensure connection string has port 5432 (not 6543 pooler port)
- Verify PostgreSQL service is "Live"

### WebSocket Connection Fails
**Error**: `WebSocket connection refused`
- **Fix**: Check WebSocket service is "Live"
- Verify `NEXT_PUBLIC_WS_URL` points to correct service URL

### OAuth Not Working
**Error**: `Redirect URI mismatch` or similar
- **Fix**: Verify Google Cloud OAuth credentials have correct redirect URI:
  - `https://typefast-web.onrender.com/api/auth/callback/google`

### Migrations Won't Run
**Error**: `Prisma migration error`
- **Fix**: Check `DATABASE_URL` is correct
- Manually run migrations via Render service shell:
  ```bash
  cd apps/web/DB_prisma && npx prisma migrate deploy
  ```

---

## Rollback / Revert Changes

If something goes wrong:

1. **Revert code** (if code changes caused issues):
   ```bash
   git revert <commit-hash>
   git push origin main
   # Render will auto-redeploy
   ```

2. **Manual redeploy**:
   - In Render dashboard, click service → **Redeploy**

3. **Check logs**:
   - Service → **Logs** tab for detailed error messages

---

## Production Checklist

- [ ] `NEXTAUTH_SECRET` is set and secure
- [ ] Google OAuth credentials are configured
- [ ] Email notifications are set up (Render dashboard)
- [ ] Database backups are considered (upgrade to paid plan)
- [ ] Monitor Services → Analytics for performance
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Custom domain configured (optional)

---

## Next Steps

1. Monitor logs for errors: Render Dashboard → Services → Logs
2. Test all features:
   - Sign up → Check User table created
   - Type test → Check Test table created
   - Multiplayer room → Check Room table created
3. Invite users to beta test
4. Monitor performance and iterate

---

## Support

For issues:
1. Check **Render dashboard** → Service **Logs** tab
2. Verify environment variables are set correctly
3. Ensure GitHub branch is up-to-date with latest code
4. Check [Render documentation](https://render.com/docs)


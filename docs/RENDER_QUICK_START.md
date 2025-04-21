# Quick Render Deployment Checklist

## 🚀 5-Minute Quick Start

### Before You Start
- [ ] Have Google OAuth ClientID + Secret ready
- [ ] Generated NEXTAUTH_SECRET: `openssl rand -base64 32`

### Phase 1: Deploy Blueprint (5 min)
```
1. https://dashboard.render.com → New → Blueprint
2. Select ByteForge24/TypeFast (main branch)
3. Add 3 environment variables:
   - NEXTAUTH_SECRET
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - DATABASE_URL (leave empty for now)
4. Click Deploy Blueprints
5. Wait for both services to show "Live"
```

### Phase 2: Create Database (3 min)
```
1. New → PostgreSQL
2. Name: typefast-db
3. Region: US East (same as web service)
4. Create Database
5. Copy Internal Database URL when ready
```

### Phase 3: Connect Database (2 min)
```
1. Go to typefast-web service
2. Settings → Environment
3. Add DATABASE_URL = [copied from PostgreSQL]
4. Save → Redeploy
5. Wait 2-3 minutes for rebuild
```

### Phase 4: Verify (2 min)
```
✓ Visit https://typefast-web.onrender.com
✓ Can see homepage
✓ Try signing up with Google OAuth
✓ Test typing challenge
✓ Create multiplayer room
```

## 📋 Services Created
- `typefast-web` - Next.js frontend (https://typefast-web.onrender.com)
- `typefast-ws` - WebSocket backend (https://typefast-ws.onrender.com)
- `typefast-db` - PostgreSQL database

## 🔧 Environment Variables Needed

| Variable | How to Get |
|----------|-----------|
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 |
| `DATABASE_URL` | Render PostgreSQL → Internal Connections |

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Web app won't start | Verify `DATABASE_URL` is set in env vars |
| Can't connect to database | Use port 5432 (not 6543), check PostgreSQL is "Live" |
| OAuth redirect error | Add to Google Console: `https://typefast-web.onrender.com/api/auth/callback/google` |
| WebSocket won't connect | Check `typefast-ws` service is "Live" |

## 📚 Full Guide
See: [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)


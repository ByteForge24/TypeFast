# TypeFast Development & Deployment Workflow

## Architecture Overview

TypeFast is a full-stack monorepo with:
- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Real-time:** Node.js WebSocket server for multiplayer
- **Auth:** NextAuth.js v5 (credentials + Google OAuth)
- **Database:** PostgreSQL (Prisma ORM)
- **Cache:** Redis (leaderboards, real-time data)

---

## Local Development

### Prerequisites

```bash
# Install dependencies
yarn install
```

### Environment Setup

1. Copy environment template:
   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```

2. Update required variables in `.env.local`:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `npx auth secret`
   - (Optional) `GOOGLE_CLIENT_ID/SECRET` for Google OAuth
   - (Optional) `REDIS_URL` for leaderboard features
   - (Optional) `RESEND_API_KEY` for email verification

### Starting the Complete Stack

```bash
# Start all local services with Docker
yarn docker:up
```

This starts:
- **Frontend:** http://localhost:3000
- **WebSocket:** ws://localhost:8080
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### Local Docker Services

`docker-compose.yml` now runs the full local stack:
- `web` -> Next.js on `http://localhost:3000`
- `ws` -> WebSocket server on `ws://localhost:8080`
- `postgres` -> PostgreSQL on `localhost:5432`
- `redis` -> Redis on `localhost:6379`

### Individual Services

```bash
# Start only frontend
cd apps/web && yarn dev

# Start only WebSocket server (in separate terminal)
yarn ws:dev

# Stop the Docker stack
yarn docker:down

# View database in Prisma Studio
cd apps/web && yarn db:studio
```

### Database Operations

```bash
# Create a new migration
cd apps/web/DB_prisma
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Reset database (clears data, recreates schema)
npx prisma migrate reset --force
```

---

## Making Schema Changes

1. Edit `apps/web/DB_prisma/prisma/schema.prisma`
2. Run:
   ```bash
   cd apps/web/DB_prisma
   npx prisma migrate dev --name <descriptive_name>
   ```
3. Test locally to verify migration works
4. Commit migrations to git (Render auto-applies on deploy)

---

## Deployment to Production (Render)

### Step 1: Push to Git

```bash
git push origin main
```

Render automatically triggers deploy on push to main branch.

### Step 2: Configure Environment Variables in Render Dashboard

Set these in **Render Dashboard** → **TypeFast Web Service** → **Environment**:

**Core (Required):**
```
NODE_ENV=production
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[db]?pgbouncer=true
NEXTAUTH_SECRET=<generate-with: npx auth secret>
AUTH_URL=https://typefast.onrender.com
AUTH_TRUST_HOST=true
```

**Authentication (for credentials signup):**
```
RESEND_API_KEY=<from resend.com>
FRONTEND_URL=https://typefast.onrender.com
```

**Google OAuth (optional):**
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

**Real-time Features:**
```
NEXT_PUBLIC_WS_URL=https://typefast-ws.onrender.com
REDIS_URL=<cloud-redis-connection-string>
```

> ⚠️ **Important:** For Google OAuth, add this redirect URI in Google Cloud Console:
> ```
> https://typefast.onrender.com/api/auth/callback/google
> ```

### Step 3: WebSocket Service Configuration

The `typefast-ws` service is defined in `render.yaml`:
- **Build Command:** `yarn ws:build` (compiles TypeScript)
- **Start Command:** `node apps/ws/dist/index.js`
- **Port:** 8080 (internal)
- **Environment:** `WS_PORT=8080, WS_HOST=0.0.0.0`

Set in WebSocket service environment:
```
NODE_ENV=production
WS_PORT=8080
WS_HOST=0.0.0.0
```

### How Deployment Works

1. Both services defined in `render.yaml`
2. Web service depends on WebSocket service
3. Post-build: Prisma migrations run automatically
4. Renders run in separate containers, communicate via WebSocket URL

---

## Production Features

### Authentication Flows

**Credentials Sign-in:**
1. User enters email + password
2. Server action validates credentials
3. NextAuth creates JWT session
4. Session available to protected routes

**Google OAuth Sign-in:**
1. User clicks "Sign in with Google"
2. Redirects to Google consent screen
3. Google redirects back with authorization code
4. NextAuth exchanges for user data
5. PrismaAdapter creates/links user account
6. JWT session created

### Protected Routes

All protected paths use `auth()` from `apps/web/auth.ts`:
- **API Routes:** `/api/room`, `/api/leaderboard`
- **Server Actions:** `addTest`, `getProfileData`
- **Client Pages:** Multiplayer room with `useSession()` hook

### Real-time Multiplayer

WebSocket server (`apps/ws/src/index.ts`) handles:
- **JOIN_ROOM:** Add user to room, broadcast member list
- **START_RACE:** Broadcast race text to all members
- **UPDATE_PROGRESS:** Broadcast typing progress
- **SEND_MESSAGE:** Relay chat messages

Clients connect: `ws://localhost:8080` (dev) or `wss://typefast-ws.onrender.com` (prod)

### Leaderboard (Redis)

Redis commands:
- **zrange:** Fetch top scores
- **zrem:** Remove old user entry
- **zadd:** Add new score entry
- **expire:** Clear daily leaderboard at midnight

Requires `REDIS_URL` environment variable. Features gracefully disabled if Redis unavailable.

---

## Key Commands

```bash
# Development
yarn dev                 # Start all services
yarn ws:dev            # WebSocket only
cd apps/web && yarn dev # Frontend only

# Building
yarn build              # Build all workspaces
yarn ws:build          # Build WebSocket only

# Database
cd apps/web/DB_prisma
npx prisma migrate dev   # Local migration
npx prisma migrate deploy # Production migration
npx prisma studio       # Database explorer

# Type checking
yarn type-check         # Check all TypeScript
cd apps/web && yarn type-check # Frontend only
cd apps/ws && yarn type-check  # WebSocket only

# Linting
yarn lint               # Check all
yarn lint:fix           # Fix all
```

---

## Troubleshooting

**WebSocket connection refused:**
- Ensure `yarn ws:dev` is running
- Check `NEXT_PUBLIC_WS_URL` matches server address

**Database connection timeout:**
- Verify `DATABASE_URL` is correct
- PostgreSQL service is running
- Network access allowed (Render: authorized in DB settings)

**Google OAuth fails:**
- Verify redirect URI is registered in Google Cloud Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Ensure auth URL matches Render domain

**Redis features disabled:**
- Set `REDIS_URL` to enable leaderboards
- Can run local Redis: `redis-server`
- Or use cloud Redis: Upstash, Redis Cloud, AWS ElastiCache

**Migrations fail on Render:**
- Ensure `.env` `DATABASE_URL` points to production Postgres
- Check migration files are committed to git
- Verify Prisma schema matches migration history

---

## Important Notes

- **Schema changes must be migrations**, not manual `db push`
- Always commit to `apps/web/DB_prisma/migrations/` directory
- Test migrations locally with `prisma migrate dev`
- Render automatically runs `yarn db:migrate` during build
- WebSocket service auto-scales independently of web service

### "P1001 - Can't reach database server"

This is expected if Supabase is unreachable from your network. The local SQLite setup bypasses this.

### "Migration failed"

Run:

```bash
cd apps/web/DB_prisma
npx prisma migrate resolve --rolled-back <migration_name>
```

Then fix the issue and run:

```bash
npx prisma migrate dev
```

### Need to view Supabase data in production?

Use **Supabase Dashboard** → **SQL Editor** or connect with a PostgreSQL client using the connection string.
---

## WebSocket Server (Multiplayer)

### Running Locally

The multiplayer features require a WebSocket server. In development, run it separately:

```bash
# Terminal 1: Start the Next.js app (already from yarn dev)
# Terminal 2: Start the WebSocket server
yarn ws:dev
```

The server runs on `ws://localhost:8080` by default.

### Configuring Client Connection

For local development, the web app needs to know where the WebSocket server is. Set this environment variable in `apps/web/.env.local`:

```
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

The client will use this instead of the default `https://ws.TypeFast.club`.

### Production WebSocket Server

To deploy the WebSocket server on Render:

1. Create a new **Web Service** for the WebSocket server
2. Point it to the **apps/ws** directory
3. Set **Build Command**: `cd apps/ws && yarn build`
4. Set **Start Command**: `yarn start`
5. Set environment variables:
   - `WS_PORT=8080`
   - `WS_HOST=0.0.0.0`
6. Update the web app's `NEXT_PUBLIC_WS_URL` to point to the production WebSocket server domain

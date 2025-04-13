# TypeFast Development & Deployment Workflow

## Current Setup

**Local Development:** SQLite (avoids network connectivity issues)
**Production (Render):** Supabase PostgreSQL

---

## Local Development

### Prerequisites

```bash
# Install dependencies
yarn install
```

### Running the App

```bash
# Start dev server on http://localhost:3000
yarn dev
```

**Environment:** `apps/web/DB_prisma/.env` uses SQLite (`file:./dev.db`)

### Database Operations

```bash
# Create a new migration
cd apps/web/DB_prisma
npx prisma migrate dev --name <migration_name>

# View database in Prisma Studio
npx prisma studio

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
3. Commit migrations to git

---

## Deployment to Render (Supabase PostgreSQL)

### Render Environment Variables

Set these in **Render Dashboard** → **Environment**:

```
DATABASE_URL=postgresql://[user]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
AUTH_SECRET=<your-secret>
AUTH_URL=https://typefast.onrender.com
GOOGLE_CLIENT_ID=<your-id>
GOOGLE_CLIENT_SECRET=<your-secret>
RESEND_API_KEY=<your-key>
```

### Why This Works

1. **Local `.env`** → SQLite (no network dependency)
2. **Render `DATABASE_URL`** → Overrides with Supabase PostgreSQL at deployment
3. **Prisma schema** → Provider is `sqlite` for local, but `DATABASE_URL` points to PostgreSQL on Render
4. Migrations stored in git, applied on Render via:
   ```bash
   npx prisma migrate deploy
   ```

### Build Command (Render)

```bash
yarn db:migrate && yarn build
```

This ensures migrations run before the app starts.

---

## Important Notes

- **Schema changes must be migrations**, not manual `db push`
- Always commit `prisma/migrations` to git
- Test migrations locally with `prisma migrate dev`
- On Render, migrations run automatically during build via `prisma migrate deploy`

---

## Troubleshooting

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

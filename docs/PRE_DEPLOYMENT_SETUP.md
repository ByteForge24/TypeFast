# Pre-Deployment Environment Setup

## Step 1: Generate NEXTAUTH_SECRET

Open your terminal and run:

### On macOS/Linux/WSL:
```bash
openssl rand -base64 32
```

### On Windows PowerShell:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char][byte](Get-Random -Min 33 -Max 127) }) -join ''))
```

**Or use this online generator**: https://generate-secret.vercel.app/

**Save the output** - you'll need it in Render dashboard.

---

## Step 2: Set Up Google OAuth

### Create OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth Client ID**
5. Choose **Web Application**
6. Add Application Name (e.g., "TypeFast")

### Add Authorized Redirect URIs

In the "Authorized redirect URIs" section, add:
```
https://typefast-web.onrender.com/api/auth/callback/google
```

### Copy Credentials

You'll see:
- **Client ID** (copy this)
- **Client Secret** (copy this)

**Save both values** - you'll need them in Render dashboard.

---

## Step 3: Prepare Environment Variables Reference

Create a reference file locally (optional):

```bash
# Copy this locally for reference
cat > ~/typefast-env-credentials.txt << 'EOF'
NEXTAUTH_SECRET: [paste your openssl output here]
GOOGLE_CLIENT_ID: [paste from Google Cloud]
GOOGLE_CLIENT_SECRET: [paste from Google Cloud]
EOF
```

**Keep this file secure!** Don't commit it to GitHub.

---

## Step 4: Verify Repository is Ready

The repository should already have:
- ✅ `render.yaml` configured
- ✅ `.env.example` with all variables listed
- ✅ Prisma schema updated for simple PostgreSQL
- ✅ Build scripts in place

Check by running:
```bash
cd /path/to/TypeFast
ls -la render.yaml .env.example docs/RENDER_*.md
```

---

## Step 5: Validate Configuration Files

### Check render.yaml:
```bash
cat render.yaml | head -20
```
Should show:
- `typefast-web` service
- `typefast-ws` service
- Environment variable definitions

### Check Prisma schema:
```bash
cat apps/web/DB_prisma/prisma/schema.prisma | head -10
```
Should show:
- `provider = "postgresql"`
- `url = env("DATABASE_URL")`
- No `directUrl` (that was Supabase-specific)

---

## Ready for Deployment? ✓

You have:
- [ ] `NEXTAUTH_SECRET` value (from openssl)
- [ ] `GOOGLE_CLIENT_ID` value (from Google Cloud)
- [ ] `GOOGLE_CLIENT_SECRET` value (from Google Cloud)
- [ ] GitHub repo up-to-date (all files committed)
- [ ] Render account ready
- [ ] PostgreSQL database ready to create (will do in Render dashboard)

**Next**: Follow [RENDER_QUICK_START.md](./RENDER_QUICK_START.md) to deploy!

---

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` files to GitHub
- Never share `NEXTAUTH_SECRET` or `GOOGLE_CLIENT_SECRET` publicly
- Use Render's environment variable system (don't paste in code)
- These values are only for Render - keep them private


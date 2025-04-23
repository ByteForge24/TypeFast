# Authentication Setup Guide

## Production (Render) Configuration

### 1. Google OAuth Setup

The "OAuth client was not found" / "Error 401: invalid_client" occurs when Google OAuth is misconfigured.

**Steps to fix:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create or select an **OAuth 2.0 Client ID** (Web application type)
3. Add this **exact** URL to **Authorized redirect URIs**:
   ```
   https://typefast.onrender.com/api/auth/callback/google
   ```
   (Replace `typefast.onrender.com` with your actual production domain if different)
4. Add your production URL to **Authorized JavaScript origins**:
   ```
   https://typefast.onrender.com
   ```
5. In **Render Dashboard** → **Environment**, add:
   - `GOOGLE_CLIENT_ID` = your Client ID from Google
   - `GOOGLE_CLIENT_SECRET` = your Client Secret from Google

### 2. Email Verification (Resend)

For credentials signup, add these in Render Dashboard:

- `RESEND_API_KEY` – from [Resend](https://resend.com)
- `FRONTEND_URL` – your production URL (e.g. `https://typefast.onrender.com`)

Ensure the sender domain (`mail@TypeFast.club`) is verified in Resend.

### 3. Required Environment Variables Summary

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | Yes | Generate with `npx auth secret` |
| `AUTH_URL` | Yes | Production URL |
| `GOOGLE_CLIENT_ID` | For Google | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | For Google | From Google Cloud Console |
| `FRONTEND_URL` | For signup | Production URL for verification emails |
| `RESEND_API_KEY` | For signup | From resend.com |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

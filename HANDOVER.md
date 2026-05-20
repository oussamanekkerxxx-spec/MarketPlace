# Client Handover — Vercel Deployment Guide

## 1. GitHub Repository

The project source code stays in your GitHub account:
`https://github.com/oussamanekkerxxx-spec/MarketPlace.git`

> **The client does NOT need a GitHub account.** The repo is public, so Vercel can import it directly using the URL above.

---

## 2. Vercel Account & Project

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with the **client's email**
3. Verify the email

### Step 2: Import Project
1. In Vercel dashboard, click **"Add New Project"**
2. Choose **"Import Third-Party Git Repository → URL"** and paste:
   `https://github.com/oussamanekkerxxx-spec/MarketPlace.git`
3. Framework preset: **Next.js** (should auto-detect)
4. Root directory: `./` (default)
5. Click **Deploy** — the first deploy will fail because env vars are missing (expected)

### Step 3: Add Environment Variables
Go to Project Settings → Environment Variables, then add **all** of the following:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ggzkmzptactfqirybmsl.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(see Secure Transfer below)* | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | *(see Secure Transfer below)* | Production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAADSiLSJg9JgHYFoW` | Production |
| `TURNSTILE_SECRET_KEY` | *(see Secure Transfer below)* | Production |
| `RESEND_API_KEY` | *(see Secure Transfer below)* | Production |
| `FROM_EMAIL` | `onboarding@resend.dev` | Production |
| `ADMIN_EMAIL` | `shahdmall119@gmail.com` | Production |
| `INTERNAL_API_SECRET` | `marketplace-internal-secret-2026` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-actual-domain.com` | Production |

> **Important:** Replace `NEXT_PUBLIC_SITE_URL` with the actual domain Vercel gives you (e.g., `https://marketplace-xyz.vercel.app`) or your custom domain.
> 
> **Email:** `FROM_EMAIL` can stay as `onboarding@resend.dev` for testing. Once you verify a domain in Resend, switch it to `notifications@your-domain.com`.

### Step 4: Re-deploy
After adding all env vars, go to Deployments and click **Redeploy** on the latest build.

---

## 3. Secure Credential Transfer

**Do NOT send these via WhatsApp or unencrypted email.** Share using one of:
- Password manager share (Bitwarden, 1Password)
- Encrypted note (Privnote, Password.link)
- Direct copy-paste in a secure video call

### Credentials to transfer securely:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnemttenB0YWN0ZnFpcnlibXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzQ5NjMsImV4cCI6MjA5NDg1MDk2M30.TzfoqRhAqrdH2rJUSY2C-PspxfEXzEBDsbcDYPXTvnY

SUPABASE_SERVICE_ROLE_KEY=
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnemttenB0YWN0ZnFpcnlibXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI3NDk2MywiZXhwIjoyMDk0ODUwOTYzfQ.7XRuApwQanOwrkICje9fkfSKZWxSCatfuVDwpENGP6M

TURNSTILE_SECRET_KEY=
0x4AAAAAADSiLXLlzctWpMqPFRwKgukXhG8

RESEND_API_KEY=
(Your Resend API key from https://resend.com)
```

---

## 4. Post-Deployment Checklist

- [ ] Site loads correctly on the Vercel URL
- [ ] Login / auth works
- [ ] Admin panel accessible
- [ ] Contact form / email sends successfully
- [ ] Images upload to Supabase Storage
- [ ] (Optional) Add custom domain in Vercel Settings → Domains

---

## 5. Cleanup (After Handover)

Once the client confirms everything works:
- **Delete the old Vercel project** from your personal Vercel account
- **Delete the old Supabase project** from your personal Supabase account (`kreqrrdptmfozqbybdkh`)

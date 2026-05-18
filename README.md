# Moroccan COD E-Commerce Platform

A trilingual (French / English / Arabic) cash-on-delivery e-commerce marketing site built for Facebook/Instagram ad-driven sales in Morocco.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + Auth + Storage) · Cloudflare Turnstile · Meta Pixel + CAPI

---

## Features

- **Trilingual storefront** with RTL Arabic support
- **One-product reservation flow** optimized for COD (cash on delivery)
- **Admin dashboard** for products, orders, categories, cities, team management
- **Meta Pixel + Conversions API** (CAPI) — browser and server-side event tracking
- **Bot protection** — Cloudflare Turnstile + honeypot field
- **Order attribution** — UTM params, referrer, IP, user agent stored for fraud forensics
- **SEO ready** — dynamic Open Graph, Twitter cards, JSON-LD structured data, sitemap, robots.txt
- **Real-time notifications** — Telegram + email alerts on new orders

---

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Vercel account (or any Next.js host)
- (Optional) Cloudflare Turnstile site key + secret key
- (Optional) Meta Pixel ID + CAPI access token + dataset ID

---

## Local Setup

```bash
# 1. Clone & install
git clone <repo-url>
cd app
npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, Turnstile keys, and site URL

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/fr` by default.

---

## Supabase Setup

1. **Create a new Supabase project.**
2. **Run the schema:** Open the SQL Editor and paste the entire contents of `01_initial_schema.sql`, then run it.
3. **Create storage buckets** (Supabase Dashboard → Storage):
   - `product-images` — public read, authenticated staff write
   - `category-images` — public read, authenticated staff write
   - `brand-assets` — public read, authenticated admin write
4. **Create your first admin user:**
   - Authentication → Users → Add User (email + password)
   - SQL Editor: `UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';`
5. **Configure Auth URL:**
   - Authentication → URL Configuration → Site URL = `http://localhost:3000` (dev) or your production domain

---

## Deployment (Vercel)

1. Push code to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Add environment variables from `.env.example` in Project Settings → Environment Variables.
4. Deploy.

---

## Admin Access

Navigate to `/fr/admin/login` (or `/en/admin/login`, `/ar/admin/login`) and sign in with the admin account you created in Supabase.

---

## Project Structure

```
app/
  [locale]/           # i18n routing (fr, en, ar)
    (public)/         # Customer-facing pages
    (admin)/          # Dashboard pages (auth-protected)
  api/                # API routes (CAPI, email, telegram)
  robots.ts           # /robots.txt
  sitemap.ts          # /sitemap.xml
components/
  admin/              # Dashboard UI components
  public/             # Storefront UI components
  ui/                 # Shared primitives
lib/
  actions/            # Server Actions (products, orders, settings)
  facebook/           # Meta CAPI helper
  i18n/               # next-intl config & navigation
  supabase/           # Supabase clients (server + browser)
  utils/              # Utilities (cn, attribution)
  validation/         # Zod schemas
messages/             # Translation files (ar.json, en.json, fr.json)
types/                # TypeScript types
01_initial_schema.sql # Complete Supabase schema
```

---

## License

Proprietary — built for client use.

# berk-homeavm — Project Memory

## Overview
E-commerce furniture store website. Bilingual (Turkish/English). Built with Next.js 14 App Router, deployed on Vercel, database on Supabase (PostgreSQL), images on Cloudflare R2.

**Live site**: https://berk-homeavm.com  
**Production branch**: `main` (Vercel builds from this branch)  
**Dev branch**: `claude/category-update-issue-6rxi15`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (`"use client"` pages) |
| Deployment | Vercel |
| Database | Supabase PostgreSQL (via `pg` pool, `pool.sql` template tag) |
| Image Storage | Cloudflare R2 (S3-compatible) |
| Auth (user) | Cookie-based JWT (`bcryptjs`) |
| Auth (admin) | Cookie `admin_auth` compared against `ADMIN_PASSWORD` env var |
| Language | Turkish / English via `LanguageContext` + `lib/i18n.ts` |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Payments | Stripe |
| Email | Resend |
| Notifications | Telegram bot webhook |

---

## Environment Variables (all set in Vercel)

```
# Database (Supabase)
SUPABASE_HOST
SUPABASE_PORT       (default 6543)
SUPABASE_DATABASE   (default "postgres")
SUPABASE_USER
SUPABASE_PASSWORD
DATABASE_URL        (fallback if SUPABASE_HOST not set)

# Cloudflare R2
R2_ACCOUNT_ID       (32-char hex Cloudflare account ID)
R2_ACCESS_KEY_ID    (R2 API token access key)
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME      (bucket name, not full URL)

# Admin
ADMIN_PASSWORD      (plaintext password for admin panel)

# Misc
NEXT_PUBLIC_SITE_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
```

---

## Image Upload Flow (current, working)

1. **Admin selects file** → `resizeToBlob()` crops to 600×600 square (canvas, JPEG q0.82)
2. **Blob sent to** `POST /api/admin/upload`
3. **Server tries R2**: uploads with `PutObjectCommand`, verifies with `GetObjectCommand`
   - Success → returns `{ url: "/api/images?key=products/...", storage: "r2" }`
   - Fail → falls back to base64 data URI `{ url: "data:image/jpeg;base64,...", storage: "base64" }`
4. **Admin page** sets `form.image = url`, shows green message
   - "R2'ye kaydedildi" = stored in R2 ✓
   - "Görsel kaydedildi" = stored as base64 in DB (fallback)
5. **Product saved** with `image` URL in Supabase `products` table
6. **Public display**: `GET /api/images?key=...` proxies image from R2 (no public bucket needed)

**Key**: R2 bucket does NOT need public access enabled. Images are always proxied through `/api/images`.

---

## Key Files

### API Routes
| File | Purpose |
|---|---|
| `app/api/admin/upload/route.ts` | Image upload → R2 with base64 fallback |
| `app/api/images/route.ts` | R2 image proxy (serves images from R2 via credentials) |
| `app/api/products/route.ts` | Public products list (includes `resolveImage` to fix bad URLs) |
| `app/api/products/sale/route.ts` | Products with discount (same `resolveImage` logic) |
| `app/api/admin/products/route.ts` | Admin CRUD for products (GET/POST) |
| `app/api/admin/products/[id]/route.ts` | Admin edit/delete single product (PUT/DELETE) |
| `app/api/admin/products/reorder/route.ts` | Drag-to-reorder products |
| `app/api/admin/categories/route.ts` | Admin CRUD for categories |

### Admin Pages
| File | Purpose |
|---|---|
| `app/admin/products/page.tsx` | Product management (add/edit/delete/reorder + image upload) |
| `app/admin/categories/page.tsx` | Category management |
| `app/admin/dashboard/page.tsx` | Stats overview |
| `app/admin/settings/page.tsx` | Site settings |

### Core Libraries
| File | Purpose |
|---|---|
| `lib/db.ts` | Supabase PostgreSQL pool with `pool.sql` template tag |
| `lib/checkAdmin.ts` | Sync auth check: compares `admin_auth` cookie to `ADMIN_PASSWORD` |
| `lib/useProducts.ts` | Client hook: fetches `/api/products`, falls back to `/data/products.json` |
| `middleware.ts` | Protects `/admin/products`, `/admin/categories`, etc. (redirect to `/admin` if not authed) |

### Components
| File | Purpose |
|---|---|
| `components/ProductCard.tsx` | Product card with `<img>` (not Next.js Image) + `onError` fallback |
| `components/ProductGrid.tsx` | Grid of ProductCards |
| `components/SaleSection.tsx` | Discounted products section |
| `context/LanguageContext.tsx` | TR/EN language switching |
| `context/CartContext.tsx` | Shopping cart state |

---

## Database Schema (key tables)

### `products`
```sql
id, slug (unique), name_tr, name_en, category_id (FK),
price_min, price_max, image (TEXT — URL or base64),
description_tr, description_en, sort_order,
discount_percent (default 0), variants (JSON array)
```

### `categories`
```sql
id, slug (unique), name_tr, name_en, image, sort_order
```

### `variants` (JSON array stored in products.variants)
```json
[{ "name": "Beyaz", "hex": "#ffffff", "image": "..." }]
```

---

## Admin Auth Flow

- Login: `POST /api/admin/login` → sets `admin_auth` cookie = `ADMIN_PASSWORD`
- Check: `lib/checkAdmin.ts` compares cookie to env var (sync, returns boolean)
- Middleware: protects admin page routes (not API routes)
- API routes: each checks the cookie directly or calls `checkAdmin`

**Note**: `checkAdmin` on `main` branch is **synchronous** and returns `boolean`.  
Do NOT use `await checkAdmin(req).success` pattern — it would always pass (Promise is truthy).

---

## `resolveImage()` Logic (in `/api/products/route.ts`)

Fixes bad image URLs stored in DB:
1. `data:...` base64 → pass through if < 1.2MB, else → placeholder
2. `unsplash.com` URL → pass through
3. `r2.dev//` (double slash bug) → convert to `/api/images?key=...`
4. `/api/images?key=` → pass through if R2 configured, else → placeholder
5. Anything else → placeholder (Unsplash sofa photo)

Self-healing: if URL was changed, updates DB in background so next fetch is clean.

---

## Important Decisions / Gotchas

1. **ProductCard uses `<img>` not Next.js `<Image>`** — R2/data URI images don't work with Next.js Image domains config.

2. **`useProducts` fallback**: tries live API first; if API returns 0 products, falls back to `/data/products.json` (static file baked at build time). New products require live API to be working.

3. **Admin form has single `price` field** on `main` branch (maps to both `price_min` and `price_max`). The feature branch has separate `price_min`/`price_max` fields.

4. **`syncProducts`** exists on `main` in `lib/syncProducts.ts` — writes static JSON and triggers Vercel deploy hook. On Vercel serverless, filesystem write fails silently (read-only). This is expected behavior; the live API is the primary data source.

5. **R2 proxy**: images are never served directly from R2 public URL. Always go through `/api/images?key=...`. This means R2 bucket can stay private.

6. **`/api/images` route added to `main` in commit `ab85420`** — was previously missing, causing all R2-uploaded images to 404.

---

## Recent Fix History (2026-08)

| Commit | Branch | Fix |
|---|---|---|
| `d96a250` | main | Changed admin upload to client-side base64 (temporary fix) |
| `ab85420` | main | Added `/api/images` proxy route + `resolveImage()` to products APIs |
| `7102d7a` | main | Restored R2 upload with base64 fallback; admin page uses server upload |

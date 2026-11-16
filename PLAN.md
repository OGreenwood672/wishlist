# Wishlist App — Plan

Status: **v1 implemented.** See README.md for setup and deploy.

## 1. Overview

A password-gated Next.js app hosting **multiple wishlists** (e.g. "Christmas 2026", "New Flat").
Each wishlist has its own **generated theme** and contains **categories** (e.g. "Bed frame"),
each holding **links** to candidate products, a **status**, and a **comment thread**.

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Hosting | Vercel |
| Database | Supabase (Postgres) via Vercel Marketplace integration (env vars auto-provisioned) |
| UI | Tailwind CSS, shadcn/ui, Framer Motion, Geist + curated display fonts |
| Validation | Zod |
| Theme generation | Claude API (structured JSON output), with preset fallback |

## 3. Access & roles

**The password decides what you see.** One neutral password box at `/`:

- **Admin password** (scrypt hash in env `ADMIN_PASSWORD_HASH`) → admin dashboard, sees everything.
- **Wishlist password** (one per wishlist, set by admin, stored in DB) → that wishlist only.

Wishlist password storage:
- `password_lookup` = HMAC-SHA256(key derived from `APP_SECRET`, password), unique index → instant lookup on
  unlock and guarantees no two wishlists share a password (or match the admin password).
- `password_encrypted` = AES-GCM ciphertext so the admin dashboard can **show / copy** the password
  for sharing. Key lives in Vercel env, not the DB.
- Admin UI offers a "suggest" button generating memorable passphrases (e.g. `pine-candle-42`);
  minimum length enforced.

Sessions:
- Signed HttpOnly cookie (JWT via `jose`, keyed from `APP_SECRET`), ~30 days.
- Admin cookie: `{ role: "admin" }`. Guest cookie: `{ role: "guest", wishlistId, pwVersion }`.
- One session = one wishlist. A **Log out** button clears the cookie; to switch wishlists, log out
  and enter a different password. No usernames.
- Changing a wishlist's password bumps `password_version` → existing guest sessions for it are revoked.
- Every request/mutation re-checks role **and** wishlist scope server-side (slug in URL is never trusted).
- Brute-force protection: artificial delay + rate limit per IP on unlock (more valid passwords = more
  important).
- Guests enter a display name once (stored in localStorage), used for comments/status/activity.

| Action | Admin | Guest |
|---|---|---|
| Create / edit / archive / delete wishlists, set passwords | ✅ | ❌ |
| See other wishlists | ✅ all | ❌ only unlocked ones |
| Generate / edit theme | ✅ | ❌ |
| Create / edit / delete categories & links | ✅ | ❌ |
| Set priority, price range, favourite link | ✅ | ❌ |
| Edit profile card | ✅ | ❌ |
| Change category status | ✅ | ✅ |
| Post comments | ✅ | ✅ |
| Delete comments | ✅ | ❌ |

## 4. Security model (no Supabase Auth)

- Browser **never** talks to Supabase directly.
- All reads/writes happen in server components / server actions using the service-role key.
- RLS enabled on all tables with **no policies** → anon key is useless even if exposed.

## 5. Features (v1)

### Multiple wishlists
- No public home page. Guests go password → straight into their wishlist (`/w/christmas-2026`).
- Unlock screen is neutral (theme can't leak before the password); on success it plays an
  "unlock" transition that morphs into the wishlist's theme.

### Admin dashboard (`/admin`)
- Grid of all wishlists, each tile a mini preview in its own theme, showing password (copy button),
  category count, bought/on-it counts, last activity.
- Quick actions: create, edit details, regenerate theme, change password, archive/unarchive, delete
  (with confirm).
- Archived section for past wishlists. Archived wishlists stay unlockable by their password but are
  **read-only** for guests (no status changes or comments) with a "This wishlist has wrapped up" banner.
- Edit profile card.
- Admin opens any wishlist and sees it exactly as guests do, plus edit controls.

### Per-wishlist generated theme
- When creating a wishlist, admin enters a title + optional description ("Moving into my first flat, Scandi vibes").
- "Generate theme" calls Claude, which returns a theme JSON constrained to a schema (below).
- Admin sees a live preview → **Regenerate**, **Tweak** (edit colours/emoji manually), or **Save**.
- Fallback: if no API key / generation fails, keyword-match to a library of ~10 hand-made presets.
- Theme only changes **design tokens**, never layout — the app always stays sleek and consistent.

### Categories
- Name, emoji, **status** (Available / On it / Bought, with who + when, visible to everyone).
- **Priority**: Must have / Would love / Nice to have.
- **Price range**: optional min/max, shown alongside fetched link prices.
- **Comment thread**: name + time + body.
- **Archive**: categories marked *Bought* move to a collapsible "Got it 🎉" section automatically;
  admin can also manually archive a category without it being bought.

### Links
- Paste URL → server action auto-fetches Open Graph / JSON-LD: title, image, favicon, site name, price.
- Fetch hardened: http(s) only, timeout, size cap, graceful fallback to favicon + domain.
- All fields editable; optional per-link note ("the 140cm one").
- **Favourite link**: admin stars one link per category → shown first, highlighted.

### Filters & sorting
- On the wishlist grid: filter by status (default hides archived), priority; sort by priority / newest / price.
- Stored in URL search params so a filtered view is shareable.

### Activity feed
- Per-wishlist feed: status changes, comments, new categories/links.
- Shown as a slide-out drawer; "new since your last visit" badge (last-visit timestamp in localStorage).

### Profile card
- Global "About me" card (sizes, favourite colours, brands to love/avoid, free-form sections).
- Pinned at the top of every wishlist (collapsible).

## 6. Data model (draft)

```
wishlists
  id uuid pk, slug text unique, title text, description text,
  theme jsonb, is_archived bool, sort_order int, created_at,
  password_lookup text unique, password_encrypted text, password_version int

categories
  id uuid pk, wishlist_id fk, name text, emoji text,
  status enum(available, on_it, bought), status_by text, status_at timestamptz,
  priority enum(must, love, nice), price_min numeric, price_max numeric,
  is_archived bool, sort_order int, created_at

links
  id uuid pk, category_id fk, url text, title text, image_url text, favicon_url text,
  site_name text, price numeric, currency text, note text,
  is_favourite bool  -- partial unique index: one favourite per category
  sort_order int, created_at

comments
  id uuid pk, category_id fk, author_name text, author_role text, body text, created_at

activity
  id uuid pk, wishlist_id fk, category_id fk null, actor_name text, actor_role text,
  type text, payload jsonb, created_at

profile (single row)
  id int pk = 1, sections jsonb, updated_at

```

Currency: GBP everywhere (prices stored as numeric, formatted with `Intl.NumberFormat('en-GB')`).
Fetched prices in other currencies are shown as-is with their symbol and excluded from range checks.

## 7. Theme schema (draft)

```ts
Theme = {
  name: string,                 // "Frosted Pine"
  mode: "dark" | "light",
  colors: { bg, surface, border, text, muted, accent, accentText },  // hex
  background: {
    kind: "mesh" | "gradient" | "aurora" | "pattern",
    stops: string[],            // 2–4 colours
    pattern?: "grain" | "dots" | "grid" | "snow" | "waves" | "confetti"
  },
  font: "geist" | "fraunces" | "space-grotesk" | "playfair" | "dm-serif" | "syne",  // curated, preloaded
  emoji: {
    mark: string,               // wishlist icon, e.g. 🎄
    decor: string[],            // used sparingly in headings / empty states
    status: { available, on_it, bought },
    priority: { must, love, nice }
  },
  copy: { tagline: string, emptyState: string, gotItTitle: string }
}
```

Guardrails:
- Zod-validated; invalid output → retry once → preset fallback.
- Server-side WCAG contrast check (text/bg, accentText/accent); auto-adjust or reject.
- Status colours keep their meaning (neutral / amber / green) but are tinted to the theme.
- Fonts limited to a preloaded set (next/font needs them at build time).

## 8. Routes

| Route | Purpose |
|---|---|
| `/` | Password screen (only public page); redirects if already unlocked |
| `/w/[slug]` | Wishlist: profile card, filters, category grid, "Got it" section, activity drawer |
| `/w/[slug]/c/[id]` | Category detail: links, status, comments |
| `/admin` | Admin dashboard: all wishlists, create/edit/archive/delete, passwords |
| `/admin/w/new`, `/admin/w/[slug]` | Create wishlist / edit details, password, theme |
| `/admin/profile` | Edit profile card |

## 9. Env vars

- `ADMIN_PASSWORD_HASH` (scrypt, generated by `npm run setup-secrets`)
- `APP_SECRET` (session signing; HMAC lookup and AES keys are derived from it)
- `ANTHROPIC_API_KEY` (optional — enables theme generation)
- Supabase vars (auto from Vercel integration)

## 10. Build phases

1. Scaffold Next.js, Tailwind, shadcn, theme-token system (CSS variables driven by theme JSON).
2. Auth gate: unlock page, password lookup, session cookie (admin / scoped guest), middleware, rate limiting.
3. Supabase migration (tables, enums, indexes, RLS on) + server data layer.
4. Admin dashboard: create/edit/archive/delete wishlists, set passwords; preset themes applied.
5. Categories: grid, CRUD, priority, price range, status, archive section.
6. Links: auto-fetch previews, favourite, notes.
7. Comments + activity feed.
8. Filters/sorting, profile card.
9. AI theme generation + preview/tweak UI.
10. Polish: motion, skeletons, empty states, mobile pass.
11. Deploy guide: GitHub → Vercel → Supabase integration → migration → env vars.

## 11. Later / out of scope for v1

Chip-in / group gift tracker, reactions on links, drag-to-reorder, PWA share-target quick-add,
price-drop tracking.

# Wishlist

A password-gated, themed wishlist app. Each wishlist has its own password and its own
(optionally AI-generated) theme. Guests enter a password and land straight in that list;
the admin password opens a dashboard for managing everything.

Built with Next.js 16 (App Router), Supabase (Postgres), Tailwind CSS v4 and Motion.
See [PLAN.md](PLAN.md) for the full design.

## How access works

- **Admin password** → `/admin` dashboard: create / edit / archive / delete wishlists, set
  passwords, generate themes, edit the "About me" card. The admin can also edit categories,
  links and comments inside any wishlist.
- **Wishlist password** → that wishlist only. Guests can change a category's status and
  comment. Passwords are case-insensitive and unique per wishlist. Log out to switch lists.
- **Archived wishlists** stay unlockable but are read-only for guests.
- Changing a wishlist's password logs out everyone currently viewing it.

The browser never talks to Supabase. All data access happens on the server with the
service-role key, and RLS is enabled with no policies, so the public anon key can't read anything.

## Deploy (GitHub → Vercel → Supabase)

1. **Push to GitHub.** Create an empty repo, then:
   ```bash
   git add -A && git commit -m "Wishlist app" && git remote add origin <your-repo-url> && git push -u origin main
   ```
2. **Import into Vercel.** On vercel.com go to Add New → Project, pick the repo, and deploy. The
   first deploy will fail until the env vars below exist; that's fine.
3. **Add Supabase.** In the Vercel project, go to Storage → Create Database → Supabase (or Marketplace →
   Supabase) and connect it to the project. This creates the Supabase project and adds
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (and friends) to your env vars.
4. **Create the tables.** Open the Supabase dashboard → SQL Editor, paste
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it.
5. **Set your secrets.** Locally run:
   ```bash
   npm run setup-secrets -- "choose-a-strong-admin-password"
   ```
   Add the printed `APP_SECRET` and `ADMIN_PASSWORD_HASH` in Vercel → Settings → Environment Variables.
   Keep `APP_SECRET` stable: changing it logs everyone out and makes stored wishlist passwords unreadable.
6. **(Optional) AI themes.** Add `ANTHROPIC_API_KEY` (from console.anthropic.com). Without it,
   "Generate theme" picks one of 10 hand-made presets based on keywords in the title.
7. **Redeploy** (Deployments → ⋯ → Redeploy). Visit the site, enter your admin password, and create a wishlist.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (or: npx vercel env pull .env.local)
npm run dev
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`.

## Project layout

```
src/
  proxy.ts                 First-line auth redirect (Next 16's renamed middleware)
  app/
    page.tsx               Password screen
    admin/                 Dashboard, wishlist editor + theme studio, profile editor
    w/[slug]/              Wishlist grid, filters, "Got it" section
    w/[slug]/c/[id]/       Category: status, links, comments
    actions/               Server actions (auth, admin, wishlist), all re-check access
  components/              UI (theme shell, dialogs, cards, activity drawer…)
  lib/
    auth.ts                Access checks for pages and actions
    passwords.ts           scrypt admin hash, HMAC lookup + AES-GCM for wishlist passwords
    link-preview.ts        Server-side OG/JSON-LD fetch (SSRF-guarded)
    theme/                 Theme schema, presets, contrast fixing, Claude generation
supabase/migrations/       SQL schema
```

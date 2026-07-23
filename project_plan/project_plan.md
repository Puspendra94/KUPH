
# KUPH — Plans, Activity Log, PWA, Settings Restructure

## 1. Subscription tiers (no real billing yet)

Add a `plan` column to `agencies`; enforce feature access from that column. Admins can change plan from a Settings → Billing tab (dev-only "Change plan" dropdown for now; wire Stripe later).

### Tier matrix

```text
Feature                          Free   Pro   Max
-----------------------------------------------
Influencers / Clients / CRM       ✓      ✓     ✓
Campaigns + Dashboard             ✓      ✓     ✓
CSV/Excel import                  ✓      ✓     ✓
Team members                     ≤ 5   ∞     ∞
Team invites                      ✓      ✓     ✓
Activity log                      —      ✓     ✓
Email notifications               —      ✓     ✓
Priority support badge            —      ✓     ✓
In-app chat (agency-wide)         —      —     ✓
AI influencer search              —      —     ✓
Online payments to influencers    —      —     ✓
SSO                               —      —     ✓
```

Only Free-vs-Pro seat gating and the Free/Pro/Max UI gates are implemented this pass. Chat / AI search / influencer payouts / SSO are gated in the UI (locked cards with "Upgrade to Max") but not built; they're separate features.

### Enforcement

- DB trigger on `agency_members` INSERT: if `agencies.plan = 'free'` and member count would exceed 5, `RAISE EXCEPTION`.
- Same check server-side before creating an invite (surface friendly toast + upgrade CTA).
- `usePlan()` hook exposes `{ plan, has(feature) }`. Wrap gated UI in `<PlanGate feature="activity_log">`.

## 2. Activity log

New table `activity_log` (agency_id, actor_id, entity_type, entity_id, action, diff jsonb, created_at). Populated by triggers on every user-facing table:

- influencers, clients, campaigns, campaign_influencers, agency_members, agency_invites, notification_prefs, agencies
- INSERT / UPDATE / DELETE via one shared trigger fn that computes JSON diff of changed columns and reads `auth.uid()` for actor.
- Auth events (sign-in, sign-out, password reset) captured client-side via `onAuthStateChange` → server fn insert (Supabase doesn't expose auth webhooks on Cloud).

RLS: SELECT for members of agency, but **only when `agencies.plan <> 'free'`** (Pro+ feature). No INSERT/UPDATE/DELETE for anyone (triggers use SECURITY DEFINER).

UI: `src/routes/_app.settings.activity.tsx` — filterable list (entity type, actor, date range), infinite scroll, human-readable summary of each diff.

## 3. PWA (installable + offline)

- Add `public/manifest.webmanifest` with name "KUPH", theme/background from design tokens, `display: standalone`, icons (192, 512, maskable) generated from existing favicon.
- Add manifest + apple-touch-icon + theme-color links in `src/routes/__root.tsx` head.
- Install `vite-plugin-pwa`; configure `generateSW`, `registerType: autoUpdate`, `devOptions.enabled: false`, `injectRegister: null`, `navigateFallback` excludes `/api/*` and `/~oauth`.
- Create `src/lib/register-sw.ts` guarded wrapper per PWA skill: refuse to register in dev, iframe, any `*preview*`/`lovableproject.com`/`beta.lovable.dev` host, and when `?sw=off`. Unregister stale `/sw.js` in all those cases.
- Registration wired once from `src/start.ts` (client bootstrap).
- Runtime caching: `NetworkFirst` for HTML navigations, `CacheFirst` for hashed static assets.
- Responsive audit: existing pages already use Tailwind responsive prefixes; add missing `min-w-0` / `grid-cols-[minmax(0,1fr)_auto]` fixes in Team + Campaign header rows per responsive-layout-patterns rule.

## 4. Settings restructure + Team gating

Convert `_app.settings.tsx` into a **layout route** (`<Outlet />`) with tabs:

```text
Settings/
├── Profile          (self, any role)
├── Notifications    (admin only, Pro+)
├── Team             (admin only) ← moved from top-level /team
├── Billing          (admin only) — plan selector + seat usage
├── Activity         (admin only, Pro+)
└── Danger zone      (admin only) — leave agency, delete agency (admin+last→transfer note)
```

- Remove `/team` from sidebar + mobile nav. Non-admins never see the Settings icon in nav; hitting `/settings/*` redirects to `/dashboard`.
- Admin role check via `has_agency_role(auth.uid(), current_agency_id, 'admin')` cached in `useCurrentAgency()`.
- Ownership transfer = admin promotes another member to `admin`, then demotes/leaves themselves. Copy on Danger zone explains this — no dedicated "Transfer" UI.
- First person to register: `handle_new_user` trigger already creates their agency and inserts them as `admin`. Verified; no change needed. New sign-ups still land as admin of their own new agency.

## Technical details

### Migration (single, requires approval)

- `ALTER TYPE agency_role` unchanged.
- New enum `agency_plan`: `free`, `pro`, `max`.
- `ALTER TABLE agencies ADD COLUMN plan agency_plan NOT NULL DEFAULT 'free'`.
- `CREATE TABLE public.activity_log (...)` with full GRANT + RLS block (SELECT for `is_agency_member` AND `plan <> 'free'`).
- `CREATE FUNCTION public.tg_log_activity()` SECURITY DEFINER — attaches to all 8 tables as AFTER INSERT/UPDATE/DELETE.
- `CREATE FUNCTION public.enforce_free_seat_cap()` on `agency_members` BEFORE INSERT.
- REVOKE EXECUTE on the two new trigger fns from PUBLIC/anon/authenticated.
- Backfill: existing agencies default to `free`.

### New/changed files

- **Deps**: `bun add vite-plugin-pwa` (dev) — updates `vite.config.ts`.
- **New**: `public/manifest.webmanifest`, `public/icons/{192,512,maskable}.png` (imagegen), `src/lib/register-sw.ts`, `src/lib/plan.ts` (features map + `has()`), `src/hooks/use-plan.ts`, `src/components/PlanGate.tsx`, `src/components/UpgradeCta.tsx`, `src/routes/_app.settings.tsx` (layout), `src/routes/_app.settings.profile.tsx`, `src/routes/_app.settings.notifications.tsx`, `src/routes/_app.settings.team.tsx` (moved from `_app.team.tsx`), `src/routes/_app.settings.billing.tsx`, `src/routes/_app.settings.activity.tsx`, `src/routes/_app.settings.danger.tsx`.
- **Edit**: `src/routes/__root.tsx` (manifest links, theme-color), `src/start.ts` (register SW), `src/routes/_app.tsx` (remove Team nav, hide Settings for non-admin, admin redirect guard), `src/lib/db.ts` (add `plan` to Agency type, add `useCurrentAgencyRole`), invite/create flows to surface seat-limit error.
- **Delete**: `src/routes/_app.team.tsx` (replaced by settings tab).

### Route tree

`routeTree.gen.ts` regenerates automatically. The `_app.settings.tsx` file switches to a layout with `<Outlet />` — its previous single-page content moves into `_app.settings.profile.tsx` as the default index child.

## Out of scope this pass

Real Stripe integration (plan column is manually settable by admin for now), the Max-tier features themselves (chat, AI search, online payouts, SSO) — only their locked upgrade CTAs, per-user notification preferences, Capacitor native wrappers (PWA install covers Android/iOS home-screen install).

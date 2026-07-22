# Fixes applied — 22 July 2026

This document summarizes every change made to this repo during the bug
investigation. All fixes were applied directly to the real source files,
typechecked (`tsc --noEmit`, zero errors in both `apps/worker` and
`apps/web`), and `apps/web` was confirmed to build cleanly with
`npm run build`. `apps/worker` was confirmed to bundle cleanly with
`npx wrangler deploy --dry-run` (all bindings resolved correctly).

Deploying was not done from this environment — no Cloudflare credentials
are available here. Deploy with your own `wrangler login` / API token as
normal (see `DEPLOYMENT.md`).

## Bug 1 & 2: logged out on refresh / cannot save changes

**File:** `apps/worker/src/routes/auth.ts`

Both the `refresh_token` and `csrf_token` cookies were set with
`SameSite=Strict`. Because the frontend (`*.pages.dev`) and this API
(`*.workers.dev`) are different origins, `SameSite=Strict` blocked the
browser from sending either cookie on any request from the frontend to
the API — including ordinary `fetch()` calls, not just top-level
navigation. Concretely:

- `POST /api/auth/refresh` never received the `refresh_token` cookie on
  page reload, so refresh always failed and the in-memory access token
  was lost — indistinguishable from being logged out.
- Every admin write (`POST`/`PUT`/`DELETE` under `/api/admin/*`) never
  received the `csrf_token` cookie, so `csrfProtection` rejected every
  save with `403 CSRF_INVALID` before it reached any route logic.

**Fix:** cookies now use `SameSite=None; Secure` in production/staging
(required pairing per spec — browsers drop `SameSite=None` cookies
without `Secure`), and `SameSite=Lax` in local development.

**Alternative fix you may prefer long-term:** the project's own
`apps/web/.env.example` recommends serving the frontend and API from the
same origin (e.g. a Pages `_redirects`/proxy rule forwarding `/api/*` to
the Worker). If you do that instead, `SameSite=Strict` would work fine
as originally written, since the requests would no longer be cross-site.
Not applied here since it requires an infrastructure change; the cookie
fix above is the lower-risk option given the current two-origin setup.

## Bug 3: silent data loss on product edit, nav menu, and orders

**Files:**
- `apps/worker/src/lib/repositories/products.ts` (`createProduct`, `updateProduct`)
- `apps/worker/src/lib/repositories/config.ts` (`replaceNavLinks`)
- `apps/worker/src/lib/repositories/commerce.ts` (`createOrder`)

Each of these ran a DELETE (or the parent row INSERT) as its own
auto-committed D1 call, then ran dependent INSERTs in a *separate*
`db.batch()` call afterward. If the second call failed for any reason,
the first had already committed with no rollback:

- `updateProduct`: could delete a product's categories/variants and then
  fail to re-insert them, leaving the product intact but empty of that
  data.
- `replaceNavLinks`: could wipe the entire site navigation menu with
  nothing to restore it from.
- `createOrder`: could confirm a real order with zero line items.

Verified this failure mode directly against the live D1 database before
fixing: a delete stayed committed even when its paired insert failed.

**Fix:** every statement in each operation (the row write, deletes, and
inserts) now goes into a single `db.batch()` call, which Cloudflare's
own docs confirm executes as a real SQL transaction — any failed
statement rolls back the whole batch, leaving prior data untouched.

## Bug 4: saves rejected due to overly strict SEO validation

**File:** `packages/shared/src/validation.ts`

`productInputSchema` and `blogPostInputSchema` required a hand-written
SEO title (10–70 characters) and meta description (50–160 characters)
with no way to leave them blank — but both the `products` and
`blog_posts` D1 tables default `seo_title`/`seo_meta_description` to
`''`, meaning the database was designed to allow blank SEO fields. Any
admin who left them blank, or slightly short, got a `422
VALIDATION_ERROR` that looked identical to "the save button doesn't
work," with no connection to auth/CSRF at all.

**Fix:** `seo` is now optional on both schemas, defaulting to `{}`, and
a `.transform()` auto-fills `title`/`metaDescription`/`canonicalPath`
from the product/post's own name and description when left blank. Real
input the admin does provide passes through untouched. The `min(1)`
variants requirement and other genuine validation (e.g. slug format,
name length) are unchanged and still correctly reject bad input.

**Related fix:** `apps/web/src/admin/pages/products/ProductEditorPage.tsx`
had a type error surfaced by this change (`product.seo.noIndex` is
`boolean | undefined` from the API, but the schema's fixed output type
now requires a definite `boolean`) — fixed with `?? false` when building
the form's default values.

## Things checked and found correct (no changes needed)

- CORS setup in `apps/worker/src/index.ts` (`credentials: true`, origin
  reflection, localhost allowance in dev) — correct as written.
- `apps/web/src/lib/api-client.ts` and
  `apps/web/src/admin/lib/admin-auth-store.ts` — the frontend already
  correctly calls `/api/auth/refresh` on mount
  (`initAdminAuth()` in `AdminApp.tsx`) and echoes the CSRF cookie on
  writes. These were not the problem; the cookie policy bug above meant
  they were never receiving what they needed from the server.
- `apps/web/src/admin/components/RequireAdminAuth.tsx` — correctly waits
  for session restore before redirecting to login.
- JWT sign/verify logic in `apps/worker/src/lib/crypto.ts`.
- D1 schema (`migrations/0001_init.sql`) — matches what the repository
  code expects; no drift found.
- All other admin routes (categories, media, blog, reviews, FAQs,
  coupons, customers, orders, settings, users, dashboard, audit log) —
  same auth/CSRF pattern throughout, no independent bugs found beyond the
  four above.

## One live-config item worth your attention (not changed here)

`apps/worker/wrangler.toml` has:
```
CORS_ALLOWED_ORIGIN = "https://3c0894c3.pure-relief.pages.dev"
```
This looks like a Cloudflare Pages preview-deploy URL, which typically
changes on every new deploy unless aliased to a stable domain or the
production branch URL. If your frontend is now served at a different
URL than this, every request will be blocked by CORS before it even
reaches the cookie/CSRF logic above. Confirm this matches your frontend's
actual current URL (see `DEPLOYMENT.md` step 12), and update
`VITE_API_BASE_URL` in the frontend's `.env.production` to match the
Worker's real URL too.

Also flagged in `DEPLOYMENT.md` by the original setup notes, unrelated to
this investigation but worth carrying forward: the seeded owner password
(`ChangeMe123!`) is a placeholder and there's no self-service
password-reset flow yet — change the password directly via
`wrangler d1 execute` before real launch.

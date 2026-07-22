# Deployment Guide — Codespaces → Cloudflare

You said you'll unzip this in a Codespace and already have a Cloudflare API token. Follow these steps in order — each one builds on the last.

## 0. Unzip and open in Codespaces

Unzip `pure-relief.zip`, push it to a new GitHub repo (or open it directly as a Codespace if you're working from a local clone that's already pushed), then open a terminal in the Codespace.

## 1. Install dependencies

```bash
npm install
```

This installs everything for the whole monorepo (frontend, worker, shared package) in one go via npm workspaces.

## 2. Authenticate Wrangler with your Cloudflare API token

If your token is already exported as an environment variable in the Codespace:

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
```

Or authenticate interactively (opens a browser link):

```bash
npx wrangler login
```

Verify it worked:

```bash
npx wrangler whoami
```

## 3. Create the D1 database

```bash
cd apps/worker
npx wrangler d1 create pure_relief_db
```

This prints a `database_id`. Copy it into `apps/worker/wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.

## 4. Create the R2 bucket

```bash
npx wrangler r2 bucket create pure-relief-media
```

The bucket name already matches `wrangler.toml` — no further edit needed unless you rename it.

## 5. Create the KV namespace (rate limiting)

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

Copy the printed `id` into `apps/worker/wrangler.toml`, replacing `REPLACE_WITH_KV_NAMESPACE_ID`.

## 6. Run database migrations

```bash
npm run db:migrate:local   # local D1, for testing with `wrangler dev`
npm run db:migrate:remote  # real production D1
```

## 7. Seed sample data (optional but recommended for first run)

The repo already includes a generated `seed.sql` with your real product copy (Migraine Relief Cap single/double/triple) and a default owner account. Apply it:

```bash
npm run db:seed:local
npm run db:seed:remote
```

**Important:** the seeded owner login is `owner@purerelief.co.uk` with password `ChangeMe123!` — this is a placeholder hash for local testing only. Change it immediately (see step 11).

## 8. Set production secrets

These are never stored in `wrangler.toml` — set them directly:

```bash
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put ADMIN_SESSION_PEPPER
```

For each, paste a long random string when prompted (e.g. generate one with `openssl rand -hex 32`).

## 9. Deploy the Worker (API)

```bash
npm run deploy
```

Wrangler prints your Worker's URL, e.g. `https://pure-relief-api.<your-subdomain>.workers.dev`. Copy it.

## 10. Configure and build the frontend

```bash
cd ../web
cp .env.example .env.production
```

Edit `.env.production`:
```
VITE_API_BASE_URL=https://pure-relief-api.<your-subdomain>.workers.dev
VITE_PUBLIC_SITE_URL=https://your-real-domain.co.uk
```

Build it:

```bash
npm run build
```

This outputs static files to `apps/web/dist`.

## 11. Deploy the frontend to Cloudflare Pages

From `apps/web`:

```bash
npx wrangler pages deploy dist --project-name=pure-relief
```

Follow the prompts to create the Pages project on first run. Wrangler prints your live URL.

## 12. Point your domain at both (optional)

In the Cloudflare dashboard: add your custom domain to the Pages project (for the storefront) and, if desired, a route like `api.yourdomain.co.uk` to the Worker. Update `CORS_ALLOWED_ORIGIN` in `wrangler.toml` and `VITE_API_BASE_URL`/`VITE_PUBLIC_SITE_URL` to match, then redeploy both.

## 13. First login and immediate to-dos

1. Go to `https://your-domain/admin/login` and sign in with the seeded owner account.
2. **Change the owner password immediately** — there's no self-service password change screen yet, so for now: generate a new PBKDF2 hash and update it directly via `wrangler d1 execute`, or add a password-reset endpoint before going further. This is flagged as a gap to close before real launch.
3. Go to Media Library and start uploading real product photography — every placeholder swaps automatically once you do.
4. Review Settings → set your real analytics ID and Search Console verification.
5. Review the legal pages' source content in `apps/web/src/pages/legal/` with a solicitor before this goes live.
6. Decide on and wire a payment gateway (Stripe/PayPal/other) — see the note in `apps/worker/src/routes/checkout.ts`.

## Local development (before deploying)

Run both apps side by side:

```bash
# Terminal 1
cd apps/worker && npm run dev

# Terminal 2
cd apps/web && npm run dev
```

Vite proxies `/api` and `/media` to `http://127.0.0.1:8787` automatically (see `apps/web/vite.config.ts`), so you don't need `.env.local` for local dev.

## Troubleshooting

- **`npm install` shows an ERESOLVE peer dependency error**: already handled — `.npmrc` sets `legacy-peer-deps=true` because `react-helmet-async`'s published peer range hasn't caught up to React 19 yet, even though it works fine with it.
- **Wrangler can't find your database/bucket/KV IDs**: double check you replaced all three `REPLACE_WITH_*` placeholders in `wrangler.toml` with real IDs from steps 3–5.
- **CORS errors in the browser console**: confirm `CORS_ALLOWED_ORIGIN` in `wrangler.toml` exactly matches the origin your frontend is actually served from (including `https://` and no trailing slash).

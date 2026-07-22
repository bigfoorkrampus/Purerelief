# Deploy Now — quick start

This zip already has the auth/CSRF/save bugs fixed (see `FIXES_APPLIED.md` for
details) and includes `deploy.sh`, a script that deploys everything and wires
the frontend/API URLs together automatically — no manual copy-pasting of
URLs between config files.

## Prerequisites

- Node.js installed on your machine
- A Cloudflare account (free tier is fine)

## Steps

1. Unzip this project and open a terminal in its root folder.

2. Log in to Cloudflare (opens a browser window):
   ```bash
   npx wrangler login
   ```

3. If you haven't already set your production secrets, do it now (skip if
   you've done this before on this same Cloudflare account/Worker):
   ```bash
   cd apps/worker
   npx wrangler secret put JWT_ACCESS_SECRET
   npx wrangler secret put JWT_REFRESH_SECRET
   npx wrangler secret put ADMIN_SESSION_PEPPER
   cd ../..
   ```
   For each prompt, paste a random string — generate one with:
   ```bash
   openssl rand -hex 32
   ```

4. Run the deploy script:
   ```bash
   bash deploy.sh
   ```

   This will:
   - install dependencies
   - apply database migrations to your production D1 database
   - deploy the Worker (API) and capture its real `.workers.dev` URL
   - build the frontend using that real URL
   - deploy the frontend to Cloudflare Pages and capture its real `.pages.dev` URL
   - update the Worker's CORS setting to match the real frontend URL
   - redeploy the Worker once more so CORS is correct

   At the end it prints your live URLs, e.g.:
   ```
   Frontend / Admin panel: https://pure-relief.pages.dev
   Admin login page:       https://pure-relief.pages.dev/admin/login
   API:                    https://pure-relief-api.<you>.workers.dev
   ```

5. Go to the admin login URL it prints and log in with the seeded owner
   account (`owner@purerelief.co.uk` / `ChangeMe123!`), then **change that
   password immediately** — see `DEPLOYMENT.md` step 13.

6. Try editing and saving something in the admin panel (a product, a nav
   link, site settings). It should now save without logging you out or
   throwing a CSRF error.

## Why saving/login was broken before

Short version: your frontend and API are on two different domains
(`*.pages.dev` and `*.workers.dev`). Browsers block cookies on cross-domain
requests unless those cookies are explicitly marked `SameSite=None; Secure`.
Your login/CSRF cookies were marked `SameSite=Strict`, so the browser silently
refused to send them back to the API on every save — which looked exactly
like "can't save" or "gets logged out." That's fixed in `apps/worker/src/routes/auth.ts`.
Full details, plus 3 other bugs found and fixed, are in `FIXES_APPLIED.md`.

## About "cookie forcing" and using a subdomain instead

Right now cookies use `SameSite=None; Secure` because that's the only way
cookies work when frontend and API are on two unrelated domains
(`pages.dev` vs `workers.dev`). This isn't Cloudflare forcing anything — it's
a browser rule for any two-domain (cross-site) setup, and using two default
`.dev` domains from two different Cloudflare products always creates that
condition.

**If you buy your own domain later** and put both frontend and API on
subdomains of it (e.g. `shop.yourdomain.com` + `api.yourdomain.com`), they
become "same-site" to the browser, and you can switch cookies back to the
simpler `SameSite=Lax` — no special cross-site handling needed. When you're
ready to do that, the changes are:

1. Add your domain to Cloudflare (Websites → Add a site) and update its
   nameservers at your registrar.
2. In Cloudflare Pages → your project → Custom domains, add e.g.
   `shop.yourdomain.com`.
3. In Cloudflare Workers → your worker → Triggers → Custom domains, add e.g.
   `api.yourdomain.com`.
4. Update `apps/worker/wrangler.toml`: set `PUBLIC_SITE_URL` and
   `CORS_ALLOWED_ORIGIN` to `https://shop.yourdomain.com`.
5. Update `apps/web/.env.production`: set `VITE_API_BASE_URL` to
   `https://api.yourdomain.com`.
6. In `apps/worker/src/routes/auth.ts`, change `sameSite = isDev ? 'Lax' :
   'None'` to just always use `'Lax'`, and add `Domain=.yourdomain.com` to
   the cookie attributes so the cookie is shared across both subdomains.
7. Redeploy both (`bash deploy.sh` again works, or do it manually with
   `wrangler deploy` / `wrangler pages deploy`).

Come back and I'll make these exact edits for you once you have the domain
in hand — I didn't want to hardcode a domain you don't own yet.

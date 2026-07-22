#!/usr/bin/env bash
# Pure Relief — one-shot deploy script.
# Run this from the repo root after `wrangler login` has succeeded.
#
# What it does, in order:
#   1. Installs dependencies
#   2. Applies D1 migrations to the REMOTE (production) database
#   3. Deploys the Worker (API) — first pass, so it exists and has a URL
#   4. Builds the frontend pointed at that real Worker URL
#   5. Deploys the frontend to Cloudflare Pages
#   6. Updates wrangler.toml's CORS_ALLOWED_ORIGIN to the real Pages URL
#   7. Redeploys the Worker so CORS matches the real frontend origin
#
# Safe to re-run; it will just redeploy over the same resources.

set -euo pipefail

echo "== 0. Checking wrangler auth =="
npx wrangler whoami || { echo "Run 'npx wrangler login' first, then re-run this script."; exit 1; }

echo "== 1. Installing dependencies =="
npm install

echo "== 2. Applying D1 migrations to remote (production) database =="
cd apps/worker
npx wrangler d1 migrations apply pure_relief_db --remote || echo "  (no new migrations to apply, or already applied — continuing)"
cd ../..

echo "== 3. Deploying Worker (API), first pass =="
cd apps/worker
DEPLOY_OUTPUT=$(npx wrangler deploy 2>&1 | tee /dev/stderr)
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1)
cd ../..

if [ -z "$WORKER_URL" ]; then
  echo "Could not detect Worker URL from deploy output. Check the output above and set VITE_API_BASE_URL manually in apps/web/.env.production, then run steps 4-7 by hand."
  exit 1
fi
echo ">>> Worker deployed at: $WORKER_URL"

echo "== 4. Configuring and building frontend with real API URL =="
cat > apps/web/.env.production <<EOF
VITE_API_BASE_URL=${WORKER_URL}
VITE_PUBLIC_SITE_URL=${WORKER_URL}
EOF

cd apps/web
npm install
npm run build
cd ../..

echo "== 5. Deploying frontend to Cloudflare Pages =="
cd apps/web
PAGES_OUTPUT=$(npx wrangler pages deploy dist --project-name=pure-relief 2>&1 | tee /dev/stderr)
PAGES_URL=$(echo "$PAGES_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' | head -1)
cd ../..

if [ -z "$PAGES_URL" ]; then
  echo "Could not detect Pages URL from deploy output. Check the output above, then manually set CORS_ALLOWED_ORIGIN and PUBLIC_SITE_URL in apps/worker/wrangler.toml to your real Pages URL and run: cd apps/worker && npx wrangler deploy"
  exit 1
fi
echo ">>> Frontend deployed at: $PAGES_URL"

echo "== 6. Updating Worker CORS to match real frontend origin =="
python3 - "$PAGES_URL" <<'PYEOF'
import re, sys
pages_url = sys.argv[1]
path = "apps/worker/wrangler.toml"
with open(path) as f:
    content = f.read()
content = re.sub(r'PUBLIC_SITE_URL = "[^"]*"', f'PUBLIC_SITE_URL = "{pages_url}"', content, count=1)
content = re.sub(r'CORS_ALLOWED_ORIGIN = "[^"]*"', f'CORS_ALLOWED_ORIGIN = "{pages_url}"', content, count=1)
with open(path, "w") as f:
    f.write(content)
print(f"Updated wrangler.toml with PUBLIC_SITE_URL and CORS_ALLOWED_ORIGIN = {pages_url}")
PYEOF

echo "== 7. Redeploying Worker with correct CORS =="
cd apps/worker
npx wrangler deploy
cd ../..

echo ""
echo "======================================================"
echo " DONE"
echo " Frontend / Admin panel: ${PAGES_URL}"
echo " Admin login page:       ${PAGES_URL}/admin/login"
echo " API:                    ${WORKER_URL}"
echo ""
echo " If you haven't set JWT/session secrets yet, run:"
echo "   cd apps/worker"
echo "   npx wrangler secret put JWT_ACCESS_SECRET"
echo "   npx wrangler secret put JWT_REFRESH_SECRET"
echo "   npx wrangler secret put ADMIN_SESSION_PEPPER"
echo " (generate each value with: openssl rand -hex 32)"
echo " Then run this script again so the Worker picks them up."
echo "======================================================"

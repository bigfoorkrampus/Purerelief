# Pure Relief — UK E-commerce Platform

A production-oriented e-commerce platform for Pure Relief's Migraine Relief Cap products, built on React 19 + Vite for the storefront and admin panel, and Cloudflare Workers + D1 + R2 for the backend.

**→ For step-by-step setup, jump straight to [DEPLOYMENT.md](./DEPLOYMENT.md).**

## What's included

- **Storefront** (`apps/web`): Home, Shop, Product, Cart, Checkout, About, FAQ, Blog, Blog Detail, Contact, Privacy, Terms, Refund, Shipping, Cookie Policy, 404 — all with per-page SEO (title/meta/canonical/OG/Twitter/JSON-LD).
- **Admin panel** (`apps/web/src/admin`): Dashboard, Products (with variants, SEO, autosave, bulk actions, CSV import/export), Categories, Media (R2 upload), Blog, Reviews moderation, FAQ, Coupons, Customers, Orders, Site Editor (nav/banner), Settings (analytics IDs), Users & roles.
- **API** (`apps/worker`): Cloudflare Worker on Hono, D1 database, R2 media storage, JWT auth with refresh tokens, CSRF protection, rate limiting, role-based permissions, audit log.
- **Shared types & validation** (`packages/shared`): One set of TypeScript types and Zod schemas used by both frontend and backend, so they can never drift apart.

## What's intentionally NOT included

- **Payment processing.** Checkout creates a real order in `pending_payment` status but does not charge a card. The codebase is structured so a developer can wire Stripe, PayPal, or another UK gateway by adding a payment session call in `apps/worker/src/routes/checkout.ts` and a webhook route to flip the order to `paid`. See the comment block at the bottom of that file.
- **Real product photography.** Every image slot renders a styled placeholder until you upload real photos through the admin Media Library — no frontend code changes needed when you do.
- **Legal review.** The Privacy, Terms, Refund, Shipping, and Cookie Policy pages are solid drafts grounded in real UK consumer law (Consumer Contracts Regulations 2013, Consumer Rights Act 2015, UK GDPR) but should be reviewed by a solicitor before this goes live, especially given the health-adjacent product category.
- **Automated tests.** None are included. Given the scope, adding Vitest + Playwright coverage is a recommended next step before a real launch.

## Architecture at a glance

```
pure-relief/
├── apps/
│   ├── web/          React 19 + Vite storefront and admin SPA
│   └── worker/        Cloudflare Worker API (Hono + D1 + R2)
├── packages/
│   └── shared/         Shared TypeScript types + Zod validation schemas
```

The frontend never talks to D1 or R2 directly — everything goes through the Worker API at `/api/*`, with media served back out at `/media/*`.

## Design system

White base, ink (not pure black) text, blue primary accent, with a "thermal" cyan-to-orange gradient motif used sparingly as the signature visual element — a direct nod to the product's actual cold/hot dual-therapy mechanism rather than a decorative default. No dark mode, per the brief.

## Known limitations to revisit

- The admin CSV product importer creates single-variant draft products only; multi-variant products still need full editing in the UI after import.
- Order status changes are manual (admin-driven) since there's no payment webhook yet to automate `paid` → `fulfilled`.
- The homepage editor's section-builder API exists (`/api/admin/homepage`) but there's no drag-and-drop UI for it yet — sections can be managed via direct API calls or a future admin screen.
- Rate limiting uses a fixed-window KV counter, which is simple and cheap but allows small bursts across window boundaries. Fine for launch; consider a sliding-window approach if abuse becomes an issue.

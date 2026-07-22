import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppContext } from './env';
import { securityHeaders, csrfProtection, maxBodySize } from './middleware/security';
import { ok, fail, HttpError } from './lib/response';

import { productsRouter } from './routes/products';
import { catalogRouter } from './routes/catalog';
import { checkoutRouter } from './routes/checkout';
import { authRouter } from './routes/auth';
import { seoRouter } from './routes/seo';

import { adminProductsRouter } from './routes/admin-products';
import { adminCategoriesRouter, adminMediaRouter, mediaServeRouter } from './routes/admin-catalog';
import { adminBlogRouter } from './routes/admin-blog';
import { adminReviewsRouter, adminFaqRouter, adminCouponsRouter } from './routes/admin-content-ops';
import { adminCustomersRouter, adminOrdersRouter } from './routes/admin-commerce';
import { adminSettingsRouter, adminNavRouter, adminBannerRouter, adminHomepageRouter } from './routes/admin-site-config';
import { adminUsersRouter, adminAuditRouter } from './routes/admin-users';
import { adminDashboardRouter } from './routes/admin-dashboard';

const app = new Hono<AppContext>();

app.use('*', securityHeaders);
app.use('*', maxBodySize(2 * 1024 * 1024)); // 2MB default cap; media upload route overrides this itself
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ALLOWED_ORIGIN;
      if (!origin) return allowed;
      if (origin === allowed) return origin;
      // Allow localhost during local development regardless of configured prod origin.
      if (c.env.ENVIRONMENT === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) return origin;
      return null;
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

// CSRF protection applies only to cookie-authenticated admin mutation routes.
app.use('/api/admin/*', csrfProtection);

// ---- Public storefront API ---------------------------------------------------
app.route('/api/products', productsRouter);
app.route('/api', catalogRouter); // /categories, /blog, /faqs, /site-config, /contact, /newsletter
app.route('/api/checkout', checkoutRouter);
app.route('/api/auth', authRouter);

// ---- SEO (served at root, not under /api, so crawlers hit clean paths) -------
app.route('/', seoRouter);

// ---- Media serving (public reads of uploaded assets) --------------------------
app.route('/media', mediaServeRouter);

// ---- Admin API ------------------------------------------------------------
app.route('/api/admin/products', adminProductsRouter);
app.route('/api/admin/categories', adminCategoriesRouter);
app.route('/api/admin/media', adminMediaRouter);
app.route('/api/admin/blog', adminBlogRouter);
app.route('/api/admin/reviews', adminReviewsRouter);
app.route('/api/admin/faqs', adminFaqRouter);
app.route('/api/admin/coupons', adminCouponsRouter);
app.route('/api/admin/customers', adminCustomersRouter);
app.route('/api/admin/orders', adminOrdersRouter);
app.route('/api/admin/settings', adminSettingsRouter);
app.route('/api/admin/nav', adminNavRouter);
app.route('/api/admin/banner', adminBannerRouter);
app.route('/api/admin/homepage', adminHomepageRouter);
app.route('/api/admin/users', adminUsersRouter);
app.route('/api/admin/audit-log', adminAuditRouter);
app.route('/api/admin/dashboard', adminDashboardRouter);

app.get('/api/health', (c) => ok(c, { status: 'healthy', environment: c.env.ENVIRONMENT, time: new Date().toISOString() }));

app.notFound((c) => fail(c, 404, 'NOT_FOUND', 'This endpoint does not exist.'));

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return fail(c, err.status, err.code, err.message, err.fieldErrors);
  }
  console.error(`[${c.get('requestId')}]`, err);
  return fail(c, 500, 'INTERNAL_ERROR', 'Something went wrong on our end. Please try again.');
});

export default app;

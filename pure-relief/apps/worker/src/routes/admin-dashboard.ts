import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok } from '../lib/response';
import { requireAuth } from '../middleware/auth';

export const adminDashboardRouter = new Hono<AppContext>();
adminDashboardRouter.use('*', requireAuth);

adminDashboardRouter.get('/summary', async (c) => {
  const db = c.env.DB;

  const [productCount, publishedCount, orderStats, pendingReviews, recentOrders, lowStock, customerCount] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as n FROM products WHERE deleted_at IS NULL`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM products WHERE status = 'published' AND deleted_at IS NULL`).first<{ n: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) as order_count, COALESCE(SUM(total_minor), 0) as revenue_minor
         FROM orders WHERE status NOT IN ('cancelled', 'pending_payment') AND created_at >= datetime('now', '-30 days')`,
      )
      .first<{ order_count: number; revenue_minor: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM reviews WHERE status = 'pending'`).first<{ n: number }>(),
    db.prepare(`SELECT id, order_number, customer_email, total_minor, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8`).all(),
    db
      .prepare(
        `SELECT p.name, pv.label, pv.stock_quantity FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.stock_quantity <= 10 AND p.deleted_at IS NULL ORDER BY pv.stock_quantity ASC LIMIT 10`,
      )
      .all(),
    db.prepare(`SELECT COUNT(*) as n FROM customers`).first<{ n: number }>(),
  ]);

  return ok(c, {
    productCount: productCount?.n ?? 0,
    publishedProductCount: publishedCount?.n ?? 0,
    ordersLast30Days: orderStats?.order_count ?? 0,
    revenueLast30DaysMinor: orderStats?.revenue_minor ?? 0,
    pendingReviewCount: pendingReviews?.n ?? 0,
    recentOrders: recentOrders.results,
    lowStockVariants: lowStock.results,
    customerCount: customerCount?.n ?? 0,
  });
});

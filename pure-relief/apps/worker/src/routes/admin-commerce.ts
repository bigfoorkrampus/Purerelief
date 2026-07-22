import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import { listCustomers, getCustomerById, listOrders, getOrderById, updateOrderStatus } from '../lib/repositories/commerce';
import { writeAuditLog } from '../lib/repositories/config';

export const adminCustomersRouter = new Hono<AppContext>();
adminCustomersRouter.use('*', requireAuth, requirePermission('customers.manage'));

adminCustomersRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
  const search = url.searchParams.get('search') ?? undefined;
  return ok(c, await listCustomers(c.env.DB, { page, pageSize, search }));
});

adminCustomersRouter.get('/:id', async (c) => {
  const customer = await getCustomerById(c.env.DB, c.req.param('id'));
  if (!customer) return fail(c, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found.');
  return ok(c, customer);
});

export const adminOrdersRouter = new Hono<AppContext>();
adminOrdersRouter.use('*', requireAuth, requirePermission('orders.manage'));

const VALID_STATUSES = ['pending_payment', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];

adminOrdersRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
  const search = url.searchParams.get('search') ?? undefined;
  const status = (url.searchParams.get('status') ?? undefined) as
    | 'pending_payment' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | undefined;
  return ok(c, await listOrders(c.env.DB, { page, pageSize, search, status }));
});

adminOrdersRouter.get('/:id', async (c) => {
  const order = await getOrderById(c.env.DB, c.req.param('id'));
  if (!order) return fail(c, 404, 'ORDER_NOT_FOUND', 'Order not found.');
  return ok(c, order);
});

adminOrdersRouter.post('/:id/status', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return fail(c, 400, 'INVALID_STATUS', 'Provide a valid order status.');
  }
  await updateOrderStatus(c.env.DB, c.req.param('id'), body.status);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'status_update', entityType: 'order', entityId: c.req.param('id'), diff: { status: body.status } });
  return ok(c, { updated: true });
});

/** CSV export of orders for accounting / fulfillment handoff. */
adminOrdersRouter.get('/export/csv', async (c) => {
  const { items } = await listOrders(c.env.DB, { page: 1, pageSize: 10_000 });
  const header = 'order_number,customer_email,status,total_minor,created_at\n';
  const rows = items.map((o) => [o.orderNumber, o.customerEmail, o.status, o.total.amountMinor, o.createdAt].join(',')).join('\n');
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="pure-relief-orders.csv"');
  return c.body(header + rows);
});

import type { Customer, Order, OrderStatus, Address, Paginated } from '@pure-relief/shared';
import { generateId } from '../crypto';

// ============================================================================
// Customers
// ============================================================================

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  default_address_json: string | null;
  marketing_opt_in: number;
  created_at: string;
};

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    defaultAddress: row.default_address_json ? JSON.parse(row.default_address_json) : null,
    marketingOptIn: Boolean(row.marketing_opt_in),
    createdAt: row.created_at,
  };
}

export async function findOrCreateCustomer(
  db: D1Database,
  input: { email: string; fullName: string; phone?: string | null; address?: Address; marketingOptIn?: boolean },
): Promise<Customer> {
  const existing = await db.prepare(`SELECT * FROM customers WHERE email = ?`).bind(input.email).first<CustomerRow>();
  if (existing) return mapCustomer(existing);

  const id = generateId('cust');
  await db
    .prepare(
      `INSERT INTO customers (id, email, full_name, phone, default_address_json, marketing_opt_in)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.email, input.fullName, input.phone ?? null, input.address ? JSON.stringify(input.address) : null, input.marketingOptIn ? 1 : 0)
    .run();

  return {
    id,
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? null,
    defaultAddress: input.address ?? null,
    marketingOptIn: Boolean(input.marketingOptIn),
    createdAt: new Date().toISOString(),
  };
}

export async function listCustomers(
  db: D1Database,
  params: { page: number; pageSize: number; search?: string },
): Promise<Paginated<Customer>> {
  const where = params.search ? `WHERE email LIKE ? OR full_name LIKE ?` : '';
  const bindings = params.search ? [`%${params.search}%`, `%${params.search}%`] : [];
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM customers ${where}`).bind(...bindings).first<{ total: number }>();
  const offset = (params.page - 1) * params.pageSize;
  const rows = await db
    .prepare(`SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, params.pageSize, offset)
    .all<CustomerRow>();
  return { items: rows.results.map(mapCustomer), total: countRow?.total ?? 0, page: params.page, pageSize: params.pageSize };
}

export async function getCustomerById(db: D1Database, id: string): Promise<Customer | null> {
  const row = await db.prepare(`SELECT * FROM customers WHERE id = ?`).bind(id).first<CustomerRow>();
  return row ? mapCustomer(row) : null;
}

// ============================================================================
// Orders
// ============================================================================

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_email: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  total_minor: number;
  coupon_code: string | null;
  shipping_address_json: string;
  billing_address_json: string;
  status: OrderStatus;
  payment_provider: string;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

async function mapOrder(db: D1Database, row: OrderRow): Promise<Order> {
  const items = await db
    .prepare(
      `SELECT product_id, variant_id, name_snapshot, variant_label_snapshot, unit_price_minor, quantity
       FROM order_line_items WHERE order_id = ?`,
    )
    .bind(row.id)
    .all<{
      product_id: string | null;
      variant_id: string | null;
      name_snapshot: string;
      variant_label_snapshot: string;
      unit_price_minor: number;
      quantity: number;
    }>();

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerEmail: row.customer_email,
    lineItems: items.results.map((i) => ({
      productId: i.product_id ?? '',
      variantId: i.variant_id ?? '',
      nameSnapshot: i.name_snapshot,
      variantLabelSnapshot: i.variant_label_snapshot,
      unitPrice: { amountMinor: i.unit_price_minor, currency: 'GBP' },
      quantity: i.quantity,
    })),
    subtotal: { amountMinor: row.subtotal_minor, currency: 'GBP' },
    discount: { amountMinor: row.discount_minor, currency: 'GBP' },
    shipping: { amountMinor: row.shipping_minor, currency: 'GBP' },
    total: { amountMinor: row.total_minor, currency: 'GBP' },
    couponCode: row.coupon_code,
    shippingAddress: JSON.parse(row.shipping_address_json),
    billingAddress: JSON.parse(row.billing_address_json),
    status: row.status,
    paymentProvider: row.payment_provider as Order['paymentProvider'],
    paymentReference: row.payment_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PR-${timestamp}-${rand}`;
}

export type CreateOrderInput = {
  customerId: string | null;
  customerEmail: string;
  lineItems: { productId: string; variantId: string; nameSnapshot: string; variantLabelSnapshot: string; unitPriceMinor: number; quantity: number }[];
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
  couponCode?: string | null;
  shippingAddress: Address;
  billingAddress: Address;
};

/**
 * BUG FIX (order integrity): checkout could confirm an order with zero
 * line items.
 *
 * Previously the parent `orders` row was inserted with its own .run()
 * call, then line items were inserted in a *separate* db.batch()
 * afterward. If the line-item batch failed (bad payload, transient D1
 * error, an unusually large cart), the order row had already committed —
 * generating a real order number and confirming checkout to the customer
 * for an order containing nothing.
 *
 * Fix: insert the order and every line item in a single db.batch() call,
 * so the order only exists if all of its line items do too.
 */
export async function createOrder(db: D1Database, input: CreateOrderInput): Promise<Order> {
  const id = generateId('order');
  const orderNumber = generateOrderNumber();

  const insertOrder = db
    .prepare(
      `INSERT INTO orders
        (id, order_number, customer_id, customer_email, subtotal_minor, discount_minor, shipping_minor, total_minor,
         coupon_code, shipping_address_json, billing_address_json, status, payment_provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'unassigned')`,
    )
    .bind(
      id,
      orderNumber,
      input.customerId,
      input.customerEmail,
      input.subtotalMinor,
      input.discountMinor,
      input.shippingMinor,
      input.totalMinor,
      input.couponCode ?? null,
      JSON.stringify(input.shippingAddress),
      JSON.stringify(input.billingAddress),
    );

  const lineItemStatements = input.lineItems.map((item) =>
    db
      .prepare(
        `INSERT INTO order_line_items (id, order_id, product_id, variant_id, name_snapshot, variant_label_snapshot, unit_price_minor, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(generateId('li'), id, item.productId, item.variantId, item.nameSnapshot, item.variantLabelSnapshot, item.unitPriceMinor, item.quantity),
  );

  await db.batch([insertOrder, ...lineItemStatements]);

  const row = await db.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first<OrderRow>();
  if (!row) throw new Error('Order creation failed');
  return mapOrder(db, row);
}

export async function listOrders(
  db: D1Database,
  params: { page: number; pageSize: number; status?: OrderStatus; search?: string },
): Promise<Paginated<Order>> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (params.status) {
    conditions.push('status = ?');
    bindings.push(params.status);
  }
  if (params.search) {
    conditions.push('(order_number LIKE ? OR customer_email LIKE ?)');
    bindings.push(`%${params.search}%`, `%${params.search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM orders ${where}`).bind(...bindings).first<{ total: number }>();
  const offset = (params.page - 1) * params.pageSize;
  const rows = await db
    .prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, params.pageSize, offset)
    .all<OrderRow>();
  const items = await Promise.all(rows.results.map((row) => mapOrder(db, row)));
  return { items, total: countRow?.total ?? 0, page: params.page, pageSize: params.pageSize };
}

export async function getOrderById(db: D1Database, id: string): Promise<Order | null> {
  const row = await db.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first<OrderRow>();
  return row ? mapOrder(db, row) : null;
}

export async function updateOrderStatus(db: D1Database, id: string, status: OrderStatus): Promise<void> {
  await db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), id).run();
}

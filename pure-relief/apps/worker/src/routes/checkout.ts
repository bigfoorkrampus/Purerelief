import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { checkoutSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { getProductById } from '../lib/repositories/products';
import { getCouponByCode } from '../lib/repositories/content';
import { createOrder } from '../lib/repositories/commerce';
import { findOrCreateCustomer } from '../lib/repositories/commerce';
import { rateLimit } from '../middleware/rate-limit';

export const checkoutRouter = new Hono<AppContext>();

const FLAT_SHIPPING_MINOR = 0; // free UK shipping by default; adjust via admin settings in a future pass

type CartLineInput = { productId: string; variantId: string; quantity: number };

checkoutRouter.post('/', rateLimit({ bucket: 'checkout', limit: 10, windowSeconds: 600 }), async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return fail(c, 400, 'EMPTY_CART', 'Your cart is empty.');
  }

  const parsedForm = checkoutSchema.safeParse(body);
  if (!parsedForm.success) {
    return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsedForm.error));
  }

  const cartItems = body.items as CartLineInput[];
  const db = c.env.DB;

  // Re-price every line server-side from D1 — never trust client-submitted prices.
  const lineItems: {
    productId: string;
    variantId: string;
    nameSnapshot: string;
    variantLabelSnapshot: string;
    unitPriceMinor: number;
    quantity: number;
  }[] = [];

  for (const item of cartItems) {
    if (!item.productId || !item.variantId || !item.quantity || item.quantity < 1) {
      return fail(c, 400, 'INVALID_CART_ITEM', 'One of the items in your cart is invalid.');
    }
    const product = await getProductById(db, item.productId);
    if (!product || product.status !== 'published') {
      return fail(c, 409, 'PRODUCT_UNAVAILABLE', 'One of the items in your cart is no longer available.');
    }
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      return fail(c, 409, 'VARIANT_UNAVAILABLE', 'One of the selected options is no longer available.');
    }
    if (variant.stockQuantity < item.quantity) {
      return fail(c, 409, 'OUT_OF_STOCK', `Only ${variant.stockQuantity} left of "${product.name} — ${variant.label}".`);
    }
    lineItems.push({
      productId: product.id,
      variantId: variant.id,
      nameSnapshot: product.name,
      variantLabelSnapshot: variant.label,
      unitPriceMinor: variant.price.amountMinor,
      quantity: item.quantity,
    });
  }

  const subtotalMinor = lineItems.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0);

  let discountMinor = 0;
  const couponCode = parsedForm.data.couponCode?.trim();
  if (couponCode) {
    const coupon = await getCouponByCode(db, couponCode);
    if (!coupon || !coupon.active) {
      return fail(c, 400, 'INVALID_COUPON', 'That coupon code is not valid.');
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return fail(c, 400, 'COUPON_EXPIRED', 'That coupon code has expired.');
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return fail(c, 400, 'COUPON_LIMIT_REACHED', 'That coupon code is no longer available.');
    }
    if (coupon.minSpendMinor != null && subtotalMinor < coupon.minSpendMinor) {
      return fail(c, 400, 'COUPON_MIN_SPEND', `Spend at least £${(coupon.minSpendMinor / 100).toFixed(2)} to use this code.`);
    }
    discountMinor = coupon.type === 'percentage' ? Math.round(subtotalMinor * (coupon.value / 100)) : Math.round(coupon.value * 100);
    discountMinor = Math.min(discountMinor, subtotalMinor);
  }

  const shippingMinor = FLAT_SHIPPING_MINOR;
  const totalMinor = subtotalMinor - discountMinor + shippingMinor;

  const billingAddress = parsedForm.data.billingAddressSameAsShipping
    ? parsedForm.data.shippingAddress
    : parsedForm.data.billingAddress ?? parsedForm.data.shippingAddress;

  const customer = await findOrCreateCustomer(db, {
    email: parsedForm.data.email,
    fullName: parsedForm.data.shippingAddress.fullName,
    phone: parsedForm.data.shippingAddress.phone,
    address: parsedForm.data.shippingAddress,
    marketingOptIn: parsedForm.data.marketingOptIn,
  });

  const order = await createOrder(db, {
    customerId: customer.id,
    customerEmail: parsedForm.data.email,
    lineItems,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    totalMinor,
    couponCode: couponCode || null,
    shippingAddress: parsedForm.data.shippingAddress,
    billingAddress,
  });

  // NOTE: Order is created in `pending_payment` status. Wiring a payment provider
  // (Stripe/PayPal/other UK gateway) means: create a payment session here using
  // `order.id` and `order.total` as reference, then flip status to `paid` from
  // that provider's webhook handler (add a new route under /api/webhooks/*).
  // No payment integration is implemented in this build per project spec.

  return ok(c, order, 201);
});

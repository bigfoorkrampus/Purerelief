import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, Tag } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { Seo } from '@/components/Seo';
import { useCartStore } from '@/store/cart-store';
import { api } from '@/lib/api-client';
import { ProductMedia } from '@/components/ProductMedia';
import { formatMoneyMinor } from '@/lib/format';
import type { Product } from '@pure-relief/shared';

export function CartPage() {
  const { items, removeItem, updateQuantity, couponCode, setCouponCode } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode ?? '');

  const productQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ['product-by-id', item.productId],
      queryFn: () => api.get<Product>(`/api/products/by-id/${item.productId}`),
      staleTime: 60_000,
    })),
  });

  const isLoading = productQueries.some((q) => q.isLoading);
  const lineItems = items
    .map((item, i) => {
      const product = productQueries[i]?.data;
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!product || !variant) return null;
      return { item, product, variant };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotalMinor = lineItems.reduce((sum, li) => sum + li.variant.price.amountMinor * li.item.quantity, 0);

  if (!isLoading && items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink">Your cart is empty</h1>
        <p className="mt-3 text-ink-soft">Add a Migraine Relief Cap to get started.</p>
        <Link to="/shop" className="btn-primary mt-8 inline-flex">
          Shop Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <Seo title="Your Cart" description="Review your Pure Relief order before checkout." canonicalPath="/cart" noIndex />

      <div className="container-page py-12 lg:py-16">
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">Your Cart</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {isLoading
              ? [...Array(items.length)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)
              : lineItems.map(({ item, product, variant }) => (
                  <div key={item.variantId} className="card-surface flex gap-4 p-4">
                    <div className="media-placeholder h-24 w-24 shrink-0 rounded-xl">
                      <ProductMedia image={product.images[0]} className="h-full w-full rounded-xl object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link to={`/product/${product.slug}`} className="font-semibold text-ink hover:text-brand-600">
                          {product.name}
                        </Link>
                        <p className="text-sm text-ink-soft">{variant.label}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-xl border border-slate-200">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-semibold text-ink">{formatMoneyMinor(variant.price.amountMinor * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="self-start text-slate-300 hover:text-red-500"
                      aria-label={`Remove ${product.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card-surface sticky top-24 p-6">
              <h2 className="font-semibold text-ink">Order Summary</h2>

              <div className="mt-4">
                <label htmlFor="coupon" className="sr-only">Coupon code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon code"
                      className="input-field pl-10"
                    />
                  </div>
                  <button onClick={() => setCouponCode(couponInput || null)} className="btn-secondary px-4">
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Subtotal</span>
                  <span className="font-medium text-ink">{formatMoneyMinor(subtotalMinor)}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>Shipping</span>
                  <span className="font-medium text-success-500">Free</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
                <span className="font-semibold text-ink">Total</span>
                <span className="text-lg font-bold text-ink">{formatMoneyMinor(subtotalMinor)}</span>
              </div>

              <Link to="/checkout" className="btn-primary mt-6 w-full">
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

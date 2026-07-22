import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutFormValues } from '@pure-relief/shared';
import { Seo } from '@/components/Seo';
import { useCartStore } from '@/store/cart-store';
import { api, ApiClientError } from '@/lib/api-client';
import { formatMoneyMinor } from '@/lib/format';
import { Lock } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, couponCode, clear } = useCartStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      billingAddressSameAsShipping: true,
      marketingOptIn: false,
      couponCode: couponCode ?? '',
      shippingAddress: { country: 'United Kingdom' },
    },
  });

  const billingSame = watch('billingAddressSameAsShipping');

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const order = await api.post<{ id: string; orderNumber: string }>('/api/checkout', {
        ...values,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      });
      clear();
      navigate(`/order-confirmation/${order.orderNumber}`);
    } catch (err) {
      if (err instanceof ApiClientError) setServerError(err.message);
      else setServerError('Something went wrong placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink">Your cart is empty</h1>
        <p className="mt-3 text-ink-soft">Add a product before checking out.</p>
      </div>
    );
  }

  return (
    <>
      <Seo title="Checkout" description="Complete your Pure Relief order." canonicalPath="/checkout" noIndex />

      <div className="container-page py-12 lg:py-16">
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 max-w-2xl space-y-8">
          {serverError && (
            <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{serverError}</div>
          )}

          <section>
            <h2 className="font-semibold text-ink">Contact</h2>
            <div className="mt-4">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <input id="email" type="email" {...register('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="field-error-text">{errors.email.message}</p>}
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-ink">Shipping Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.shippingAddress?.fullName?.message}>
                <input {...register('shippingAddress.fullName')} className="input-field" />
              </Field>
              <Field label="Phone" error={errors.shippingAddress?.phone?.message}>
                <input {...register('shippingAddress.phone')} className="input-field" placeholder="+44 7…" />
              </Field>
              <Field label="Address line 1" error={errors.shippingAddress?.line1?.message} full>
                <input {...register('shippingAddress.line1')} className="input-field" />
              </Field>
              <Field label="Address line 2 (optional)" full>
                <input {...register('shippingAddress.line2')} className="input-field" />
              </Field>
              <Field label="Town / City" error={errors.shippingAddress?.city?.message}>
                <input {...register('shippingAddress.city')} className="input-field" />
              </Field>
              <Field label="Postcode" error={errors.shippingAddress?.postcode?.message}>
                <input {...register('shippingAddress.postcode')} className="input-field" />
              </Field>
            </div>
          </section>

          <section>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" {...register('billingAddressSameAsShipping')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-sm font-medium text-ink">Billing address same as shipping</span>
            </label>
          </section>

          {!billingSame && (
            <section>
              <h2 className="font-semibold text-ink">Billing Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.billingAddress?.fullName?.message}>
                  <input {...register('billingAddress.fullName')} className="input-field" />
                </Field>
                <Field label="Phone" error={errors.billingAddress?.phone?.message}>
                  <input {...register('billingAddress.phone')} className="input-field" />
                </Field>
                <Field label="Address line 1" error={errors.billingAddress?.line1?.message} full>
                  <input {...register('billingAddress.line1')} className="input-field" />
                </Field>
                <Field label="Town / City" error={errors.billingAddress?.city?.message}>
                  <input {...register('billingAddress.city')} className="input-field" />
                </Field>
                <Field label="Postcode" error={errors.billingAddress?.postcode?.message}>
                  <input {...register('billingAddress.postcode')} className="input-field" />
                </Field>
              </div>
            </section>
          )}

          <label className="flex items-center gap-2.5">
            <input type="checkbox" {...register('marketingOptIn')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-ink-soft">Send me offers and wellness tips by email</span>
          </label>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-surface-tint px-5 py-4 text-sm text-ink-soft">
            <Lock className="mb-1 h-4 w-4 text-brand-600" />
            Payment collection isn't enabled on this build yet — placing an order records it for fulfilment without
            charging a card. Ask your developer to connect Stripe, PayPal, or another UK gateway before launch.
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Placing order…' : 'Place Order'}
          </button>
        </form>
      </div>
    </>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

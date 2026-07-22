import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Seo } from '@/components/Seo';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <>
      <Seo title="Order Confirmed" description="Your Pure Relief order has been placed." canonicalPath="/order-confirmation" noIndex />
      <div className="container-page flex flex-col items-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">Order Confirmed</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Thank you! Your order <span className="font-semibold text-ink">{orderNumber}</span> has been received and is
          being prepared for dispatch. You'll get a confirmation email shortly.
        </p>
        <Link to="/shop" className="btn-primary mt-8">Continue Shopping</Link>
      </div>
    </>
  );
}

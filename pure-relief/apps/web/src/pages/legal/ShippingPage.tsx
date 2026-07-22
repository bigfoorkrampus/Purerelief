import { LegalPageLayout } from '@/components/LegalPageLayout';

export function ShippingPage() {
  return (
    <LegalPageLayout
      title="Shipping Policy"
      description="Delivery times, costs, and coverage for Pure Relief orders across the United Kingdom."
      canonicalPath="/shipping"
      lastUpdated="21 July 2026"
    >
      <h2>Delivery areas</h2>
      <p>We currently ship to addresses across the United Kingdom, including England, Scotland, Wales, and Northern Ireland.</p>

      <h2>Delivery times</h2>
      <ul>
        <li>Standard delivery: 2–4 working days</li>
        <li>Orders placed before 2pm on a working day are typically dispatched the same day</li>
        <li>Orders placed on weekends or bank holidays are dispatched the next working day</li>
      </ul>

      <h2>Delivery costs</h2>
      <p>
        We offer free standard UK delivery on all combo pack orders. Delivery costs for single-item orders, if any,
        are shown at checkout before you complete your purchase.
      </p>

      <h2>Tracking your order</h2>
      <p>
        Once your order has been dispatched, you'll receive a confirmation email with tracking information where
        available.
      </p>

      <h2>Delayed or missing deliveries</h2>
      <p>
        If your order hasn't arrived within the expected timeframe, please contact us via our Contact page with your
        order number, and we'll investigate with our courier.
      </p>
    </LegalPageLayout>
  );
}

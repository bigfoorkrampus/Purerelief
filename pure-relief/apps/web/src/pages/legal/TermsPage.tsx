import { LegalPageLayout } from '@/components/LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="The terms and conditions governing your use of the Pure Relief website and purchase of our products."
      canonicalPath="/terms"
      lastUpdated="21 July 2026"
    >
      <p>
        These terms govern your use of the Pure Relief website and any purchases made through it. By placing an
        order, you agree to be bound by these terms.
      </p>

      <h2>1. About us</h2>
      <p>Pure Relief sells reusable wellness products, including the Migraine Relief Cap, to customers in the United Kingdom.</p>

      <h2>2. Product information</h2>
      <p>
        We make reasonable efforts to ensure product descriptions, images, and pricing are accurate. Our products are
        intended for general self-care and are not medical devices; they are not intended to diagnose, treat, cure,
        or prevent any disease. Always consult a GP or qualified healthcare professional for medical advice.
      </p>

      <h2>3. Orders and payment</h2>
      <p>
        Placing an order constitutes an offer to purchase, which we may accept or decline. Prices are shown in GBP and
        include VAT where applicable. Payment is processed securely by our payment provider at checkout.
      </p>

      <h2>4. Delivery</h2>
      <p>
        See our <a href="/shipping">Shipping Policy</a> for estimated delivery times and costs. Risk in the goods
        passes to you on delivery.
      </p>

      <h2>5. Cancellations and returns</h2>
      <p>
        As a UK consumer, you have a legal right to cancel your order within 14 days of receipt under the Consumer
        Contracts Regulations 2013, without giving a reason. See our <a href="/refund-policy">Refund Policy</a> for
        full details on how to return an item and receive a refund.
      </p>

      <h2>6. Product safety and usage</h2>
      <p>
        You must follow the usage instructions provided with each product, including recommended cooling/heating
        durations and skin contact time limits. We are not liable for injury or damage resulting from misuse.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect or consequential loss arising from
        your use of our products or website. Nothing in these terms excludes or limits liability for death or
        personal injury caused by negligence, fraud, or any liability that cannot be excluded under English law.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        All content on this site, including text, images, logos, and design, is owned by or licensed to Pure Relief
        and may not be used without permission.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of England and Wales, and any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

      <h2>10. Contact</h2>
      <p>Questions about these terms can be sent via our Contact page.</p>

      <p className="mt-10 rounded-2xl bg-surface-tint p-5 text-sm">
        This is a draft terms template and should be reviewed by a qualified solicitor before publication.
      </p>
    </LegalPageLayout>
  );
}

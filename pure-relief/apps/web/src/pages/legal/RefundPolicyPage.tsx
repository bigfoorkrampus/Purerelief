import { LegalPageLayout } from '@/components/LegalPageLayout';

export function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      description="Our returns and refund process, in line with UK Consumer Contracts Regulations."
      canonicalPath="/refund-policy"
      lastUpdated="21 July 2026"
    >
      <h2>Your right to cancel</h2>
      <p>
        Under the Consumer Contracts Regulations 2013, you have the right to cancel your order within 14 days of
        receiving your item, without giving a reason. To exercise this right, contact us within that window via our{' '}
        <a href="/contact">Contact page</a>.
      </p>

      <h2>Returning an item</h2>
      <ul>
        <li>Items must be returned unused, in their original packaging, within 14 days of your cancellation notice</li>
        <li>For hygiene reasons, products that have been used against the skin cannot be returned unless faulty</li>
        <li>You are responsible for return postage costs unless the item is faulty or not as described</li>
      </ul>

      <h2>Faulty or damaged items</h2>
      <p>
        If your item arrives faulty, damaged, or not as described, contact us immediately with photos and your order
        number. We'll arrange a replacement or full refund, including reasonable return postage costs, in line with
        your rights under the Consumer Rights Act 2015.
      </p>

      <h2>Refund timing</h2>
      <p>
        Once we receive and inspect your return, we'll process your refund within 14 days to your original payment
        method. You'll receive an email confirmation once the refund has been issued.
      </p>

      <h2>Non-refundable items</h2>
      <p>
        Gift cards and personalised or hygiene-sealed items that have been opened are not eligible for return unless
        faulty.
      </p>

      <h2>Questions</h2>
      <p>If you have any questions about a return or refund, reach out via our Contact page and we'll help promptly.</p>
    </LegalPageLayout>
  );
}

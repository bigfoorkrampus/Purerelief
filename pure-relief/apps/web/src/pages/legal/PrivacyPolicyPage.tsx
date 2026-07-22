import { LegalPageLayout } from '@/components/LegalPageLayout';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How Pure Relief collects, uses, and protects your personal data in line with UK GDPR."
      canonicalPath="/privacy"
      lastUpdated="21 July 2026"
    >
      <p>
        Pure Relief ("we", "us", "our") is committed to protecting your privacy. This policy explains what personal
        data we collect, how we use it, and your rights under the UK General Data Protection Regulation (UK GDPR) and
        the Data Protection Act 2018.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Contact details you provide (name, email, phone number, delivery address) when placing an order or contacting us</li>
        <li>Order and payment history (payment card details are processed by our payment provider and never stored on our servers)</li>
        <li>Account information if you create a customer account</li>
        <li>Technical data such as IP address, browser type, and pages visited, collected via cookies and analytics tools</li>
        <li>Marketing preferences, where you've opted in to receive communications from us</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To process and fulfil your orders, including delivery and customer service</li>
        <li>To communicate with you about your order, account, or enquiries</li>
        <li>To send marketing communications, where you've given consent, which you can withdraw at any time</li>
        <li>To improve our website, products, and services</li>
        <li>To comply with our legal obligations, including tax and accounting requirements</li>
      </ul>

      <h2>3. Legal basis for processing</h2>
      <p>
        We rely on the following legal bases: performance of a contract (processing your order), legitimate interests
        (improving our services, preventing fraud), consent (marketing communications), and legal obligation (record
        keeping for tax purposes).
      </p>

      <h2>4. Sharing your information</h2>
      <p>
        We share data with trusted third parties only as needed to run our business: delivery couriers, payment
        processors, IT and hosting providers, and, where required, HMRC or other regulators. We do not sell your
        personal data to third parties.
      </p>

      <h2>5. International transfers</h2>
      <p>
        Some of our service providers may process data outside the UK. Where this occurs, we ensure appropriate
        safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain personal data only as long as necessary for the purposes described above, including to satisfy
        legal, accounting, or reporting requirements. Order records are typically retained for at least six years to
        comply with UK tax law.
      </p>

      <h2>7. Your rights</h2>
      <p>Under UK GDPR, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request erasure of your data, subject to legal exceptions</li>
        <li>Object to or restrict certain processing</li>
        <li>Request data portability</li>
        <li>Withdraw consent at any time where processing is based on consent</li>
      </ul>
      <p>
        To exercise any of these rights, contact us using the details on our <a href="/contact">Contact page</a>. You
        also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use cookies and similar technologies to operate our site and understand how it's used. See our{' '}
        <a href="/cookie-policy">Cookie Policy</a> for full details.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the date above.</p>

      <h2>10. Contact us</h2>
      <p>If you have questions about this policy or how we handle your data, please get in touch via our Contact page.</p>

      <p className="mt-10 rounded-2xl bg-surface-tint p-5 text-sm">
        This is a draft policy template and should be reviewed by a qualified solicitor before publication, to ensure
        it accurately reflects your actual data processing activities and complies with current UK law.
      </p>
    </LegalPageLayout>
  );
}

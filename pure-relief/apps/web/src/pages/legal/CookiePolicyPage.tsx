import { LegalPageLayout } from '@/components/LegalPageLayout';

export function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="How Pure Relief uses cookies and similar technologies on our website."
      canonicalPath="/cookie-policy"
      lastUpdated="21 July 2026"
    >
      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site function
        properly and allow us to understand how visitors use it.
      </p>

      <h2>Cookies we use</h2>
      <ul>
        <li><strong>Strictly necessary cookies</strong> — required for core functionality like your shopping cart and secure checkout. These cannot be disabled.</li>
        <li><strong>Analytics cookies</strong> — help us understand site usage (e.g. Google Analytics), so we can improve the experience. Used only with your consent.</li>
        <li><strong>Preference cookies</strong> — remember choices you've made, such as items in your cart.</li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        You can control or delete cookies through your browser settings at any time. Note that disabling strictly
        necessary cookies may affect core site functionality, such as checkout.
      </p>

      <h2>Third-party cookies</h2>
      <p>
        Some cookies are set by third-party services we use, such as analytics providers. We don't control these
        cookies directly — please refer to the relevant third party's own cookie policy for details.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy periodically to reflect changes in the cookies we use or for legal reasons.</p>
    </LegalPageLayout>
  );
}

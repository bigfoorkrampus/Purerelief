import { Link } from 'react-router-dom';
import { useSiteConfig } from '@/hooks/use-storefront';

const FOOTER_COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { label: 'All Products', href: '/shop' },
      { label: 'Single Cap', href: '/product/migraine-relief-cap-single' },
      { label: 'Double Combo Pack', href: '/product/migraine-relief-cap-double' },
      { label: 'Triple Combo Pack', href: '/product/migraine-relief-cap-triple' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
];

export function SiteFooter() {
  const { data: config } = useSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-surface-tint">
      <div className="container-page py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-cold-500 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2 8 9h8l-4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="font-display text-[19px] font-extrabold tracking-tighter">Pure.Relief</span>
            </Link>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ink-soft">
              Drug-free cold and hot therapy for migraines, headaches, and everyday tension. Designed for the UK.
            </p>
            <p className="mt-6 text-sm text-ink-soft">
              <a href={`mailto:${config?.settings.contactEmail ?? 'hello@purerelief.co.uk'}`} className="hover:text-brand-600">
                {config?.settings.contactEmail ?? 'hello@purerelief.co.uk'}
              </a>
              <br />
              <a href={`tel:${(config?.settings.supportPhone ?? '+44 7440 056021').replace(/\s/g, '')}`} className="hover:text-brand-600">
                {config?.settings.supportPhone ?? '+44 7440 056021'}
              </a>
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-[14.5px] text-ink-soft transition-colors hover:text-brand-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-sm text-ink-soft">© {year} Pure Relief. All rights reserved.</p>
          <p className="text-xs text-ink-soft/70 text-center sm:text-right max-w-md">
            Information on this site is for general guidance only and is not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

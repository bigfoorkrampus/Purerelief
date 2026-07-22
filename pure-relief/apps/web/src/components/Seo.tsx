import { Helmet } from 'react-helmet-async';

type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  type?: 'website' | 'article' | 'product';
};

const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'https://purerelief.co.uk';
const SITE_NAME = 'Pure Relief';

export function Seo({ title, description, canonicalPath, ogImageUrl, noIndex, jsonLd, type = 'website' }: SeoProps) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}

      <meta name="twitter:card" content={ogImageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export function organizationJsonLd(settings: { siteName: string; contactEmail: string; supportPhone: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.supportPhone,
      email: settings.contactEmail,
      contactType: 'customer service',
      areaServed: 'GB',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  images: { r2Key: string }[];
  variants: { price: { amountMinor: number }; stockQuantity: number; sku: string }[];
  avgRating: number;
  reviewCount: number;
}) {
  const cheapestVariant = product.variants.reduce((min, v) => (v.price.amountMinor < min.price.amountMinor ? v : min), product.variants[0]!);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: cheapestVariant.sku,
    offers: product.variants.map((v) => ({
      '@type': 'Offer',
      priceCurrency: 'GBP',
      price: (v.price.amountMinor / 100).toFixed(2),
      availability: v.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/product/${product.slug}`,
    })),
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}

export function faqJsonLd(entries: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

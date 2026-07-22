import { Hono } from 'hono';
import type { AppContext } from '../env';

export const seoRouter = new Hono<AppContext>();

seoRouter.get('/robots.txt', async (c) => {
  const siteUrl = c.env.PUBLIC_SITE_URL;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /cart',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n');
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.body(body);
});

seoRouter.get('/sitemap.xml', async (c) => {
  const siteUrl = c.env.PUBLIC_SITE_URL;
  const db = c.env.DB;

  const [products, categories, posts] = await Promise.all([
    db.prepare(`SELECT slug, updated_at FROM products WHERE status = 'published' AND deleted_at IS NULL`).all<{ slug: string; updated_at: string }>(),
    db.prepare(`SELECT slug FROM categories`).all<{ slug: string }>(),
    db.prepare(`SELECT slug, updated_at FROM blog_posts WHERE status = 'published'`).all<{ slug: string; updated_at: string }>(),
  ]);

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/shop', priority: '0.9', changefreq: 'daily' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
    { path: '/blog', priority: '0.7', changefreq: 'daily' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
    { path: '/terms', priority: '0.2', changefreq: 'yearly' },
    { path: '/refund-policy', priority: '0.2', changefreq: 'yearly' },
    { path: '/shipping', priority: '0.2', changefreq: 'yearly' },
    { path: '/cookie-policy', priority: '0.2', changefreq: 'yearly' },
  ];

  const urlEntries = [
    ...staticPages.map((p) => `<url><loc>${siteUrl}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`),
    ...products.results.map(
      (p) => `<url><loc>${siteUrl}/product/${p.slug}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
    ...categories.results.map((cat) => `<url><loc>${siteUrl}/shop/${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    ...posts.results.map(
      (p) => `<url><loc>${siteUrl}/blog/${p.slug}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;

  c.header('Content-Type', 'application/xml; charset=utf-8');
  return c.body(xml);
});

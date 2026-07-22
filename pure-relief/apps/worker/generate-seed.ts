// Run with: npx tsx generate-seed.ts   (or ts-node)
// Produces seed.sql, which is then applied with:
//   npm run db:seed:local  /  npm run db:seed:remote
//
// This generates real product data from the client's provided copy (the
// Migraine Relief Cap technical report) rather than throwaway lorem-ipsum
// placeholders, so the storefront looks correct the moment it's deployed.

import { writeFileSync } from 'node:fs';

function id(prefix: string, n: number): string {
  return `${prefix}_seed_${n.toString().padStart(3, '0')}`;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const now = new Date().toISOString();

const shortDescription =
  'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blocking comfort.';

const descriptionHtml = `
<p>The Pure Relief Migraine Relief Cap combines medical-grade cold therapy with gentle, continuous compression, engineered to conform precisely to the anatomical structures of the skull. Slide it on for targeted, non-invasive relief for migraines, tension headaches, sinus pressure, and hormonal headaches.</p>
<p>Freeze it for up to 45 minutes of vasoconstrictive cooling relief, or microwave it for soothing heat that relaxes tight muscles in the neck, temples, and scalp. The thick, light-blocking fabric doubles as a sleep mask, helping calm photophobia during an attack.</p>
<p>This product is for informational and self-care purposes only and is not a substitute for professional medical advice. If headaches become more frequent, more severe, or require painkillers more than twice a week, consult a GP.</p>
`.trim();

const benefits = [
  { icon: 'snowflake', title: 'Cold Therapy', description: 'Vasoconstrictive cooling that calms dilated blood vessels and dulls throbbing pain.' },
  { icon: 'sun', title: 'Heat Therapy', description: 'Microwave-safe gel core relaxes tight muscles for tension headaches and sinus pressure.' },
  { icon: 'moon', title: 'Full Light Blocking', description: 'V-notch design blocks 100% of ambient light to ease migraine-related photophobia.' },
  { icon: 'refresh', title: 'Reusable, No Mess', description: 'Wipe clean and reuse indefinitely — no disposable gel packs or leaks.' },
];

const specs = [
  { label: 'Dimensions', value: '22 cm × 17 cm, V-notch nose contour' },
  { label: 'Weight', value: '150g–212g' },
  { label: 'Fabric', value: '85% Nylon, 15% Spandex Lycra-blend' },
  { label: 'Thermal core', value: 'Non-toxic glycerol-water-sodium acrylate hydrogel' },
  { label: 'Profile', value: 'Odourless, hypoallergenic, latex-free' },
  { label: 'Lifespan', value: '5-year functional shelf life, stored flat in a cool, dry place' },
  { label: 'Care', value: 'Wipe with a damp cloth, air-dry flat. Do not machine wash, bleach, or iron.' },
];

const faqs = [
  {
    q: 'Can I wear the cap safely while sleeping overnight?',
    a: "No — for cold therapy, limit continuous skin contact to 20 minutes to avoid irritation or tissue damage. Sleeping in a frozen cap prevents you noticing warning signs like numbness. For overnight light-blocking, use a standard unchilled sleep mask instead.",
  },
  {
    q: 'How should I wash and maintain the cap?',
    a: 'Never machine wash, submerge, bleach, iron, or dry clean it. Wipe the outer fabric with a damp cloth and mild soap, then air-dry flat. Store it in its protective bag to keep the hydrogel free of dust, moisture, and odours.',
  },
  {
    q: 'Can I wear skincare or makeup underneath the cap?',
    a: 'Keep skin clean and free of creams, oils, or cosmetics before applying the cap — these can degrade the Lycra-spandex fibres and irritate skin under sustained compression.',
  },
  {
    q: 'When should I see a GP about my headaches?',
    a: 'See a GP if your headache pattern suddenly changes, attacks become more frequent or severe, or you need painkillers more than two days a week. People with Raynaud\u2019s phenomenon, poor circulation, diabetes, or cardiovascular disease should get medical advice before using temperature therapy.',
  },
];

type VariantSeed = { option: 'single' | 'double' | 'triple'; label: string; sku: string; priceMinor: number; compareAtPriceMinor: number | null; stock: number };

const products: { slug: string; name: string; variants: VariantSeed[] }[] = [
  {
    slug: 'migraine-relief-cap-single',
    name: 'Migraine Relief Cap — Single',
    variants: [{ option: 'single', label: '1 Cap', sku: 'PR-CAP-1', priceMinor: 1999, compareAtPriceMinor: 2999, stock: 250 }],
  },
  {
    slug: 'migraine-relief-cap-double',
    name: 'Migraine Relief Cap — Double Combo Pack',
    variants: [{ option: 'double', label: '2 Caps', sku: 'PR-CAP-2', priceMinor: 3499, compareAtPriceMinor: 5998, stock: 180 }],
  },
  {
    slug: 'migraine-relief-cap-triple',
    name: 'Migraine Relief Cap — Triple Combo Pack',
    variants: [{ option: 'triple', label: '3 Caps', sku: 'PR-CAP-3', priceMinor: 4699, compareAtPriceMinor: 8997, stock: 140 }],
  },
];

let sql = `-- Auto-generated seed data. Safe to re-run against a fresh DB only (uses fixed IDs).\n\n`;

sql += `INSERT INTO admin_users (id, email, full_name, password_hash, role, permissions_json, created_at, updated_at) VALUES\n`;
sql += `  ('admin_seed_owner', 'owner@purerelief.co.uk', 'Site Owner',\n`;
sql += `   -- Real PBKDF2 hash for password "ChangeMe123!" (210,000 iterations, SHA-256) — ROTATE IMMEDIATELY after first login.\n`;
sql += `   'pbkdf2$210000$29349afe7f8df973c6afcec6cf22668d$0aa0c4eec9bd370e99cfdf0c3d9fd7f4e70031263f734bcdf6f1dbc70cd746ce',\n`;
sql += `   'owner', '["products.manage","orders.manage","blog.manage","reviews.manage","customers.manage","coupons.manage","settings.manage","users.manage","seo.manage","media.manage"]',\n`;
sql += `   '${now}', '${now}');\n\n`;

sql += `INSERT INTO categories (id, slug, name, description, sort_order, seo_title, seo_meta_description, seo_canonical_path) VALUES\n`;
sql += `  ('cat_seed_migraine', 'migraine-relief', 'Migraine Relief', 'Drug-free cold and hot therapy for migraines, headaches, and tension.', 0,\n`;
sql += `   'Migraine Relief Products UK | Pure Relief', 'Shop reusable migraine relief caps engineered for 360° cold and hot therapy.', '/shop/migraine-relief');\n\n`;

for (const [i, p] of products.entries()) {
  const pid = id('prod', i + 1);
  sql += `INSERT INTO products (id, slug, name, short_description, description_html, status, seo_title, seo_meta_description, seo_canonical_path, created_at, updated_at) VALUES\n`;
  sql += `  ('${pid}', '${p.slug}', '${esc(p.name)}', '${esc(shortDescription)}', '${esc(descriptionHtml)}', 'published',\n`;
  sql += `   '${esc(p.name)} | Cold & Hot Therapy | Pure Relief', '${esc(shortDescription.slice(0, 155))}', '/product/${p.slug}', '${now}', '${now}');\n\n`;

  sql += `INSERT INTO product_categories (product_id, category_id) VALUES ('${pid}', 'cat_seed_migraine');\n\n`;

  p.variants.forEach((v, vi) => {
    sql += `INSERT INTO product_variants (id, product_id, option, sku, label, price_minor, compare_at_price_minor, stock_quantity, is_default, sort_order) VALUES\n`;
    sql += `  ('${id('var', i * 10 + vi + 1)}', '${pid}', '${v.option}', '${v.sku}', '${esc(v.label)}', ${v.priceMinor}, ${v.compareAtPriceMinor ?? 'NULL'}, ${v.stock}, 1, 0);\n\n`;
  });

  benefits.forEach((b, bi) => {
    sql += `INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES\n`;
    sql += `  ('${id('ben', i * 10 + bi + 1)}', '${pid}', '${b.icon}', '${esc(b.title)}', '${esc(b.description)}', ${bi});\n\n`;
  });

  specs.forEach((s, si) => {
    sql += `INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES\n`;
    sql += `  ('${id('spec', i * 10 + si + 1)}', '${pid}', '${esc(s.label)}', '${esc(s.value)}', ${si});\n\n`;
  });

  faqs.forEach((f, fi) => {
    sql += `INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES\n`;
    sql += `  ('${id('faq', i * 10 + fi + 1)}', '${pid}', '${esc(f.q)}', '${esc(f.a)}', ${fi});\n\n`;
  });

  // Placeholder image row — no real R2 asset uploaded yet; frontend renders a
  // styled placeholder block when isPlaceholder = 1, and swaps to the real R2
  // URL automatically once media.is_placeholder is flipped to 0 with a real r2_key.
  const mediaId = id('media', i + 1);
  sql += `INSERT INTO media_assets (id, r2_key, alt_text, width, height, mime_type, size_bytes, is_placeholder) VALUES\n`;
  sql += `  ('${mediaId}', 'placeholder/${p.slug}.webp', '${esc(p.name)}', 1200, 1200, 'image/webp', 0, 1);\n\n`;
  sql += `INSERT INTO product_images (id, product_id, media_asset_id, sort_order) VALUES\n`;
  sql += `  ('${id('img', i + 1)}', '${pid}', '${mediaId}', 0);\n\n`;
}

// Cross-link related products (each links to the other two)
for (let i = 0; i < products.length; i++) {
  for (let j = 0; j < products.length; j++) {
    if (i === j) continue;
    sql += `INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('${id('prod', i + 1)}', '${id('prod', j + 1)}', ${j});\n`;
  }
}
sql += '\n';

sql += `INSERT INTO nav_links (id, label, href, sort_order) VALUES\n`;
sql += `  ('nav_1', 'Home', '/', 0),\n`;
sql += `  ('nav_2', 'Shop', '/shop', 1),\n`;
sql += `  ('nav_3', 'About', '/about', 2),\n`;
sql += `  ('nav_4', 'Blog', '/blog', 3),\n`;
sql += `  ('nav_5', 'FAQ', '/faq', 4),\n`;
sql += `  ('nav_6', 'Contact', '/contact', 5);\n\n`;

sql += `INSERT INTO faqs (id, question, answer, category, sort_order) VALUES\n`;
sql += faqs.map((f, i) => `  ('faq_global_${i + 1}', '${esc(f.q)}', '${esc(f.a)}', 'Product Care', ${i})`).join(',\n') + ';\n\n';

sql += `INSERT INTO coupons (id, code, type, value, min_spend_minor, active) VALUES\n`;
sql += `  ('coup_seed_1', 'WELCOME10', 'percentage', 10, NULL, 1);\n`;

writeFileSync('seed.sql', sql);
console.log('Wrote seed.sql');

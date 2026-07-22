-- Auto-generated seed data. Safe to re-run against a fresh DB only (uses fixed IDs).

INSERT INTO admin_users (id, email, full_name, password_hash, role, permissions_json, created_at, updated_at) VALUES
  ('admin_seed_owner', 'owner@purerelief.co.uk', 'Site Owner',
   -- Real PBKDF2 hash for password "ChangeMe123!" (210,000 iterations, SHA-256) — ROTATE IMMEDIATELY after first login.
   'pbkdf2$210000$29349afe7f8df973c6afcec6cf22668d$0aa0c4eec9bd370e99cfdf0c3d9fd7f4e70031263f734bcdf6f1dbc70cd746ce',
   'owner', '["products.manage","orders.manage","blog.manage","reviews.manage","customers.manage","coupons.manage","settings.manage","users.manage","seo.manage","media.manage"]',
   '2026-07-21T18:42:54.999Z', '2026-07-21T18:42:54.999Z');

INSERT INTO categories (id, slug, name, description, sort_order, seo_title, seo_meta_description, seo_canonical_path) VALUES
  ('cat_seed_migraine', 'migraine-relief', 'Migraine Relief', 'Drug-free cold and hot therapy for migraines, headaches, and tension.', 0,
   'Migraine Relief Products UK | Pure Relief', 'Shop reusable migraine relief caps engineered for 360° cold and hot therapy.', '/shop/migraine-relief');

INSERT INTO products (id, slug, name, short_description, description_html, status, seo_title, seo_meta_description, seo_canonical_path, created_at, updated_at) VALUES
  ('prod_seed_001', 'migraine-relief-cap-single', 'Migraine Relief Cap — Single', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blocking comfort.', '<p>The Pure Relief Migraine Relief Cap combines medical-grade cold therapy with gentle, continuous compression, engineered to conform precisely to the anatomical structures of the skull. Slide it on for targeted, non-invasive relief for migraines, tension headaches, sinus pressure, and hormonal headaches.</p>
<p>Freeze it for up to 45 minutes of vasoconstrictive cooling relief, or microwave it for soothing heat that relaxes tight muscles in the neck, temples, and scalp. The thick, light-blocking fabric doubles as a sleep mask, helping calm photophobia during an attack.</p>
<p>This product is for informational and self-care purposes only and is not a substitute for professional medical advice. If headaches become more frequent, more severe, or require painkillers more than twice a week, consult a GP.</p>', 'published',
   'Migraine Relief Cap — Single | Cold & Hot Therapy | Pure Relief', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blockin', '/product/migraine-relief-cap-single', '2026-07-21T18:42:54.999Z', '2026-07-21T18:42:54.999Z');

INSERT INTO product_categories (product_id, category_id) VALUES ('prod_seed_001', 'cat_seed_migraine');

INSERT INTO product_variants (id, product_id, option, sku, label, price_minor, compare_at_price_minor, stock_quantity, is_default, sort_order) VALUES
  ('var_seed_001', 'prod_seed_001', 'single', 'PR-CAP-1', '1 Cap', 1999, 2999, 250, 1, 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_001', 'prod_seed_001', 'snowflake', 'Cold Therapy', 'Vasoconstrictive cooling that calms dilated blood vessels and dulls throbbing pain.', 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_002', 'prod_seed_001', 'sun', 'Heat Therapy', 'Microwave-safe gel core relaxes tight muscles for tension headaches and sinus pressure.', 1);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_003', 'prod_seed_001', 'moon', 'Full Light Blocking', 'V-notch design blocks 100% of ambient light to ease migraine-related photophobia.', 2);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_004', 'prod_seed_001', 'refresh', 'Reusable, No Mess', 'Wipe clean and reuse indefinitely — no disposable gel packs or leaks.', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_001', 'prod_seed_001', 'Dimensions', '22 cm × 17 cm, V-notch nose contour', 0);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_002', 'prod_seed_001', 'Weight', '150g–212g', 1);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_003', 'prod_seed_001', 'Fabric', '85% Nylon, 15% Spandex Lycra-blend', 2);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_004', 'prod_seed_001', 'Thermal core', 'Non-toxic glycerol-water-sodium acrylate hydrogel', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_005', 'prod_seed_001', 'Profile', 'Odourless, hypoallergenic, latex-free', 4);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_006', 'prod_seed_001', 'Lifespan', '5-year functional shelf life, stored flat in a cool, dry place', 5);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_007', 'prod_seed_001', 'Care', 'Wipe with a damp cloth, air-dry flat. Do not machine wash, bleach, or iron.', 6);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_001', 'prod_seed_001', 'Can I wear the cap safely while sleeping overnight?', 'No — for cold therapy, limit continuous skin contact to 20 minutes to avoid irritation or tissue damage. Sleeping in a frozen cap prevents you noticing warning signs like numbness. For overnight light-blocking, use a standard unchilled sleep mask instead.', 0);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_002', 'prod_seed_001', 'How should I wash and maintain the cap?', 'Never machine wash, submerge, bleach, iron, or dry clean it. Wipe the outer fabric with a damp cloth and mild soap, then air-dry flat. Store it in its protective bag to keep the hydrogel free of dust, moisture, and odours.', 1);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_003', 'prod_seed_001', 'Can I wear skincare or makeup underneath the cap?', 'Keep skin clean and free of creams, oils, or cosmetics before applying the cap — these can degrade the Lycra-spandex fibres and irritate skin under sustained compression.', 2);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_004', 'prod_seed_001', 'When should I see a GP about my headaches?', 'See a GP if your headache pattern suddenly changes, attacks become more frequent or severe, or you need painkillers more than two days a week. People with Raynaud’s phenomenon, poor circulation, diabetes, or cardiovascular disease should get medical advice before using temperature therapy.', 3);

INSERT INTO media_assets (id, r2_key, alt_text, width, height, mime_type, size_bytes, is_placeholder) VALUES
  ('media_seed_001', 'placeholder/migraine-relief-cap-single.webp', 'Migraine Relief Cap — Single', 1200, 1200, 'image/webp', 0, 1);

INSERT INTO product_images (id, product_id, media_asset_id, sort_order) VALUES
  ('img_seed_001', 'prod_seed_001', 'media_seed_001', 0);

INSERT INTO products (id, slug, name, short_description, description_html, status, seo_title, seo_meta_description, seo_canonical_path, created_at, updated_at) VALUES
  ('prod_seed_002', 'migraine-relief-cap-double', 'Migraine Relief Cap — Double Combo Pack', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blocking comfort.', '<p>The Pure Relief Migraine Relief Cap combines medical-grade cold therapy with gentle, continuous compression, engineered to conform precisely to the anatomical structures of the skull. Slide it on for targeted, non-invasive relief for migraines, tension headaches, sinus pressure, and hormonal headaches.</p>
<p>Freeze it for up to 45 minutes of vasoconstrictive cooling relief, or microwave it for soothing heat that relaxes tight muscles in the neck, temples, and scalp. The thick, light-blocking fabric doubles as a sleep mask, helping calm photophobia during an attack.</p>
<p>This product is for informational and self-care purposes only and is not a substitute for professional medical advice. If headaches become more frequent, more severe, or require painkillers more than twice a week, consult a GP.</p>', 'published',
   'Migraine Relief Cap — Double Combo Pack | Cold & Hot Therapy | Pure Relief', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blockin', '/product/migraine-relief-cap-double', '2026-07-21T18:42:54.999Z', '2026-07-21T18:42:54.999Z');

INSERT INTO product_categories (product_id, category_id) VALUES ('prod_seed_002', 'cat_seed_migraine');

INSERT INTO product_variants (id, product_id, option, sku, label, price_minor, compare_at_price_minor, stock_quantity, is_default, sort_order) VALUES
  ('var_seed_011', 'prod_seed_002', 'double', 'PR-CAP-2', '2 Caps', 3499, 5998, 180, 1, 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_011', 'prod_seed_002', 'snowflake', 'Cold Therapy', 'Vasoconstrictive cooling that calms dilated blood vessels and dulls throbbing pain.', 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_012', 'prod_seed_002', 'sun', 'Heat Therapy', 'Microwave-safe gel core relaxes tight muscles for tension headaches and sinus pressure.', 1);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_013', 'prod_seed_002', 'moon', 'Full Light Blocking', 'V-notch design blocks 100% of ambient light to ease migraine-related photophobia.', 2);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_014', 'prod_seed_002', 'refresh', 'Reusable, No Mess', 'Wipe clean and reuse indefinitely — no disposable gel packs or leaks.', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_011', 'prod_seed_002', 'Dimensions', '22 cm × 17 cm, V-notch nose contour', 0);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_012', 'prod_seed_002', 'Weight', '150g–212g', 1);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_013', 'prod_seed_002', 'Fabric', '85% Nylon, 15% Spandex Lycra-blend', 2);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_014', 'prod_seed_002', 'Thermal core', 'Non-toxic glycerol-water-sodium acrylate hydrogel', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_015', 'prod_seed_002', 'Profile', 'Odourless, hypoallergenic, latex-free', 4);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_016', 'prod_seed_002', 'Lifespan', '5-year functional shelf life, stored flat in a cool, dry place', 5);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_017', 'prod_seed_002', 'Care', 'Wipe with a damp cloth, air-dry flat. Do not machine wash, bleach, or iron.', 6);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_011', 'prod_seed_002', 'Can I wear the cap safely while sleeping overnight?', 'No — for cold therapy, limit continuous skin contact to 20 minutes to avoid irritation or tissue damage. Sleeping in a frozen cap prevents you noticing warning signs like numbness. For overnight light-blocking, use a standard unchilled sleep mask instead.', 0);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_012', 'prod_seed_002', 'How should I wash and maintain the cap?', 'Never machine wash, submerge, bleach, iron, or dry clean it. Wipe the outer fabric with a damp cloth and mild soap, then air-dry flat. Store it in its protective bag to keep the hydrogel free of dust, moisture, and odours.', 1);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_013', 'prod_seed_002', 'Can I wear skincare or makeup underneath the cap?', 'Keep skin clean and free of creams, oils, or cosmetics before applying the cap — these can degrade the Lycra-spandex fibres and irritate skin under sustained compression.', 2);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_014', 'prod_seed_002', 'When should I see a GP about my headaches?', 'See a GP if your headache pattern suddenly changes, attacks become more frequent or severe, or you need painkillers more than two days a week. People with Raynaud’s phenomenon, poor circulation, diabetes, or cardiovascular disease should get medical advice before using temperature therapy.', 3);

INSERT INTO media_assets (id, r2_key, alt_text, width, height, mime_type, size_bytes, is_placeholder) VALUES
  ('media_seed_002', 'placeholder/migraine-relief-cap-double.webp', 'Migraine Relief Cap — Double Combo Pack', 1200, 1200, 'image/webp', 0, 1);

INSERT INTO product_images (id, product_id, media_asset_id, sort_order) VALUES
  ('img_seed_002', 'prod_seed_002', 'media_seed_002', 0);

INSERT INTO products (id, slug, name, short_description, description_html, status, seo_title, seo_meta_description, seo_canonical_path, created_at, updated_at) VALUES
  ('prod_seed_003', 'migraine-relief-cap-triple', 'Migraine Relief Cap — Triple Combo Pack', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blocking comfort.', '<p>The Pure Relief Migraine Relief Cap combines medical-grade cold therapy with gentle, continuous compression, engineered to conform precisely to the anatomical structures of the skull. Slide it on for targeted, non-invasive relief for migraines, tension headaches, sinus pressure, and hormonal headaches.</p>
<p>Freeze it for up to 45 minutes of vasoconstrictive cooling relief, or microwave it for soothing heat that relaxes tight muscles in the neck, temples, and scalp. The thick, light-blocking fabric doubles as a sleep mask, helping calm photophobia during an attack.</p>
<p>This product is for informational and self-care purposes only and is not a substitute for professional medical advice. If headaches become more frequent, more severe, or require painkillers more than twice a week, consult a GP.</p>', 'published',
   'Migraine Relief Cap — Triple Combo Pack | Cold & Hot Therapy | Pure Relief', 'Drug-free, reusable dual-temperature relief cap. Freeze for cold therapy or microwave for heat — engineered for 360° cranial cooling and full light-blockin', '/product/migraine-relief-cap-triple', '2026-07-21T18:42:54.999Z', '2026-07-21T18:42:54.999Z');

INSERT INTO product_categories (product_id, category_id) VALUES ('prod_seed_003', 'cat_seed_migraine');

INSERT INTO product_variants (id, product_id, option, sku, label, price_minor, compare_at_price_minor, stock_quantity, is_default, sort_order) VALUES
  ('var_seed_021', 'prod_seed_003', 'triple', 'PR-CAP-3', '3 Caps', 4699, 8997, 140, 1, 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_021', 'prod_seed_003', 'snowflake', 'Cold Therapy', 'Vasoconstrictive cooling that calms dilated blood vessels and dulls throbbing pain.', 0);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_022', 'prod_seed_003', 'sun', 'Heat Therapy', 'Microwave-safe gel core relaxes tight muscles for tension headaches and sinus pressure.', 1);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_023', 'prod_seed_003', 'moon', 'Full Light Blocking', 'V-notch design blocks 100% of ambient light to ease migraine-related photophobia.', 2);

INSERT INTO product_benefits (id, product_id, icon, title, description, sort_order) VALUES
  ('ben_seed_024', 'prod_seed_003', 'refresh', 'Reusable, No Mess', 'Wipe clean and reuse indefinitely — no disposable gel packs or leaks.', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_021', 'prod_seed_003', 'Dimensions', '22 cm × 17 cm, V-notch nose contour', 0);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_022', 'prod_seed_003', 'Weight', '150g–212g', 1);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_023', 'prod_seed_003', 'Fabric', '85% Nylon, 15% Spandex Lycra-blend', 2);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_024', 'prod_seed_003', 'Thermal core', 'Non-toxic glycerol-water-sodium acrylate hydrogel', 3);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_025', 'prod_seed_003', 'Profile', 'Odourless, hypoallergenic, latex-free', 4);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_026', 'prod_seed_003', 'Lifespan', '5-year functional shelf life, stored flat in a cool, dry place', 5);

INSERT INTO product_specs (id, product_id, label, value, sort_order) VALUES
  ('spec_seed_027', 'prod_seed_003', 'Care', 'Wipe with a damp cloth, air-dry flat. Do not machine wash, bleach, or iron.', 6);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_021', 'prod_seed_003', 'Can I wear the cap safely while sleeping overnight?', 'No — for cold therapy, limit continuous skin contact to 20 minutes to avoid irritation or tissue damage. Sleeping in a frozen cap prevents you noticing warning signs like numbness. For overnight light-blocking, use a standard unchilled sleep mask instead.', 0);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_022', 'prod_seed_003', 'How should I wash and maintain the cap?', 'Never machine wash, submerge, bleach, iron, or dry clean it. Wipe the outer fabric with a damp cloth and mild soap, then air-dry flat. Store it in its protective bag to keep the hydrogel free of dust, moisture, and odours.', 1);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_023', 'prod_seed_003', 'Can I wear skincare or makeup underneath the cap?', 'Keep skin clean and free of creams, oils, or cosmetics before applying the cap — these can degrade the Lycra-spandex fibres and irritate skin under sustained compression.', 2);

INSERT INTO product_faqs (id, product_id, question, answer, sort_order) VALUES
  ('faq_seed_024', 'prod_seed_003', 'When should I see a GP about my headaches?', 'See a GP if your headache pattern suddenly changes, attacks become more frequent or severe, or you need painkillers more than two days a week. People with Raynaud’s phenomenon, poor circulation, diabetes, or cardiovascular disease should get medical advice before using temperature therapy.', 3);

INSERT INTO media_assets (id, r2_key, alt_text, width, height, mime_type, size_bytes, is_placeholder) VALUES
  ('media_seed_003', 'placeholder/migraine-relief-cap-triple.webp', 'Migraine Relief Cap — Triple Combo Pack', 1200, 1200, 'image/webp', 0, 1);

INSERT INTO product_images (id, product_id, media_asset_id, sort_order) VALUES
  ('img_seed_003', 'prod_seed_003', 'media_seed_003', 0);

INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_001', 'prod_seed_002', 1);
INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_001', 'prod_seed_003', 2);
INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_002', 'prod_seed_001', 0);
INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_002', 'prod_seed_003', 2);
INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_003', 'prod_seed_001', 0);
INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES ('prod_seed_003', 'prod_seed_002', 1);

INSERT INTO nav_links (id, label, href, sort_order) VALUES
  ('nav_1', 'Home', '/', 0),
  ('nav_2', 'Shop', '/shop', 1),
  ('nav_3', 'About', '/about', 2),
  ('nav_4', 'Blog', '/blog', 3),
  ('nav_5', 'FAQ', '/faq', 4),
  ('nav_6', 'Contact', '/contact', 5);

INSERT INTO faqs (id, question, answer, category, sort_order) VALUES
  ('faq_global_1', 'Can I wear the cap safely while sleeping overnight?', 'No — for cold therapy, limit continuous skin contact to 20 minutes to avoid irritation or tissue damage. Sleeping in a frozen cap prevents you noticing warning signs like numbness. For overnight light-blocking, use a standard unchilled sleep mask instead.', 'Product Care', 0),
  ('faq_global_2', 'How should I wash and maintain the cap?', 'Never machine wash, submerge, bleach, iron, or dry clean it. Wipe the outer fabric with a damp cloth and mild soap, then air-dry flat. Store it in its protective bag to keep the hydrogel free of dust, moisture, and odours.', 'Product Care', 1),
  ('faq_global_3', 'Can I wear skincare or makeup underneath the cap?', 'Keep skin clean and free of creams, oils, or cosmetics before applying the cap — these can degrade the Lycra-spandex fibres and irritate skin under sustained compression.', 'Product Care', 2),
  ('faq_global_4', 'When should I see a GP about my headaches?', 'See a GP if your headache pattern suddenly changes, attacks become more frequent or severe, or you need painkillers more than two days a week. People with Raynaud’s phenomenon, poor circulation, diabetes, or cardiovascular disease should get medical advice before using temperature therapy.', 'Product Care', 3);

INSERT INTO coupons (id, code, type, value, min_spend_minor, active) VALUES
  ('coup_seed_1', 'WELCOME10', 'percentage', 10, NULL, 1);

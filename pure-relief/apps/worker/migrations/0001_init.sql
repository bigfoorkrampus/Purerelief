-- ============================================================================
-- Pure Relief — D1 Schema, migration 0001
-- Designed to scale to thousands of products without structural changes:
-- categories are many-to-many via join table, variants are first-class rows,
-- SEO fields are embedded per-entity rather than bolted on, and every listing
-- table carries the indexes needed for admin search/filter/pagination.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---- Users / auth / RBAC ---------------------------------------------------

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','support')),
  permissions_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);
CREATE INDEX idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE TABLE admin_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  diff_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at);

-- ---- Rate limiting (rolling window, checked by middleware) -----------------

CREATE TABLE rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);

-- ---- Media (R2-backed) ------------------------------------------------------

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  is_placeholder INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_media_created ON media_assets(created_at);

-- ---- Categories -------------------------------------------------------------

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_meta_description TEXT NOT NULL DEFAULT '',
  seo_canonical_path TEXT NOT NULL DEFAULT '',
  seo_og_image_key TEXT,
  seo_no_index INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ---- Products ----------------------------------------------------------------

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  description_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_meta_description TEXT NOT NULL DEFAULT '',
  seo_canonical_path TEXT NOT NULL DEFAULT '',
  seo_og_image_key TEXT,
  seo_no_index INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_deleted ON products(deleted_at);
CREATE INDEX idx_products_updated ON products(updated_at);

CREATE TABLE product_categories (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX idx_product_categories_cat ON product_categories(category_id);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option TEXT NOT NULL CHECK (option IN ('single','double','triple')),
  sku TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  compare_at_price_minor INTEGER,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

CREATE TABLE product_benefits (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_benefits_product ON product_benefits(product_id);

CREATE TABLE product_specs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_specs_product ON product_specs(product_id);

CREATE TABLE product_faqs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_faqs_product ON product_faqs(product_id);

CREATE TABLE product_related (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, related_product_id)
);

-- ---- Reviews -----------------------------------------------------------------

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  verified_purchase INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reviews_product ON reviews(product_id, status);
CREATE INDEX idx_reviews_status ON reviews(status);

-- ---- Global FAQ (site-wide, separate from per-product FAQ) -------------------

CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_faqs_category ON faqs(category, sort_order);

-- ---- Blog ----------------------------------------------------------------

CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  cover_image_key TEXT,
  author_name TEXT NOT NULL DEFAULT 'Pure Relief Team',
  status TEXT NOT NULL CHECK (status IN ('draft','published')) DEFAULT 'draft',
  tags_json TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_meta_description TEXT NOT NULL DEFAULT '',
  seo_canonical_path TEXT NOT NULL DEFAULT '',
  seo_og_image_key TEXT,
  seo_no_index INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status, published_at);

CREATE TABLE blog_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id, status);

-- ---- Coupons -----------------------------------------------------------------

CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value REAL NOT NULL,
  min_spend_minor INTEGER,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active, expires_at);

-- ---- Customers -----------------------------------------------------------------

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  default_address_json TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_customers_email ON customers(email);

-- ---- Orders -----------------------------------------------------------------

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  shipping_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL,
  coupon_code TEXT,
  shipping_address_json TEXT NOT NULL,
  billing_address_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pending_payment','paid','fulfilled','shipped','delivered','cancelled','refunded')
  ) DEFAULT 'pending_payment',
  payment_provider TEXT NOT NULL DEFAULT 'unassigned',
  payment_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_orders_email ON orders(customer_email);

CREATE TABLE order_line_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  variant_label_snapshot TEXT NOT NULL,
  unit_price_minor INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);
CREATE INDEX idx_order_items_order ON order_line_items(order_id);

-- ---- Site configuration (homepage, nav, banner, settings) --------------------

CREATE TABLE nav_links (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE banner_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  link_href TEXT,
  background_color TEXT NOT NULL DEFAULT '#2563EB',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF'
);

CREATE TABLE homepage_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  sections_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  site_name TEXT NOT NULL DEFAULT 'Pure Relief',
  support_phone TEXT NOT NULL DEFAULT '+44 7440 056021',
  support_whatsapp TEXT NOT NULL DEFAULT '+44 7440 056021',
  contact_email TEXT NOT NULL DEFAULT 'hello@purerelief.co.uk',
  address_line TEXT NOT NULL DEFAULT '',
  google_analytics_id TEXT,
  google_search_console_verification TEXT,
  social_links_json TEXT NOT NULL DEFAULT '[]'
);

-- ---- Contact form submissions --------------------------------------------------

CREATE TABLE contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_contact_created ON contact_submissions(created_at);

-- ---- Seed defaults -------------------------------------------------------------

INSERT INTO banner_config (id, enabled, message, link_href) VALUES
  ('default', 1, 'Free UK delivery on all combo packs — order today', '/shop');

INSERT INTO homepage_config (id, sections_json) VALUES ('default', '[]');

INSERT INTO site_settings (id) VALUES ('default');

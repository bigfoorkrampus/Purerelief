import type { SiteSettings, NavLink, BannerConfig, HomepageConfig, MediaAsset, AdminUser, Permission } from '@pure-relief/shared';
import { generateId } from '../crypto';

// ============================================================================
// Site settings
// ============================================================================

type SettingsRow = {
  site_name: string;
  support_phone: string;
  support_whatsapp: string;
  contact_email: string;
  address_line: string;
  google_analytics_id: string | null;
  google_search_console_verification: string | null;
  social_links_json: string;
};

export async function getSiteSettings(db: D1Database): Promise<SiteSettings> {
  const row = await db.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first<SettingsRow>();
  if (!row) {
    return {
      siteName: 'Pure Relief',
      supportPhone: '+44 7440 056021',
      supportWhatsApp: '+44 7440 056021',
      contactEmail: 'hello@purerelief.co.uk',
      addressLine: '',
      googleAnalyticsId: null,
      googleSearchConsoleVerification: null,
      socialLinks: [],
    };
  }
  return {
    siteName: row.site_name,
    supportPhone: row.support_phone,
    supportWhatsApp: row.support_whatsapp,
    contactEmail: row.contact_email,
    addressLine: row.address_line,
    googleAnalyticsId: row.google_analytics_id,
    googleSearchConsoleVerification: row.google_search_console_verification,
    socialLinks: JSON.parse(row.social_links_json || '[]'),
  };
}

export async function updateSiteSettings(db: D1Database, settings: SiteSettings): Promise<void> {
  await db
    .prepare(
      `UPDATE site_settings SET site_name=?, support_phone=?, support_whatsapp=?, contact_email=?, address_line=?,
        google_analytics_id=?, google_search_console_verification=?, social_links_json=? WHERE id='default'`,
    )
    .bind(
      settings.siteName,
      settings.supportPhone,
      settings.supportWhatsApp,
      settings.contactEmail,
      settings.addressLine,
      settings.googleAnalyticsId,
      settings.googleSearchConsoleVerification,
      JSON.stringify(settings.socialLinks),
    )
    .run();
}

// ============================================================================
// Nav links
// ============================================================================

export async function listNavLinks(db: D1Database): Promise<NavLink[]> {
  const rows = await db.prepare(`SELECT * FROM nav_links ORDER BY sort_order ASC`).all<{ id: string; label: string; href: string; sort_order: number }>();
  return rows.results.map((r) => ({ id: r.id, label: r.label, href: r.href, sortOrder: r.sort_order }));
}

/**
 * BUG FIX: saving the nav menu could wipe it entirely with no way back.
 *
 * Previously `DELETE FROM nav_links` ran as its own auto-committed
 * statement, then the new links were inserted in a *separate* db.batch()
 * call. If that insert batch failed for any reason (a malformed link in
 * the payload, a transient error), the DELETE had already committed —
 * leaving the live site with an empty navigation menu and nothing to
 * restore it from.
 *
 * Fix: put the DELETE and every INSERT in one db.batch() call so they
 * commit or roll back together.
 */
export async function replaceNavLinks(db: D1Database, links: { label: string; href: string; sortOrder: number }[]): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM nav_links`),
    ...links.map((link) =>
      db.prepare(`INSERT INTO nav_links (id, label, href, sort_order) VALUES (?, ?, ?, ?)`).bind(generateId('nav'), link.label, link.href, link.sortOrder),
    ),
  ];
  await db.batch(statements);
}

// ============================================================================
// Banner
// ============================================================================

type BannerRow = { enabled: number; message: string; link_href: string | null; background_color: string; text_color: string };

export async function getBanner(db: D1Database): Promise<BannerConfig> {
  const row = await db.prepare(`SELECT * FROM banner_config WHERE id = 'default'`).first<BannerRow>();
  return {
    id: 'default',
    enabled: Boolean(row?.enabled),
    message: row?.message ?? '',
    linkHref: row?.link_href ?? null,
    backgroundColor: row?.background_color ?? '#2563EB',
    textColor: row?.text_color ?? '#FFFFFF',
  };
}

export async function updateBanner(db: D1Database, banner: Omit<BannerConfig, 'id'>): Promise<void> {
  await db
    .prepare(`UPDATE banner_config SET enabled=?, message=?, link_href=?, background_color=?, text_color=? WHERE id='default'`)
    .bind(banner.enabled ? 1 : 0, banner.message, banner.linkHref, banner.backgroundColor, banner.textColor)
    .run();
}

// ============================================================================
// Homepage config
// ============================================================================

export async function getHomepageConfig(db: D1Database): Promise<HomepageConfig> {
  const row = await db.prepare(`SELECT * FROM homepage_config WHERE id = 'default'`).first<{ sections_json: string; updated_at: string }>();
  return { sections: JSON.parse(row?.sections_json ?? '[]'), updatedAt: row?.updated_at ?? new Date().toISOString() };
}

export async function updateHomepageConfig(db: D1Database, config: HomepageConfig['sections']): Promise<void> {
  await db
    .prepare(`UPDATE homepage_config SET sections_json=?, updated_at=? WHERE id='default'`)
    .bind(JSON.stringify(config), new Date().toISOString())
    .run();
}

// ============================================================================
// Media assets
// ============================================================================

type MediaRow = { id: string; r2_key: string; alt_text: string; width: number; height: number; is_placeholder: number; mime_type: string; size_bytes: number; created_at: string };

export async function createMediaAsset(
  db: D1Database,
  input: { r2Key: string; altText: string; width: number; height: number; mimeType: string; sizeBytes: number; uploadedBy: string; isPlaceholder?: boolean },
): Promise<MediaAsset> {
  const id = generateId('media');
  await db
    .prepare(
      `INSERT INTO media_assets (id, r2_key, alt_text, width, height, mime_type, size_bytes, is_placeholder, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.r2Key, input.altText, input.width, input.height, input.mimeType, input.sizeBytes, input.isPlaceholder ? 1 : 0, input.uploadedBy)
    .run();
  return { id, r2Key: input.r2Key, altText: input.altText, width: input.width, height: input.height, isPlaceholder: Boolean(input.isPlaceholder) };
}

export async function listMediaAssets(db: D1Database, params: { page: number; pageSize: number }): Promise<{ items: MediaAsset[]; total: number }> {
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM media_assets`).first<{ total: number }>();
  const offset = (params.page - 1) * params.pageSize;
  const rows = await db
    .prepare(`SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(params.pageSize, offset)
    .all<MediaRow>();
  return {
    items: rows.results.map((r) => ({ id: r.id, r2Key: r.r2_key, altText: r.alt_text, width: r.width, height: r.height, isPlaceholder: Boolean(r.is_placeholder) })),
    total: countRow?.total ?? 0,
  };
}

export async function deleteMediaAsset(db: D1Database, id: string): Promise<string | null> {
  const row = await db.prepare(`SELECT r2_key FROM media_assets WHERE id = ?`).bind(id).first<{ r2_key: string }>();
  await db.prepare(`DELETE FROM media_assets WHERE id = ?`).bind(id).run();
  return row?.r2_key ?? null;
}

// ============================================================================
// Admin users
// ============================================================================

type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: AdminUser['role'];
  permissions_json: string;
  last_login_at: string | null;
  created_at: string;
  is_active: number;
};

export async function getAdminUserByEmail(db: D1Database, email: string): Promise<(AdminUser & { passwordHash: string; isActive: boolean }) | null> {
  const row = await db.prepare(`SELECT * FROM admin_users WHERE email = ?`).bind(email.toLowerCase()).first<AdminUserRow>();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    permissions: JSON.parse(row.permissions_json || '[]'),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
  };
}

export async function listAdminUsers(db: D1Database): Promise<AdminUser[]> {
  const rows = await db.prepare(`SELECT * FROM admin_users ORDER BY created_at ASC`).all<AdminUserRow>();
  return rows.results.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    permissions: JSON.parse(row.permissions_json || '[]'),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }));
}

const ROLE_PERMISSIONS: Record<AdminUser['role'], Permission[]> = {
  owner: [
    'products.manage', 'orders.manage', 'blog.manage', 'reviews.manage',
    'customers.manage', 'coupons.manage', 'settings.manage', 'users.manage', 'seo.manage', 'media.manage',
  ],
  admin: [
    'products.manage', 'orders.manage', 'blog.manage', 'reviews.manage',
    'customers.manage', 'coupons.manage', 'seo.manage', 'media.manage',
  ],
  editor: ['products.manage', 'blog.manage', 'seo.manage', 'media.manage'],
  support: ['orders.manage', 'customers.manage', 'reviews.manage'],
};

export async function createAdminUser(
  db: D1Database,
  input: { email: string; fullName: string; passwordHash: string; role: AdminUser['role'] },
): Promise<AdminUser> {
  const id = generateId('admin');
  const permissions = ROLE_PERMISSIONS[input.role];
  await db
    .prepare(`INSERT INTO admin_users (id, email, full_name, password_hash, role, permissions_json) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, input.email.toLowerCase(), input.fullName, input.passwordHash, input.role, JSON.stringify(permissions))
    .run();
  return { id, email: input.email.toLowerCase(), fullName: input.fullName, role: input.role, permissions, lastLoginAt: null, createdAt: new Date().toISOString() };
}

export async function touchAdminLogin(db: D1Database, id: string): Promise<void> {
  await db.prepare(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`).bind(new Date().toISOString(), id).run();
}

export async function updateAdminUserRole(db: D1Database, id: string, role: AdminUser['role']): Promise<void> {
  await db
    .prepare(`UPDATE admin_users SET role = ?, permissions_json = ?, updated_at = ? WHERE id = ?`)
    .bind(role, JSON.stringify(ROLE_PERMISSIONS[role]), new Date().toISOString(), id)
    .run();
}

export async function deactivateAdminUser(db: D1Database, id: string): Promise<void> {
  await db.prepare(`UPDATE admin_users SET is_active = 0 WHERE id = ?`).bind(id).run();
}

export async function writeAuditLog(
  db: D1Database,
  input: { userId: string | null; action: string; entityType: string; entityId?: string | null; diff?: unknown },
): Promise<void> {
  await db
    .prepare(`INSERT INTO admin_audit_log (id, user_id, action, entity_type, entity_id, diff_json) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(generateId('audit'), input.userId, input.action, input.entityType, input.entityId ?? null, input.diff ? JSON.stringify(input.diff) : null)
    .run();
}

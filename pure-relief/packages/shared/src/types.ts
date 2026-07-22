// ============================================================================
// Pure Relief — Shared Types
// Single source of truth for data shapes used by both the storefront (apps/web)
// and the Worker API (apps/worker). Keeping this in one package means the
// frontend's mock-data layer and the real D1-backed API can never drift apart.
// ============================================================================

export type ISODateString = string;

export type Money = {
  /** Integer minor units (pence) to avoid float rounding on currency. */
  amountMinor: number;
  currency: 'GBP';
};

export type SEOFields = {
  title: string;
  metaDescription: string;
  canonicalPath: string;
  ogImageKey: string | null;
  noIndex?: boolean;
};

export type MediaAsset = {
  id: string;
  /** Object key inside the R2 bucket, e.g. products/migraine-cap/hero-1.webp */
  r2Key: string;
  altText: string;
  width: number;
  height: number;
  /** True while no real asset has been uploaded — frontend renders a placeholder block. */
  isPlaceholder: boolean;
};

export type ProductVariantOption = 'single' | 'double' | 'triple';

export type ProductVariant = {
  id: string;
  productId: string;
  option: ProductVariantOption;
  sku: string;
  label: string;
  price: Money;
  compareAtPrice: Money | null;
  stockQuantity: number;
  isDefault: boolean;
};

export type ProductSpecEntry = { label: string; value: string };
export type ProductFAQEntry = { id: string; question: string; answer: string };
export type ProductBenefit = { id: string; icon: string; title: string; description: string };

export type ProductStatus = 'draft' | 'published' | 'archived';

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  descriptionHtml: string;
  categoryIds: string[];
  status: ProductStatus;
  images: MediaAsset[];
  variants: ProductVariant[];
  benefits: ProductBenefit[];
  specs: ProductSpecEntry[];
  faqs: ProductFAQEntry[];
  relatedProductIds: string[];
  seo: SEOFields;
  avgRating: number;
  reviewCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageKey: string | null;
  seo: SEOFields;
};

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type Review = {
  id: string;
  productId: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: ISODateString;
};

export type FAQEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
};

export type BlogPostStatus = 'draft' | 'published';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImageKey: string | null;
  authorName: string;
  status: BlogPostStatus;
  tags: string[];
  seo: SEOFields;
  publishedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type CouponType = 'percentage' | 'fixed';

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSpendMinor: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: ISODateString | null;
  active: boolean;
};

export type Address = {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  country: string;
  phone: string;
};

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderLineItem = {
  productId: string;
  variantId: string;
  nameSnapshot: string;
  variantLabelSnapshot: string;
  unitPrice: Money;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string;
  lineItems: OrderLineItem[];
  subtotal: Money;
  discount: Money;
  shipping: Money;
  total: Money;
  couponCode: string | null;
  shippingAddress: Address;
  billingAddress: Address;
  status: OrderStatus;
  /** Reserved for future Stripe/PayPal/UK-gateway integration. Never populated by this build. */
  paymentProvider: 'unassigned' | 'stripe' | 'paypal' | 'other';
  paymentReference: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  defaultAddress: Address | null;
  marketingOptIn: boolean;
  createdAt: ISODateString;
};

export type CartLineItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type Cart = {
  items: CartLineItem[];
  couponCode: string | null;
};

// ---- Admin / auth --------------------------------------------------------

export type UserRole = 'owner' | 'admin' | 'editor' | 'support';

export type Permission =
  | 'products.manage'
  | 'orders.manage'
  | 'blog.manage'
  | 'reviews.manage'
  | 'customers.manage'
  | 'coupons.manage'
  | 'settings.manage'
  | 'users.manage'
  | 'seo.manage'
  | 'media.manage';

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  lastLoginAt: ISODateString | null;
  createdAt: ISODateString;
};

export type NavLink = { id: string; label: string; href: string; sortOrder: number };

export type BannerConfig = {
  id: string;
  enabled: boolean;
  message: string;
  linkHref: string | null;
  backgroundColor: string;
  textColor: string;
};

export type HomepageSection =
  | { type: 'hero'; headline: string; subheadline: string; ctaLabel: string; ctaHref: string; imageKey: string | null }
  | { type: 'benefits'; heading: string; items: ProductBenefit[] }
  | { type: 'featured_products'; heading: string; productIds: string[] }
  | { type: 'testimonials'; heading: string; reviewIds: string[] }
  | { type: 'blog_teaser'; heading: string; postIds: string[] }
  | { type: 'faq_teaser'; heading: string; faqIds: string[] };

export type HomepageConfig = {
  sections: HomepageSection[];
  updatedAt: ISODateString;
};

export type SiteSettings = {
  siteName: string;
  supportPhone: string;
  supportWhatsApp: string;
  contactEmail: string;
  addressLine: string;
  googleAnalyticsId: string | null;
  googleSearchConsoleVerification: string | null;
  socialLinks: { platform: string; url: string }[];
};

// ---- API envelope ---------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

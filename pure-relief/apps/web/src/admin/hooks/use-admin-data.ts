import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, readCsrfCookie } from '@/lib/api-client';
import type {
  Product, Category, Paginated, BlogPost, Review, FAQEntry, Coupon, Customer, Order,
  AdminUser, MediaAsset, SiteSettings, NavLink, BannerConfig, HomepageConfig, OrderStatus, ReviewStatus, ProductStatus, BlogPostStatus,
} from '@pure-relief/shared';

type DashboardSummary = {
  productCount: number;
  publishedProductCount: number;
  ordersLast30Days: number;
  revenueLast30DaysMinor: number;
  pendingReviewCount: number;
  recentOrders: unknown[];
  lowStockVariants: unknown[];
  customerCount: number;
};

// ============================================================================
// Public query key invalidation
//
// BUG FIX (website not reflecting admin changes):
// Every admin mutation below previously invalidated ONLY its own `admin-*`
// query key. That correctly refreshed the admin UI, but the public storefront
// (apps/web/src/hooks/use-storefront.ts) reads from a completely different
// set of query keys — 'products', 'product', 'categories', 'blog-posts',
// 'blog-post', 'faqs', 'site-config' — which were never told anything had
// changed. Those queries have a staleTime of 60s–5min, so the storefront
// kept serving cached data until that window happened to expire or the
// visitor did a hard reload. There was no cache-layer bug (no Cloudflare
// cache, no service worker) — this was the actual and complete cause.
//
// Fix: invalidate the matching public query key(s) alongside the admin one
// in every mutation that changes storefront-visible content. Admin and
// storefront run in the same browser tab in this app (same origin, same
// QueryClient instance via main.tsx), so this takes effect immediately —
// no extra round trip, no polling.
// ============================================================================
function invalidatePublicProducts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['products'] });
  qc.invalidateQueries({ queryKey: ['product'] });
}
function invalidatePublicCategories(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['categories'] });
}
function invalidatePublicBlog(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['blog-posts'] });
  qc.invalidateQueries({ queryKey: ['blog-post'] });
}
function invalidatePublicFaqs(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['faqs'] });
}
function invalidatePublicReviews(qc: ReturnType<typeof useQueryClient>, productSlug?: string) {
  if (productSlug) qc.invalidateQueries({ queryKey: ['product-reviews', productSlug] });
  else qc.invalidateQueries({ queryKey: ['product-reviews'] });
  // Approving/rejecting a review changes the product's avgRating/reviewCount too.
  invalidatePublicProducts(qc);
}

export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get<DashboardSummary>('/api/admin/dashboard/summary') });
}

// ---- Products ---------------------------------------------------------------

export function useAdminProducts(params: { page: number; pageSize: number; search?: string; status?: ProductStatus }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  return useQuery({ queryKey: ['admin-products', params], queryFn: () => api.get<Paginated<Product>>(`/api/admin/products?${q}`) });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get<Product>(`/api/admin/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/products/${id}`, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      invalidatePublicProducts(qc);
    },
  });
}

export function useBulkUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; status: ProductStatus }) => api.post('/api/admin/products/bulk/status', input, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      invalidatePublicProducts(qc);
    },
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post('/api/admin/products/bulk/delete', { ids }, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      invalidatePublicProducts(qc);
    },
  });
}

export function useImportProductsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return api.post<{ imported: number; failed: number }>('/api/admin/products/import/csv', text, readCsrfCookie());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      invalidatePublicProducts(qc);
    },
  });
}

/**
 * Create/update product. This was previously missing from the admin hooks
 * file entirely — ProductEditorPage called `api.post`/`api.put` directly and
 * only invalidated 'admin-products' / 'admin-product'. Centralizing it here
 * so the public invalidation can't be forgotten by a future caller.
 */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: unknown) => api.post<Product>('/api/admin/products', values, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      invalidatePublicProducts(qc);
    },
  });
}

export function useUpdateProduct(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: unknown) => api.put<Product>(`/api/admin/products/${id}`, values, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
      invalidatePublicProducts(qc);
    },
  });
}

// ---- Categories ---------------------------------------------------------------

export function useAdminCategories() {
  return useQuery({ queryKey: ['admin-categories'], queryFn: () => api.get<Category[]>('/api/admin/categories') });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/categories/${id}`, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      invalidatePublicCategories(qc);
      invalidatePublicProducts(qc);
    },
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; slug: string; name: string; description?: string; imageKey?: string | null; sortOrder?: number; seo?: unknown }) =>
      input.id
        ? api.put(`/api/admin/categories/${input.id}`, input, readCsrfCookie())
        : api.post('/api/admin/categories', input, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      invalidatePublicCategories(qc);
      invalidatePublicProducts(qc);
    },
  });
}

// ---- Media ---------------------------------------------------------------

export function useAdminMedia(params: { page: number; pageSize: number }) {
  const q = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  return useQuery({ queryKey: ['admin-media', params], queryFn: () => api.get<{ items: MediaAsset[]; total: number }>(`/api/admin/media?${q}`) });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File; altText: string }) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('altText', input.altText);
      return api.postForm<MediaAsset>('/api/admin/media/upload', formData, readCsrfCookie());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-media'] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/media/${id}`, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media'] });
      // A deleted asset could be in use as a product image or blog cover.
      invalidatePublicProducts(qc);
      invalidatePublicBlog(qc);
    },
  });
}

// ---- Blog ---------------------------------------------------------------

export function useAdminBlogPosts(params: { page: number; pageSize: number; search?: string; status?: BlogPostStatus }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  return useQuery({ queryKey: ['admin-blog', params], queryFn: () => api.get<Paginated<BlogPost>>(`/api/admin/blog?${q}`) });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/blog/${id}`, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      invalidatePublicBlog(qc);
    },
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: unknown) => api.post<BlogPost>('/api/admin/blog', values, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      invalidatePublicBlog(qc);
    },
  });
}

export function useUpdateBlogPost(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: unknown) => api.put<BlogPost>(`/api/admin/blog/${id}`, values, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      qc.invalidateQueries({ queryKey: ['admin-blog-post', id] });
      invalidatePublicBlog(qc);
    },
  });
}

// ---- Reviews ---------------------------------------------------------------

export function useAdminReviews(params: { page: number; pageSize: number; status?: ReviewStatus }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.status) q.set('status', params.status);
  return useQuery({ queryKey: ['admin-reviews', params], queryFn: () => api.get<Paginated<Review>>(`/api/admin/reviews?${q}`) });
}

export function useSetReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ReviewStatus }) => api.post(`/api/admin/reviews/${input.id}/status`, { status: input.status }, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      invalidatePublicReviews(qc);
    },
  });
}

// ---- FAQ ---------------------------------------------------------------

export function useAdminFaqs() {
  return useQuery({ queryKey: ['admin-faqs'], queryFn: () => api.get<FAQEntry[]>('/api/admin/faqs') });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/faqs/${id}`, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] });
      invalidatePublicFaqs(qc);
    },
  });
}

export function useSaveFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; question: string; answer: string; category: string; sortOrder?: number }) =>
      input.id ? api.put(`/api/admin/faqs/${input.id}`, input, readCsrfCookie()) : api.post('/api/admin/faqs', input, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] });
      invalidatePublicFaqs(qc);
    },
  });
}

// ---- Coupons ---------------------------------------------------------------

export function useAdminCoupons() {
  return useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.get<Coupon[]>('/api/admin/coupons') });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/coupons/${id}`, readCsrfCookie()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

// ---- Customers ---------------------------------------------------------------

export function useAdminCustomers(params: { page: number; pageSize: number; search?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  return useQuery({ queryKey: ['admin-customers', params], queryFn: () => api.get<Paginated<Customer>>(`/api/admin/customers?${q}`) });
}

// ---- Orders ---------------------------------------------------------------

export function useAdminOrders(params: { page: number; pageSize: number; search?: string; status?: OrderStatus }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  return useQuery({ queryKey: ['admin-orders', params], queryFn: () => api.get<Paginated<Order>>(`/api/admin/orders?${q}`) });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({ queryKey: ['admin-order', id], queryFn: () => api.get<Order>(`/api/admin/orders/${id}`), enabled: Boolean(id) });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: OrderStatus }) => api.post(`/api/admin/orders/${input.id}/status`, { status: input.status }, readCsrfCookie()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
}

// ---- Users ---------------------------------------------------------------

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: () => api.get<AdminUser[]>('/api/admin/users') });
}

export function useDeactivateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`, readCsrfCookie()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

// ---- Site config ---------------------------------------------------------------

export function useAdminSiteSettings() {
  return useQuery({ queryKey: ['admin-settings'], queryFn: () => api.get<SiteSettings>('/api/admin/settings') });
}

export function useAdminNavLinks() {
  return useQuery({ queryKey: ['admin-nav'], queryFn: () => api.get<NavLink[]>('/api/admin/nav') });
}

export function useAdminBanner() {
  return useQuery({ queryKey: ['admin-banner'], queryFn: () => api.get<BannerConfig>('/api/admin/banner') });
}

export function useAdminHomepage() {
  return useQuery({ queryKey: ['admin-homepage'], queryFn: () => api.get<HomepageConfig>('/api/admin/homepage') });
}

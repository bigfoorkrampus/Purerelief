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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });
}

export function useBulkUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; status: ProductStatus }) => api.post('/api/admin/products/bulk/status', input, readCsrfCookie()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post('/api/admin/products/bulk/delete', { ids }, readCsrfCookie()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });
}

export function useImportProductsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return api.post<{ imported: number; failed: number }>('/api/admin/products/import/csv', text, readCsrfCookie());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-media'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
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

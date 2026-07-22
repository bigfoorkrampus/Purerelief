import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  Product,
  Category,
  BlogPost,
  FAQEntry,
  Paginated,
  Review,
  SiteSettings,
  NavLink,
  BannerConfig,
  HomepageConfig,
} from '@pure-relief/shared';

export function useProducts(params: { page?: number; pageSize?: number; search?: string; categoryId?: string; sort?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.sort) query.set('sort', params.sort);

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get<Paginated<Product>>(`/api/products?${query.toString()}`),
    staleTime: 60_000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get<Product>(`/api/products/${slug}`),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useProductReviews(slug: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', slug],
    queryFn: () => api.get<Review[]>(`/api/products/${slug}/reviews`),
    enabled: Boolean(slug),
  });
}

export function useSubmitReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { authorName: string; email: string; rating: number; title: string; body: string }) =>
      api.post<Review>(`/api/products/${slug}/reviews`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', slug] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useBlogPosts(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);

  return useQuery({
    queryKey: ['blog-posts', params],
    queryFn: () => api.get<Paginated<BlogPost>>(`/api/blog?${query.toString()}`),
    staleTime: 60_000,
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get<BlogPost>(`/api/blog/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.get<FAQEntry[]>('/api/faqs'),
    staleTime: 5 * 60_000,
  });
}

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site-config'],
    queryFn: () =>
      api.get<{ settings: SiteSettings; navLinks: NavLink[]; banner: BannerConfig; homepage: HomepageConfig }>('/api/site-config'),
    staleTime: 5 * 60_000,
  });
}

export function useContactForm() {
  return useMutation({
    mutationFn: (input: { name: string; email: string; phone?: string; subject: string; message: string; website?: string }) =>
      api.post('/api/contact', input),
  });
}

export function useNewsletterSignup() {
  return useMutation({
    mutationFn: (email: string) => api.post('/api/newsletter', { email }),
  });
}

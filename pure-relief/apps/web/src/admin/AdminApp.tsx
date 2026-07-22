import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initAdminAuth } from '@/admin/lib/admin-auth-store';
import { RequireAdminAuth } from '@/admin/components/RequireAdminAuth';
import { AdminLayout } from '@/admin/components/AdminLayout';
import { AdminLoginPage } from '@/admin/pages/LoginPage';
import { AdminDashboardPage } from '@/admin/pages/DashboardPage';
import { ProductsListPage } from '@/admin/pages/products/ProductsListPage';
import { ProductEditorPage } from '@/admin/pages/products/ProductEditorPage';
import { CategoriesPage } from '@/admin/pages/CategoriesPage';
import { MediaPage } from '@/admin/pages/MediaPage';
import { BlogListPage } from '@/admin/pages/BlogListPage';
import { BlogEditorPage } from '@/admin/pages/BlogEditorPage';
import { ReviewsPage } from '@/admin/pages/ReviewsPage';
import { FaqManagePage } from '@/admin/pages/FaqManagePage';
import { CouponsPage } from '@/admin/pages/CouponsPage';
import { CustomersPage } from '@/admin/pages/CustomersPage';
import { OrdersListPage } from '@/admin/pages/OrdersListPage';
import { OrderDetailPage } from '@/admin/pages/OrderDetailPage';
import { UsersPage } from '@/admin/pages/UsersPage';
import { SiteEditorPage } from '@/admin/pages/SiteEditorPage';
import { SettingsPage } from '@/admin/pages/SettingsPage';

export function AdminApp() {
  useEffect(() => {
    initAdminAuth();
  }, []);

  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />

      <Route
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/:id" element={<ProductEditorPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/:id" element={<BlogEditorPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="faqs" element={<FaqManagePage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="site-editor" element={<SiteEditorPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

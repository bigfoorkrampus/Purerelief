import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '@/admin/lib/admin-auth-store';

export function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAdminAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-tint">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

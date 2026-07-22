import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Image, FileText, Star, HelpCircle,
  Tag, Users, ShoppingCart, Settings, Menu as MenuIcon, LogOut, Palette,
} from 'lucide-react';
import { useState } from 'react';
import { useAdminAuthStore } from '@/admin/lib/admin-auth-store';

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; permission?: string };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package, permission: 'products.manage' },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree, permission: 'products.manage' },
  { label: 'Media', href: '/admin/media', icon: Image, permission: 'media.manage' },
  { label: 'Blog', href: '/admin/blog', icon: FileText, permission: 'blog.manage' },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, permission: 'reviews.manage' },
  { label: 'FAQ', href: '/admin/faqs', icon: HelpCircle, permission: 'settings.manage' },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag, permission: 'coupons.manage' },
  { label: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers.manage' },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, permission: 'orders.manage' },
  { label: 'Site Editor', href: '/admin/site-editor', icon: Palette, permission: 'settings.manage' },
  { label: 'Users', href: '/admin/users', icon: Users, permission: 'users.manage' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.manage' },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || user?.role === 'owner' || user?.permissions.includes(item.permission as never),
  );

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-surface-tint">
      {/* Sidebar */}
      <aside
  className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-cold-500 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2 8 9h8l-4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-[16px] font-bold tracking-tighter">Pure.Relief Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-50 hover:text-ink'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user?.fullName}</p>
              <p className="truncate text-xs capitalize text-ink-soft">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-ink-soft hover:text-red-500" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 bg-white px-5 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-display text-[15px] font-bold">Pure.Relief Admin</span>
        </div>
        <main className="p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

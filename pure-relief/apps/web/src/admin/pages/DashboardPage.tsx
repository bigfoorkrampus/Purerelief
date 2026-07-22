import { Package, ShoppingCart, Star, Users, TrendingUp } from 'lucide-react';
import { useAdminDashboard } from '@/admin/hooks/use-admin-data';
import { formatMoneyMinor } from '@/lib/format';

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Dashboard</h1>
      <p className="mt-1 text-ink-soft">An overview of your store's performance.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Revenue (30d)" value={isLoading ? '—' : formatMoneyMinor(data?.revenueLast30DaysMinor ?? 0)} />
        <MetricCard icon={ShoppingCart} label="Orders (30d)" value={isLoading ? '—' : String(data?.ordersLast30Days ?? 0)} />
        <MetricCard icon={Package} label="Published Products" value={isLoading ? '—' : `${data?.publishedProductCount ?? 0} / ${data?.productCount ?? 0}`} />
        <MetricCard icon={Star} label="Pending Reviews" value={isLoading ? '—' : String(data?.pendingReviewCount ?? 0)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-semibold text-ink">Recent Orders</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)
            ) : data?.recentOrders && data.recentOrders.length > 0 ? (
              (data.recentOrders as { order_number: string; customer_email: string; total_minor: number; status: string }[]).map((order) => (
                <div key={order.order_number} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{order.order_number}</p>
                    <p className="text-xs text-ink-soft">{order.customer_email}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatMoneyMinor(order.total_minor)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="font-semibold text-ink">Low Stock Alerts</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)
            ) : data?.lowStockVariants && data.lowStockVariants.length > 0 ? (
              (data.lowStockVariants as { name: string; label: string; stock_quantity: number }[]).map((v, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{v.name}</p>
                    <p className="text-xs text-ink-soft">{v.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-warm-600">{v.stock_quantity} left</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">All products well stocked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="card-surface p-6">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

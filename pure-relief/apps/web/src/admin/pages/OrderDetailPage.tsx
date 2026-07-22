import { useParams, Link } from 'react-router-dom';
import { useAdminOrder, useUpdateOrderStatus } from '@/admin/hooks/use-admin-data';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { formatMoneyMinor, formatDate } from '@/lib/format';
import type { OrderStatus } from '@pure-relief/shared';

const STATUS_OPTIONS: OrderStatus[] = ['pending_payment', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;
  if (!order) return <p className="text-ink-soft">Order not found.</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">← Back to Orders</Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-ink-soft">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-semibold text-ink">Update Status</h2>
          <select
            value={order.status}
            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })}
            className="input-field mt-3"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="card-surface p-6">
          <h2 className="font-semibold text-ink">Customer</h2>
          <p className="mt-3 text-sm text-ink">{order.customerEmail}</p>
          <p className="text-sm text-ink-soft">{order.shippingAddress.phone}</p>
        </div>
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="font-semibold text-ink">Shipping Address</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {order.shippingAddress.fullName}<br />
          {order.shippingAddress.line1}<br />
          {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
          {order.shippingAddress.city}, {order.shippingAddress.postcode}<br />
          {order.shippingAddress.country}
        </p>
      </div>

      <div className="card-surface mt-6 overflow-hidden p-0">
        <h2 className="p-6 pb-0 font-semibold text-ink">Items</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-y border-slate-100 bg-surface-tint">
            <tr>
              <th className="px-6 py-3 font-semibold text-ink-soft">Product</th>
              <th className="px-6 py-3 font-semibold text-ink-soft">Qty</th>
              <th className="px-6 py-3 text-right font-semibold text-ink-soft">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.lineItems.map((item, i) => (
              <tr key={i}>
                <td className="px-6 py-3">
                  <p className="font-medium text-ink">{item.nameSnapshot}</p>
                  <p className="text-xs text-ink-soft">{item.variantLabelSnapshot}</p>
                </td>
                <td className="px-6 py-3">{item.quantity}</td>
                <td className="px-6 py-3 text-right">{formatMoneyMinor(item.unitPrice.amountMinor * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-2 border-t border-slate-100 p-6">
          <div className="flex justify-between text-sm text-ink-soft"><span>Subtotal</span><span>{formatMoneyMinor(order.subtotal.amountMinor)}</span></div>
          {order.discount.amountMinor > 0 && (
            <div className="flex justify-between text-sm text-success-500"><span>Discount ({order.couponCode})</span><span>-{formatMoneyMinor(order.discount.amountMinor)}</span></div>
          )}
          <div className="flex justify-between text-sm text-ink-soft"><span>Shipping</span><span>{formatMoneyMinor(order.shipping.amountMinor)}</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-ink"><span>Total</span><span>{formatMoneyMinor(order.total.amountMinor)}</span></div>
        </div>
      </div>
    </div>
  );
}

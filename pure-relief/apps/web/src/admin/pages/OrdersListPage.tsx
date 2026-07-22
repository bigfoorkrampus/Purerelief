import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders } from '@/admin/hooks/use-admin-data';
import { DataTable, type Column } from '@/admin/components/DataTable';
import { AdminToolbar } from '@/admin/components/AdminToolbar';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { formatMoneyMinor, formatDate } from '@/lib/format';
import type { Order, OrderStatus } from '@pure-relief/shared';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export function OrdersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { data, isLoading } = useAdminOrders({ page, pageSize: 20, search: search || undefined, status: status || undefined });

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (o) => (
        <Link to={`/admin/orders/${o.id}`} className="font-mono text-sm font-medium text-ink hover:text-brand-600">
          {o.orderNumber}
        </Link>
      ),
    },
    { key: 'email', header: 'Customer', render: (o) => o.customerEmail },
    { key: 'total', header: 'Total', render: (o) => formatMoneyMinor(o.total.amountMinor) },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.createdAt) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Orders</h1>
      <p className="mt-1 text-ink-soft">Track and fulfil customer orders.</p>

      <div className="mt-8">
        <AdminToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          statusOptions={STATUS_OPTIONS}
          statusValue={status}
          onStatusChange={(v) => { setStatus(v as OrderStatus | ''); setPage(1); }}
          onExportCsv={() => window.open('/api/admin/orders/export/csv', '_blank')}
        />
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(o) => o.id}
          isLoading={isLoading}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="No orders yet."
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAdminCustomers } from '@/admin/hooks/use-admin-data';
import { DataTable, type Column } from '@/admin/components/DataTable';
import { AdminToolbar } from '@/admin/components/AdminToolbar';
import { formatDate } from '@/lib/format';
import type { Customer } from '@pure-relief/shared';

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminCustomers({ page, pageSize: 20, search: search || undefined });

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Name', render: (c) => c.fullName || '—' },
    { key: 'email', header: 'Email', render: (c) => c.email },
    { key: 'phone', header: 'Phone', render: (c) => c.phone ?? '—' },
    { key: 'marketing', header: 'Marketing', render: (c) => (c.marketingOptIn ? 'Opted in' : 'Opted out') },
    { key: 'joined', header: 'Joined', render: (c) => formatDate(c.createdAt) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Customers</h1>
      <p className="mt-1 text-ink-soft">Everyone who has ordered or subscribed.</p>

      <div className="mt-8">
        <AdminToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(c) => c.id}
          isLoading={isLoading}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="No customers yet."
        />
      </div>
    </div>
  );
}

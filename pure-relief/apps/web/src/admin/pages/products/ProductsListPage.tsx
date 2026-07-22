import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  useAdminProducts, useDeleteProduct, useBulkUpdateProductStatus, useBulkDeleteProducts, useImportProductsCsv,
} from '@/admin/hooks/use-admin-data';
import { DataTable, type Column } from '@/admin/components/DataTable';
import { AdminToolbar } from '@/admin/components/AdminToolbar';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { formatMoneyMinor } from '@/lib/format';
import type { Product, ProductStatus } from '@pure-relief/shared';

export function ProductsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAdminProducts({ page, pageSize: 20, search: search || undefined, status: status || undefined });
  const deleteProduct = useDeleteProduct();
  const bulkStatus = useBulkUpdateProductStatus();
  const bulkDelete = useBulkDeleteProducts();
  const importCsv = useImportProductsCsv();

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <Link to={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-brand-600">{p.name}</Link>
          <p className="text-xs text-ink-soft">/{p.slug}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => {
        const v = p.variants.find((x) => x.isDefault) ?? p.variants[0];
        return v ? formatMoneyMinor(v.price.amountMinor) : '—';
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-3">
          <Link to={`/admin/products/${p.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">Edit</Link>
          <button
            onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p.id); }}
            className="text-sm font-medium text-red-500 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    setSelected((prev) => (prev.size === data.items.length ? new Set() : new Set(data.items.map((p) => p.id))));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Products</h1>
          <p className="mt-1 text-ink-soft">Manage your catalogue.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      <div className="mt-8">
        <AdminToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          statusOptions={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ]}
          statusValue={status}
          onStatusChange={(v) => { setStatus(v as ProductStatus | ''); setPage(1); }}
          selectedCount={selected.size}
          onBulkPublish={() => { bulkStatus.mutate({ ids: [...selected], status: 'published' }); setSelected(new Set()); }}
          onBulkDelete={() => { if (confirm(`Delete ${selected.size} products?`)) { bulkDelete.mutate([...selected]); setSelected(new Set()); } }}
          onExportCsv={() => window.open('/api/admin/products/export/csv', '_blank')}
          onImportCsv={(file) => importCsv.mutate(file, { onSuccess: (r) => alert(`Imported ${r.imported}, failed ${r.failed}`) })}
        />

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(p) => p.id}
          isLoading={isLoading}
          selectedIds={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="No products found. Create your first product to get started."
        />
      </div>
    </div>
  );
}

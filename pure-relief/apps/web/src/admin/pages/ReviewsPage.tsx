import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAdminReviews, useSetReviewStatus } from '@/admin/hooks/use-admin-data';
import { DataTable, type Column } from '@/admin/components/DataTable';
import { AdminToolbar } from '@/admin/components/AdminToolbar';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { formatDate } from '@/lib/format';
import type { Review, ReviewStatus } from '@pure-relief/shared';

export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReviewStatus | ''>('pending');
  const { data, isLoading } = useAdminReviews({ page, pageSize: 20, status: status || undefined });
  const setReviewStatus = useSetReviewStatus();

  const columns: Column<Review>[] = [
    {
      key: 'review',
      header: 'Review',
      render: (r) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-warm-400 text-warm-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-ink">{r.title}</span>
          </div>
          <p className="mt-1 truncate text-sm text-ink-soft">{r.body}</p>
        </div>
      ),
    },
    { key: 'author', header: 'Author', render: (r) => r.authorName },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status !== 'approved' && (
            <button onClick={() => setReviewStatus.mutate({ id: r.id, status: 'approved' })} className="rounded-lg bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-500 hover:bg-success-500 hover:text-white">
              Approve
            </button>
          )}
          {r.status !== 'rejected' && (
            <button onClick={() => setReviewStatus.mutate({ id: r.id, status: 'rejected' })} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-500 hover:text-white">
              Reject
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Reviews</h1>
      <p className="mt-1 text-ink-soft">Moderate customer reviews before they appear on product pages.</p>

      <div className="mt-8">
        <AdminToolbar
          searchValue=""
          onSearchChange={() => {}}
          statusOptions={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
          statusValue={status}
          onStatusChange={(v) => { setStatus(v as ReviewStatus | ''); setPage(1); }}
        />
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="No reviews to moderate."
        />
      </div>
    </div>
  );
}

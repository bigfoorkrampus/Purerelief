import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAdminBlogPosts, useDeleteBlogPost } from '@/admin/hooks/use-admin-data';
import { DataTable, type Column } from '@/admin/components/DataTable';
import { AdminToolbar } from '@/admin/components/AdminToolbar';
import { StatusBadge } from '@/admin/components/StatusBadge';
import { formatDate } from '@/lib/format';
import type { BlogPost, BlogPostStatus } from '@pure-relief/shared';

export function BlogListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BlogPostStatus | ''>('');
  const { data, isLoading } = useAdminBlogPosts({ page, pageSize: 20, search: search || undefined, status: status || undefined });
  const deletePost = useDeleteBlogPost();

  const columns: Column<BlogPost>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (p) => (
        <div>
          <Link to={`/admin/blog/${p.id}`} className="font-medium text-ink hover:text-brand-600">{p.title}</Link>
          <p className="text-xs text-ink-soft">/{p.slug}</p>
        </div>
      ),
    },
    { key: 'author', header: 'Author', render: (p) => p.authorName },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'date', header: 'Published', render: (p) => (p.publishedAt ? formatDate(p.publishedAt) : '—') },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-3">
          <Link to={`/admin/blog/${p.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">Edit</Link>
          <button onClick={() => { if (confirm(`Delete "${p.title}"?`)) deletePost.mutate(p.id); }} className="text-sm font-medium text-red-500 hover:text-red-600">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Blog</h1>
          <p className="mt-1 text-ink-soft">Publish articles and wellness guides.</p>
        </div>
        <Link to="/admin/blog/new" className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      <div className="mt-8">
        <AdminToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          statusOptions={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]}
          statusValue={status}
          onStatusChange={(v) => { setStatus(v as BlogPostStatus | ''); setPage(1); }}
        />
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(p) => p.id}
          isLoading={isLoading}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="No posts yet."
        />
      </div>
    </div>
  );
}

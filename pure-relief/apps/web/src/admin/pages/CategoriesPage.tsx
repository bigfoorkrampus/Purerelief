import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminCategories, useDeleteCategory } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { slugify } from '@/lib/format';

export function CategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const deleteCategory = useDeleteCategory();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setIsSaving(true);
    try {
      await api.post(
        '/api/admin/categories',
        { slug: slugify(name), name, description, seo: { title: name, metaDescription: description, canonicalPath: `/shop/${slugify(name)}` } },
        readCsrfCookie(),
      );
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      // Public storefront reads categories under a separate 'categories' key
      // (see apps/web/src/hooks/use-storefront.ts). Without this, a newly
      // created category wouldn't show up in the shop's filter list until
      // its 5-minute staleTime expired.
      qc.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      setDescription('');
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Categories</h1>
          <p className="mt-1 text-ink-soft">Organize your products into browsable groups.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {showForm && (
        <div className="card-surface mt-6 space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
          </div>
          <button onClick={handleCreate} disabled={isSaving || !name} className="btn-primary text-sm">
            {isSaving ? 'Saving…' : 'Create'}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
        ) : categories && categories.length > 0 ? (
          categories.map((cat) => (
            <div key={cat.id} className="card-surface flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-ink">{cat.name}</p>
                <p className="text-sm text-ink-soft">/{cat.slug}</p>
              </div>
              <button
                onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCategory.mutate(cat.id); }}
                className="text-red-500 hover:text-red-600"
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-ink-soft">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

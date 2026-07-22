import { useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { useAdminMedia, useUploadMedia, useDeleteMedia } from '@/admin/hooks/use-admin-data';
import { mediaUrl } from '@/lib/format';

export function MediaPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminMedia({ page, pageSize: 30 });
  const upload = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const altText = prompt('Alt text for this image (for accessibility and SEO):', file.name) ?? '';
    upload.mutate({ file, altText });
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Media Library</h1>
          <p className="mt-1 text-ink-soft">Upload images to R2 for use across products and blog posts.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending} className="btn-primary px-4 py-2.5 text-sm">
          <Upload className="h-4 w-4" /> {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {isLoading
          ? [...Array(12)].map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-100" />)
          : data?.items.map((asset) => (
              <div key={asset.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-tint">
                {asset.isPlaceholder ? (
                  <div className="flex h-full items-center justify-center text-xs text-ink-soft/50 p-2 text-center">Placeholder</div>
                ) : (
                  <img src={mediaUrl(asset.r2Key)} alt={asset.altText} className="h-full w-full object-cover" />
                )}
                <button
                  onClick={() => { if (confirm('Delete this asset?')) deleteMedia.mutate(asset.id); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow-soft transition-opacity group-hover:opacity-100"
                  aria-label="Delete asset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
      </div>

      {data && data.total > 30 && (
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
            Previous
          </button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 30 >= data.total} className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

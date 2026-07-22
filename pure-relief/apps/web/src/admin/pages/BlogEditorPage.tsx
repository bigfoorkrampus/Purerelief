import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blogPostInputSchema } from '@pure-relief/shared';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, readCsrfCookie, ApiClientError } from '@/lib/api-client';
import { slugify } from '@/lib/format';
import type { BlogPost } from '@pure-relief/shared';

type FormValues = z.infer<typeof blogPostInputSchema>;

export function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin-blog-post', id],
    queryFn: () => api.get<BlogPost>(`/api/admin/blog/${id}`),
    enabled: !isNew,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(blogPostInputSchema),
    defaultValues: { status: 'draft', tags: [], authorName: 'Pure Relief Team', seo: { title: '', metaDescription: '', canonicalPath: '' } },
  });

  const title = watch('title');
  const slug = watch('slug');

  useEffect(() => {
    if (existing) reset({ ...existing, seo: existing.seo });
  }, [existing, reset]);

  useEffect(() => {
    if (isNew && title && !slug) setValue('slug', slugify(title));
  }, [title, slug, isNew, setValue]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setIsSaving(true);
    try {
      if (isNew) {
        const created = await api.post<BlogPost>('/api/admin/blog', values, readCsrfCookie());
        qc.invalidateQueries({ queryKey: ['admin-blog'] });
        navigate(`/admin/blog/${created.id}`, { replace: true });
      } else {
        await api.put(`/api/admin/blog/${id}`, values, readCsrfCookie());
        qc.invalidateQueries({ queryKey: ['admin-blog'] });
        qc.invalidateQueries({ queryKey: ['admin-blog-post', id] });
      }
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : 'Failed to save post.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isNew && isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">{isNew ? 'New Post' : 'Edit Post'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {serverError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</div>}

        <div className="card-surface space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
            <input {...register('title')} className={`input-field ${errors.title ? 'input-error' : ''}`} />
            {errors.title && <p className="field-error-text">{errors.title.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">URL Slug</label>
            <input {...register('slug')} className={`input-field ${errors.slug ? 'input-error' : ''}`} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Excerpt</label>
            <textarea rows={2} {...register('excerpt')} className={`input-field resize-none ${errors.excerpt ? 'input-error' : ''}`} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Content (HTML)</label>
            <textarea rows={12} {...register('contentHtml')} className={`input-field resize-none font-mono text-[13px] ${errors.contentHtml ? 'input-error' : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Author</label>
              <input {...register('authorName')} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
              <select {...register('status')} className="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-surface space-y-4 p-6">
          <h2 className="font-semibold text-ink">SEO</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">SEO Title</label>
            <input {...register('seo.title')} className={`input-field ${errors.seo?.title ? 'input-error' : ''}`} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Meta Description</label>
            <textarea rows={2} {...register('seo.metaDescription')} className={`input-field resize-none ${errors.seo?.metaDescription ? 'input-error' : ''}`} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Canonical Path</label>
            <input {...register('seo.canonicalPath')} placeholder="/blog/your-slug" className="input-field" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/blog')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Saving…' : 'Save Post'}</button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productInputSchema } from '@pure-relief/shared';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminProduct, useAdminCategories } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie, ApiClientError } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { slugify } from '@/lib/format';
import type { Product } from '@pure-relief/shared';

type FormValues = z.infer<typeof productInputSchema>;

const emptyVariant = { option: 'single' as const, sku: '', label: '', priceMinor: 0, compareAtPriceMinor: null, stockQuantity: 0, isDefault: true };

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const { data: existingProduct, isLoading } = useAdminProduct(isNew ? undefined : id);
  const { data: categories } = useAdminCategories();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      status: 'draft',
      categoryIds: [],
      variants: [emptyVariant],
      seo: { title: '', metaDescription: '', canonicalPath: '' },
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });

  const name = watch('name');
  const slug = watch('slug');

  useEffect(() => {
    if (existingProduct) {
      reset(productToFormValues(existingProduct));
    }
  }, [existingProduct, reset]);

  // Auto-generate slug from name only while creating a new, untouched product.
  useEffect(() => {
    if (isNew && name && !slug) {
      setValue('slug', slugify(name));
    }
  }, [name, slug, isNew, setValue]);

  // Lightweight autosave-to-draft: every 30s while dirty, silently PUT as draft (existing products only).
  useEffect(() => {
    if (isNew || !isDirty) return;
    const interval = setInterval(() => {
      handleSubmit((values) => saveProduct(values, true))();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isNew, isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProduct(values: FormValues, isAutosave = false) {
    setServerError(null);
    if (!isAutosave) setIsSaving(true);
    try {
      if (isNew) {
        const created = await api.post<Product>('/api/admin/products', values, readCsrfCookie());
        qc.invalidateQueries({ queryKey: ['admin-products'] });
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else {
        await api.put(`/api/admin/products/${id}`, values, readCsrfCookie());
        qc.invalidateQueries({ queryKey: ['admin-products'] });
        qc.invalidateQueries({ queryKey: ['admin-product', id] });
        setLastSavedAt(new Date());
      }
    } catch (err) {
      if (!isAutosave) setServerError(err instanceof ApiClientError ? err.message : 'Failed to save product.');
    } finally {
      if (!isAutosave) setIsSaving(false);
    }
  }

  if (!isNew && isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">{isNew ? 'New Product' : 'Edit Product'}</h1>
        {lastSavedAt && <p className="text-xs text-ink-soft">Autosaved at {lastSavedAt.toLocaleTimeString()}</p>}
      </div>

      <form onSubmit={handleSubmit((v) => saveProduct(v))} className="mt-8 space-y-8">
        {serverError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</div>}

        <section className="card-surface p-6">
          <h2 className="font-semibold text-ink">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
              <input {...register('name')} className={`input-field ${errors.name ? 'input-error' : ''}`} />
              {errors.name && <p className="field-error-text">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">URL Slug</label>
              <input {...register('slug')} className={`input-field ${errors.slug ? 'input-error' : ''}`} />
              {errors.slug && <p className="field-error-text">{errors.slug.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Short Description</label>
              <textarea rows={2} {...register('shortDescription')} className={`input-field resize-none ${errors.shortDescription ? 'input-error' : ''}`} />
              {errors.shortDescription && <p className="field-error-text">{errors.shortDescription.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Full Description (HTML)</label>
              <textarea rows={6} {...register('descriptionHtml')} className={`input-field resize-none font-mono text-[13px] ${errors.descriptionHtml ? 'input-error' : ''}`} />
              {errors.descriptionHtml && <p className="field-error-text">{errors.descriptionHtml.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
              <select {...register('status')} className="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Categories</label>
              <select multiple {...register('categoryIds')} className="input-field h-24">
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Variants</h2>
            <button type="button" onClick={() => appendVariant(emptyVariant)} className="btn-ghost text-sm">
              <Plus className="h-4 w-4" /> Add Variant
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {variantFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-6">
                <select {...register(`variants.${index}.option`)} className="input-field py-2 text-sm">
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
                <input {...register(`variants.${index}.label`)} placeholder="Label" className="input-field py-2 text-sm" />
                <input {...register(`variants.${index}.sku`)} placeholder="SKU" className="input-field py-2 text-sm" />
                <input
                  type="number"
                  {...register(`variants.${index}.priceMinor`, { valueAsNumber: true })}
                  placeholder="Price (pence)"
                  className="input-field py-2 text-sm"
                />
                <input
                  type="number"
                  {...register(`variants.${index}.stockQuantity`, { valueAsNumber: true })}
                  placeholder="Stock"
                  className="input-field py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={variantFields.length === 1}
                  className="flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {errors.variants && <p className="field-error-text">{errors.variants.message as string}</p>}
          </div>
        </section>

        <section className="card-surface p-6">
          <h2 className="font-semibold text-ink">SEO</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">SEO Title</label>
              <input {...register('seo.title')} className={`input-field ${errors.seo?.title ? 'input-error' : ''}`} />
              {errors.seo?.title && <p className="field-error-text">{errors.seo.title.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Meta Description</label>
              <textarea rows={2} {...register('seo.metaDescription')} className={`input-field resize-none ${errors.seo?.metaDescription ? 'input-error' : ''}`} />
              {errors.seo?.metaDescription && <p className="field-error-text">{errors.seo.metaDescription.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Canonical Path</label>
              <input {...register('seo.canonicalPath')} placeholder="/product/your-slug" className="input-field" />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Saving…' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}

function productToFormValues(product: Product): FormValues {
  return {
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    descriptionHtml: product.descriptionHtml,
    categoryIds: product.categoryIds,
    status: product.status,
    variants: product.variants.map((v) => ({
      id: v.id,
      option: v.option,
      sku: v.sku,
      label: v.label,
      priceMinor: v.price.amountMinor,
      compareAtPriceMinor: v.compareAtPrice?.amountMinor ?? null,
      stockQuantity: v.stockQuantity,
      isDefault: v.isDefault,
    })),
    seo: {
      title: product.seo.title,
      metaDescription: product.seo.metaDescription,
      canonicalPath: product.seo.canonicalPath,
      ogImageKey: product.seo.ogImageKey,
      noIndex: product.seo.noIndex ?? false,
    },
  };
}

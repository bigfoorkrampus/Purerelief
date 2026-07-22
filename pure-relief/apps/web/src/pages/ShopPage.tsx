import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';
import { useProducts, useCategories } from '@/hooks/use-storefront';
import { ProductCard } from '@/components/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
];

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const sort = searchParams.get('sort') ?? 'newest';
  const categoryId = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const { data: categories } = useCategories();
  const { data: productsData, isLoading } = useProducts({ page, pageSize: 12, sort, categoryId, search });

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  const totalPages = productsData ? Math.ceil(productsData.total / productsData.pageSize) : 1;

  return (
    <>
      <Seo
        title="Shop Migraine Relief Products"
        description="Browse the full Pure Relief range — single caps and combo packs engineered for 360° cold and hot therapy relief."
        canonicalPath="/shop"
        jsonLd={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
        ])}
      />

      <div className="container-page py-12 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-ink">Shop</h1>
          <p className="mt-3 text-lg text-ink-soft">Single caps and combo packs — reusable, drug-free relief.</p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam('search', searchInput || null);
            }}
            className="relative w-full sm:max-w-xs"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="input-field pl-11"
              aria-label="Search products"
            />
          </form>

          <div className="flex items-center gap-3">
            {categories && categories.length > 0 && (
              <select
                value={categoryId ?? ''}
                onChange={(e) => updateParam('category', e.target.value || null)}
                className="input-field w-auto py-2.5"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field w-auto py-2.5 pl-9"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-surface aspect-[4/5] animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : productsData && productsData.items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productsData.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card-surface flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-semibold text-ink">No products found</p>
              <p className="mt-2 text-ink-soft">Try a different search term or clear your filters.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => updateParam('page', String(i + 1))}
                className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
                  page === i + 1 ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-slate-100'
                }`}
                aria-current={page === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

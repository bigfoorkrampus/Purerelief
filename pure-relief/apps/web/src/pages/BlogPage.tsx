import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';
import { useBlogPosts } from '@/hooks/use-storefront';
import { formatDate, mediaUrl } from '@/lib/format';

export function BlogPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBlogPosts({ pageSize: 9, search: search || undefined });

  return (
    <>
      <Seo
        title="Blog — Migraine & Wellness Insights"
        description="Guides and insights on migraine relief, headache self-care, and drug-free wellness from Pure Relief."
        canonicalPath="/blog"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])}
      />

      <div className="container-page py-16 lg:py-24">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-ink sm:text-5xl">Blog</h1>
            <p className="mt-3 text-lg text-ink-soft">Insights on migraine relief and everyday wellness.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="input-field pl-11"
            />
          </div>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-slate-100" />)
            : data?.items.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group card-surface flex flex-col overflow-hidden">
                  <div className="media-placeholder aspect-[16/10] w-full">
                    {post.coverImageKey ? (
                      <img src={mediaUrl(post.coverImageKey)} alt={post.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-ink/40">Cover image coming soon</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-medium text-ink-soft">{post.publishedAt && formatDate(post.publishedAt)}</p>
                    <h2 className="mt-2 font-semibold text-ink group-hover:text-brand-600">{post.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
        </div>

        {!isLoading && data?.items.length === 0 && (
          <div className="mt-14 text-center text-ink-soft">No articles found.</div>
        )}
      </div>
    </>
  );
}

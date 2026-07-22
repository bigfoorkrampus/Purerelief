import { useParams, Navigate, Link } from 'react-router-dom';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';
import { useBlogPost } from '@/hooks/use-storefront';
import { formatDate, mediaUrl } from '@/lib/format';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-100" />
          <div className="aspect-[16/9] animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }
  if (isError || !post) return <Navigate to="/404" replace />;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.authorName },
  };

  return (
    <>
      <Seo
        title={post.seo.title || post.title}
        description={post.seo.metaDescription || post.excerpt}
        canonicalPath={post.seo.canonicalPath || `/blog/${post.slug}`}
        noIndex={post.seo.noIndex}
        type="article"
        jsonLd={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleJsonLd,
        ]}
      />

      <article className="container-page py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-ink-soft">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-brand-600">Blog</Link>
          </nav>

          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-ink-soft">
            <span>{post.authorName}</span>
            <span>·</span>
            <span>{post.publishedAt && formatDate(post.publishedAt)}</span>
          </div>

          {post.coverImageKey && (
            <div className="media-placeholder mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl">
              <img src={mediaUrl(post.coverImageKey)} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div
            className="prose prose-slate mt-10 max-w-none prose-headings:font-display prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-ink-soft"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-100 pt-8">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-tint px-3 py-1 text-xs font-medium text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
}

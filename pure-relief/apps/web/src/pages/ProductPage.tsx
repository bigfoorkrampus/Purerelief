import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Star, Truck, ShieldCheck, RotateCcw, Minus, Plus, ChevronDown } from 'lucide-react';
import { Seo, breadcrumbJsonLd, productJsonLd, faqJsonLd } from '@/components/Seo';
import { useProduct, useProductReviews, useSubmitReview } from '@/hooks/use-storefront';
import { ProductMedia } from '@/components/ProductMedia';
import { ProductCard } from '@/components/ProductCard';
import { formatMoneyMinor, formatDate } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Product } from '@pure-relief/shared';
import { ReviewForm } from '@/components/ReviewForm';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug);

  if (isLoading) return <ProductPageSkeleton />;
  if (isError || !product) return <Navigate to="/404" replace />;

  return <ProductPageContent product={product} />;
}

function ProductPageContent({ product }: { product: Product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id ?? '',
  );
  const [quantity, setQuantity] = useState(1);
  const [openFaqId, setOpenFaqId] = useState<string | null>(product.faqs[0]?.id ?? null);

  const { data: reviews } = useProductReviews(product.slug);
  const submitReview = useSubmitReview(product.slug);
  const addItem = useCartStore((s) => s.addItem);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0]!;
  const activeImage = product.images[activeImageIndex];

  const relatedQuery = useQuery({
    queryKey: ['related-products', product.relatedProductIds],
    queryFn: async () => {
      const results = await Promise.all(
        product.relatedProductIds.slice(0, 3).map((id) => api.get<Product>(`/api/products/by-id/${id}`).catch(() => null)),
      );
      return results.filter((p): p is Product => p !== null);
    },
    enabled: product.relatedProductIds.length > 0,
  });

  function handleAddToCart() {
    addItem({ productId: product.id, variantId: selectedVariant.id, quantity });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <>
      <Seo
        title={product.seo.title || product.name}
        description={product.seo.metaDescription || product.shortDescription}
        canonicalPath={product.seo.canonicalPath || `/product/${product.slug}`}
        noIndex={product.seo.noIndex}
        type="product"
        jsonLd={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
          productJsonLd({
            name: product.name,
            description: product.shortDescription,
            slug: product.slug,
            images: product.images,
            variants: product.variants,
            avgRating: product.avgRating,
            reviewCount: product.reviewCount,
          }),
          ...(product.faqs.length ? [faqJsonLd(product.faqs)] : []),
        ]}
      />

      <div className="container-page py-10 lg:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-ink-soft">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-brand-600">Shop</Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="media-placeholder aspect-square w-full rounded-3xl">
              <ProductMedia image={activeImage} className="h-full w-full rounded-3xl object-cover" priority />
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                      i === activeImageIndex ? 'border-brand-600' : 'border-transparent hover:border-slate-200'
                    }`}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === activeImageIndex}
                  >
                    <ProductMedia image={img} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy box */}
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">{product.name}</h1>

            {product.reviewCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.avgRating) ? 'fill-warm-400 text-warm-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-ink-soft">
                  {product.avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount === 1 ? '' : 's'})
                </span>
              </div>
            )}

            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>

            <div className="mt-7 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ink">{formatMoneyMinor(selectedVariant.price.amountMinor)}</span>
              {selectedVariant.compareAtPrice && (
                <span className="text-lg text-ink-soft line-through">{formatMoneyMinor(selectedVariant.compareAtPrice.amountMinor)}</span>
              )}
              {selectedVariant.stockQuantity <= 10 && selectedVariant.stockQuantity > 0 && (
                <span className="text-sm font-medium text-warm-600">Only {selectedVariant.stockQuantity} left</span>
              )}
            </div>

            {/* Variant selector */}
            {product.variants.length > 1 && (
              <div className="mt-7">
                <p className="text-sm font-semibold text-ink">Pack size</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-2xl border-2 px-4 py-3 text-center transition-colors ${
                        variant.id === selectedVariantId ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      aria-pressed={variant.id === selectedVariantId}
                    >
                      <span className="block text-sm font-semibold text-ink">{variant.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{formatMoneyMinor(variant.price.amountMinor)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + add to cart */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-2xl border border-slate-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center text-ink-soft hover:text-ink"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-12 w-12 items-center justify-center text-ink-soft hover:text-ink"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={selectedVariant.stockQuantity === 0}
                className="btn-primary flex-1"
              >
                {selectedVariant.stockQuantity === 0 ? 'Out of Stock' : addedToCart ? 'Added ✓' : 'Add to Cart'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
              <TrustBadge icon={Truck} label="Free UK Delivery" />
              <TrustBadge icon={RotateCcw} label="30-Day Returns" />
              <TrustBadge icon={ShieldCheck} label="Non-Toxic & Safe" />
            </div>

            {/* Benefits */}
            {product.benefits.length > 0 && (
              <div className="mt-9 grid grid-cols-2 gap-4">
                {product.benefits.map((benefit) => (
                  <div key={benefit.id} className="rounded-2xl bg-surface-tint p-4">
                    <p className="text-sm font-semibold text-ink">{benefit.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{benefit.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        {product.specs.length > 0 && (
          <section className="mt-20 border-t border-slate-100 pt-14">
            <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">Technical Specifications</h2>
            <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-3 gap-4 px-6 py-4">
                  <dt className="text-sm font-medium text-ink-soft">{spec.label}</dt>
                  <dd className="col-span-2 text-sm text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Description */}
        <section className="mt-14 max-w-3xl">
          <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">About This Product</h2>
          <div
            className="prose prose-slate mt-6 max-w-none prose-p:leading-relaxed prose-p:text-ink-soft"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </section>

        {/* FAQ */}
        {product.faqs.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">Frequently Asked Questions</h2>
            <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {product.faqs.map((faq) => (
                <div key={faq.id}>
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={openFaqId === faq.id}
                  >
                    <span className="font-medium text-ink pr-4">{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${openFaqId === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqId === faq.id && <p className="px-6 pb-5 text-[15px] leading-relaxed text-ink-soft">{faq.answer}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="mt-14 max-w-3xl">
          <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">Reviews</h2>
          <div className="mt-6 space-y-6">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="card-surface p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-warm-400 text-warm-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-ink-soft">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-3 font-semibold text-ink">{review.title}</p>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{review.body}</p>
                  <p className="mt-3 text-xs font-medium text-ink-soft">
                    {review.authorName}
                    {review.verifiedPurchase && <span className="ml-2 text-success-500">Verified Purchase</span>}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-ink-soft">Be the first to review this product.</p>
            )}
          </div>

          <div className="mt-8">
            <ReviewForm
              onSubmit={(values) => submitReview.mutate(values)}
              isSubmitting={submitReview.isPending}
              isSuccess={submitReview.isSuccess}
            />
          </div>
        </section>

        {/* Related products */}
        {relatedQuery.data && relatedQuery.data.length > 0 && (
          <section className="mt-20 border-t border-slate-100 pt-14">
            <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">You May Also Like</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedQuery.data.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: typeof Truck; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Icon className="h-5 w-5 text-brand-600" />
      <span className="text-[12.5px] font-medium text-ink-soft">{label}</span>
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="container-page py-14">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-100" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-6 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="h-6 w-5/6 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-14 w-1/3 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

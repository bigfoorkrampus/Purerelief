import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product } from '@pure-relief/shared';
import { ProductMedia } from '@/components/ProductMedia';
import { formatMoneyMinor } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group card-surface flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-tint">
        <ProductMedia image={product.images[0]} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {defaultVariant?.compareAtPrice && (
          <span className="absolute left-3 top-3 rounded-full bg-warm-500 px-2.5 py-1 text-[11px] font-bold text-white">
            Save {Math.round((1 - defaultVariant.price.amountMinor / defaultVariant.compareAtPrice.amountMinor) * 100)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-ink">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">{product.shortDescription}</p>

        {product.reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.avgRating) ? 'fill-warm-400 text-warm-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-xs text-ink-soft">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-4">
          {defaultVariant && (
            <>
              <span className="text-lg font-bold text-ink">{formatMoneyMinor(defaultVariant.price.amountMinor)}</span>
              {defaultVariant.compareAtPrice && (
                <span className="text-sm text-ink-soft line-through">{formatMoneyMinor(defaultVariant.compareAtPrice.amountMinor)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

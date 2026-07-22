import { mediaUrl } from '@/lib/format';
import type { MediaAsset } from '@pure-relief/shared';

type ProductMediaProps = {
  image: MediaAsset | undefined;
  className?: string;
  priority?: boolean;
};

/**
 * Renders the real R2-hosted image when one has been uploaded (isPlaceholder=false),
 * otherwise renders a branded placeholder block. Swapping in real photography later
 * requires zero frontend changes — the admin media uploader flips is_placeholder to
 * false and sets the real r2_key, and this component picks it up automatically.
 */
export function ProductMedia({ image, className = '', priority = false }: ProductMediaProps) {
  if (!image || image.isPlaceholder) {
    return (
      <div className={`media-placeholder ${className}`} role="img" aria-label={image?.altText ?? 'Product photo coming soon'}>
        <PlaceholderIcon />
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ink/50 backdrop-blur">
          Photography coming soon
        </span>
      </div>
    );
  }

  return (
    <img
      src={mediaUrl(image.r2Key)}
      alt={image.altText}
      width={image.width || undefined}
      height={image.height || undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
}

function PlaceholderIcon() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" className="text-brand-300/70" aria-hidden="true">
      <path
        d="M4 7c0-1.1.9-2 2-2h2l1.2-1.6c.2-.25.5-.4.8-.4h3.9c.3 0 .6.15.8.4L16 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

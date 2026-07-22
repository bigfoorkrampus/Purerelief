import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '@/components/Seo';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page Not Found" description="The page you're looking for doesn't exist." canonicalPath="/404" noIndex />
      <div className="container-page flex flex-col items-center py-28 text-center">
        <p className="font-display text-8xl font-extrabold tracking-tighter text-brand-100">404</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-ink">Page not found</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          The page you're looking for might have been moved or no longer exists. Let's get you back on track.
        </p>
        <Link to="/" className="btn-primary mt-8">
          Back to Home <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}

import type { ReactNode } from 'react';
import { Seo } from '@/components/Seo';

type LegalPageLayoutProps = {
  title: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, description, canonicalPath, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <>
      <Seo title={title} description={description} canonicalPath={canonicalPath} />
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">Last updated: {lastUpdated}</p>
          <div className="prose prose-slate mt-10 max-w-none prose-headings:font-display prose-headings:tracking-tighter prose-h2:mt-10 prose-h2:text-xl prose-p:leading-relaxed prose-p:text-ink-soft prose-li:text-ink-soft">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

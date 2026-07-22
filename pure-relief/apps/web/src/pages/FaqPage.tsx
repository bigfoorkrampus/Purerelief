import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Seo, faqJsonLd, breadcrumbJsonLd } from '@/components/Seo';
import { useFaqs } from '@/hooks/use-storefront';

export function FaqPage() {
  const { data: faqs, isLoading } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    if (!faqs) return {};
    return faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
      (acc[faq.category] ??= []).push(faq);
      return acc;
    }, {});
  }, [faqs]);

  return (
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Answers to common questions about the Pure Relief Migraine Cap — usage, safety, care, and more."
        canonicalPath="/faq"
        jsonLd={[
          breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]),
          ...(faqs && faqs.length ? [faqJsonLd(faqs)] : []),
        ]}
      />

      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-ink sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-ink-soft">Everything you need to know about using your Migraine Relief Cap safely.</p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-10">
          {isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}

          {Object.entries(grouped).map(([category, entries]) => (
            <div key={category}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-600">{category}</h2>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {entries.map((faq) => (
                  <div key={faq.id}>
                    <button
                      onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                      className="flex w-full items-center justify-between px-6 py-5 text-left"
                      aria-expanded={openId === faq.id}
                    >
                      <span className="font-medium text-ink pr-4">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${openId === faq.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openId === faq.id && <p className="px-6 pb-5 text-[15px] leading-relaxed text-ink-soft">{faq.answer}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { Snowflake, Sun, Activity, Thermometer } from 'lucide-react';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';

const SCIENCE_POINTS = [
  {
    icon: Snowflake,
    title: 'Vasoconstriction',
    description: 'Cold narrows dilated blood vessels around the skull, reducing the inflammatory signalling linked to migraine pain.',
  },
  {
    icon: Activity,
    title: 'Nerve Deceleration',
    description: 'Cooling slows nerve conduction, helping the brain register a calming sensation instead of throbbing pain.',
  },
  {
    icon: Thermometer,
    title: 'Metabolic Reduction',
    description: 'Lower tissue temperature reduces cellular ATP demand, limiting the molecules that activate pain receptors.',
  },
  {
    icon: Sun,
    title: 'Muscular Relaxation',
    description: 'For tension headaches, gentle heat dilates vessels and eases tight muscles across the neck and scalp.',
  },
];

export function AboutPage() {
  return (
    <>
      <Seo
        title="About Pure Relief"
        description="Pure Relief creates drug-free wellness tools grounded in real physiology — starting with our reusable Migraine Relief Cap."
        canonicalPath="/about"
        jsonLd={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Our Story</span>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tighter text-ink sm:text-5xl">Wellness for every day</h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Pure Relief was founded on a simple idea: chronic pain deserves better tools than another pill. Millions in
            the UK live with recurring migraines and headaches, often caught in a cycle of acute painkillers that can
            themselves trigger rebound headaches. We build reusable, drug-free products that address the underlying
            physiology — not just the symptom.
          </p>
        </div>

        <section className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tighter text-ink">The science behind the cap</h2>
            <p className="mt-4 text-lg text-ink-soft">
              Localized cryotherapy has a clinical history of more than 150 years. Here's how it actually works.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SCIENCE_POINTS.map((point) => (
              <div key={point.title} className="card-surface p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cold-50 text-cold-600">
                  <point.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-ink">{point.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{point.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-4xl bg-surface-tint p-10 lg:p-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold tracking-tighter text-ink">A note on medical advice</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Our products are designed to support a self-care routine alongside — never in place of — professional
              medical guidance. If your headaches change pattern, become more frequent or severe, or you find yourself
              needing painkillers more than two days a week, please speak to a GP. People with Raynaud's phenomenon,
              poor circulation, diabetes, or cardiovascular disease should seek medical advice before using
              temperature-based therapies.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

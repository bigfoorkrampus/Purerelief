import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormValues } from '@pure-relief/shared';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Seo, breadcrumbJsonLd } from '@/components/Seo';
import { useContactForm, useSiteConfig } from '@/hooks/use-storefront';

export function ContactPage() {
  const { data: config } = useSiteConfig();
  const contactMutation = useContactForm();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema) });

  function onSubmit(values: ContactFormValues) {
    contactMutation.mutate(values, { onSuccess: () => reset() });
  }

  return (
    <>
      <Seo
        title="Contact Us"
        description="Get in touch with the Pure Relief team — we're here to help with orders, product questions, and more."
        canonicalPath="/contact"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])}
      />

      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-ink sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-lg text-ink-soft">Questions about your order or our products? We're happy to help.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <ContactDetail icon={Mail} label="Email" value={config?.settings.contactEmail ?? 'hello@purerelief.co.uk'} />
            <ContactDetail icon={Phone} label="Phone" value={config?.settings.supportPhone ?? '+44 7440 056021'} />
            <ContactDetail icon={MapPin} label="Based in" value="United Kingdom" />
          </div>

          <div className="lg:col-span-3">
            {contactMutation.isSuccess ? (
              <div className="card-surface p-8 text-center">
                <p className="font-semibold text-ink">Message sent!</p>
                <p className="mt-2 text-ink-soft">We'll get back to you within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-5 p-7">
                {/* Honeypot — hidden from real users, catches naive bots */}
                <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                    <input id="name" {...register('name')} className={`input-field ${errors.name ? 'input-error' : ''}`} />
                    {errors.name && <p className="field-error-text">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
                    <input id="email" type="email" {...register('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} />
                    {errors.email && <p className="field-error-text">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">Subject</label>
                  <input id="subject" {...register('subject')} className={`input-field ${errors.subject ? 'input-error' : ''}`} />
                  {errors.subject && <p className="field-error-text">{errors.subject.message}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">Message</label>
                  <textarea id="message" rows={5} {...register('message')} className={`input-field resize-none ${errors.message ? 'input-error' : ''}`} />
                  {errors.message && <p className="field-error-text">{errors.message.message}</p>}
                </div>

                <button type="submit" disabled={contactMutation.isPending} className="btn-primary w-full sm:w-auto">
                  {contactMutation.isPending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ContactDetail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-ink-soft">{label}</p>
        <p className="font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

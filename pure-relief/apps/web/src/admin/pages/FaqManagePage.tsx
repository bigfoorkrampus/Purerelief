import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminFaqs, useDeleteFaq } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

export function FaqManagePage() {
  const { data: faqs, isLoading } = useAdminFaqs();
  const deleteFaq = useDeleteFaq();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setIsSaving(true);
    try {
      await api.post('/api/admin/faqs', { question, answer, category, sortOrder: faqs?.length ?? 0 }, readCsrfCookie());
      qc.invalidateQueries({ queryKey: ['admin-faqs'] });
      // Public storefront reads FAQs under the 'faqs' key (5-min staleTime)
      // — without this a new FAQ wouldn't appear on the site until then.
      qc.invalidateQueries({ queryKey: ['faqs'] });
      setQuestion('');
      setAnswer('');
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Site FAQ</h1>
          <p className="mt-1 text-ink-soft">Manage the questions shown on your FAQ page.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New FAQ
        </button>
      </div>

      {showForm && (
        <div className="card-surface mt-6 space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Question</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Answer</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <button onClick={handleCreate} disabled={isSaving || !question || !answer} className="btn-primary text-sm">
            {isSaving ? 'Saving…' : 'Create'}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
        ) : faqs && faqs.length > 0 ? (
          faqs.map((faq) => (
            <div key={faq.id} className="card-surface flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{faq.category}</p>
                <p className="mt-1 font-medium text-ink">{faq.question}</p>
                <p className="mt-1 text-sm text-ink-soft">{faq.answer}</p>
              </div>
              <button onClick={() => { if (confirm('Delete this FAQ?')) deleteFaq.mutate(faq.id); }} className="shrink-0 text-red-500 hover:text-red-600" aria-label="Delete FAQ">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-ink-soft">No FAQs yet.</p>
        )}
      </div>
    </div>
  );
}

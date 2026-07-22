import { useState, useEffect } from 'react';
import { useAdminNavLinks, useAdminBanner } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';

type Tab = 'navigation' | 'banner';

export function SiteEditorPage() {
  const [tab, setTab] = useState<Tab>('navigation');

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Site Editor</h1>
      <p className="mt-1 text-ink-soft">Control your navigation menu and announcement banner.</p>

      <div className="mt-6 flex gap-2 border-b border-slate-100">
        {(['navigation', 'banner'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'navigation' && <NavigationEditor />}
        {tab === 'banner' && <BannerEditor />}
      </div>
    </div>
  );
}

function NavigationEditor() {
  const { data: navLinks, isLoading } = useAdminNavLinks();
  const qc = useQueryClient();
  const [links, setLinks] = useState<{ label: string; href: string; sortOrder: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (navLinks) setLinks(navLinks.map((l) => ({ label: l.label, href: l.href, sortOrder: l.sortOrder })));
  }, [navLinks]);

  function updateLink(index: number, field: 'label' | 'href', value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: '', href: '/', sortOrder: prev.length }]);
  }

  async function save() {
    setIsSaving(true);
    try {
      await api.put('/api/admin/nav', { links: links.map((l, i) => ({ ...l, sortOrder: i })) }, readCsrfCookie());
      qc.invalidateQueries({ queryKey: ['admin-nav'] });
      qc.invalidateQueries({ queryKey: ['site-config'] });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="card-surface p-6">
      <div className="space-y-3">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
            <input value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} placeholder="Label" className="input-field py-2 text-sm" />
            <input value={link.href} onChange={(e) => updateLink(i, 'href', e.target.value)} placeholder="/path" className="input-field py-2 text-sm" />
            <button onClick={() => removeLink(i)} className="shrink-0 text-red-500 hover:text-red-600" aria-label="Remove link">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={addLink} className="btn-ghost text-sm"><Plus className="h-4 w-4" /> Add Link</button>
        <button onClick={save} disabled={isSaving} className="btn-primary text-sm">{isSaving ? 'Saving…' : 'Save Navigation'}</button>
      </div>
    </div>
  );
}

function BannerEditor() {
  const { data: banner, isLoading } = useAdminBanner();
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [linkHref, setLinkHref] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#2563EB');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (banner) {
      setEnabled(banner.enabled);
      setMessage(banner.message);
      setLinkHref(banner.linkHref ?? '');
      setBackgroundColor(banner.backgroundColor);
      setTextColor(banner.textColor);
    }
  }, [banner]);

  async function save() {
    setIsSaving(true);
    try {
      await api.put('/api/admin/banner', { enabled, message, linkHref: linkHref || null, backgroundColor, textColor }, readCsrfCookie());
      qc.invalidateQueries({ queryKey: ['admin-banner'] });
      qc.invalidateQueries({ queryKey: ['site-config'] });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="card-surface space-y-4 p-6">
      <label className="flex items-center gap-2.5">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
        <span className="text-sm font-medium text-ink">Show announcement banner</span>
      </label>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Message</label>
        <input value={message} onChange={(e) => setMessage(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Link (optional)</label>
        <input value={linkHref} onChange={(e) => setLinkHref(e.target.value)} placeholder="/shop" className="input-field" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Background</label>
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Text Color</label>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200" />
        </div>
      </div>
      <div className="rounded-xl py-2 text-center text-sm font-medium" style={{ backgroundColor, color: textColor }}>
        {message || 'Preview text'}
      </div>
      <button onClick={save} disabled={isSaving} className="btn-primary text-sm">{isSaving ? 'Saving…' : 'Save Banner'}</button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAdminSiteSettings } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { SiteSettings } from '@pure-relief/shared';

export function SettingsPage() {
  const { data: settings, isLoading } = useAdminSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function save() {
    if (!form) return;
    setIsSaving(true);
    try {
      await api.put('/api/admin/settings', form, readCsrfCookie());
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['site-config'] });
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !form) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Settings</h1>
          <p className="mt-1 text-ink-soft">Site-wide contact info and analytics configuration.</p>
        </div>
        {savedAt && <p className="text-xs text-ink-soft">Saved at {savedAt.toLocaleTimeString()}</p>}
      </div>

      <div className="card-surface mt-8 space-y-4 p-6">
        <h2 className="font-semibold text-ink">General</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Site Name</label>
          <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className="input-field" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Support Phone</label>
            <input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">WhatsApp Number</label>
            <input value={form.supportWhatsApp} onChange={(e) => setForm({ ...form, supportWhatsApp: e.target.value })} className="input-field" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Contact Email</label>
          <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Address</label>
          <input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} className="input-field" />
        </div>
      </div>

      <div className="card-surface mt-6 space-y-4 p-6">
        <h2 className="font-semibold text-ink">Analytics</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Google Analytics ID</label>
          <input
            value={form.googleAnalyticsId ?? ''}
            onChange={(e) => setForm({ ...form, googleAnalyticsId: e.target.value || null })}
            placeholder="G-XXXXXXXXXX"
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Google Search Console Verification</label>
          <input
            value={form.googleSearchConsoleVerification ?? ''}
            onChange={(e) => setForm({ ...form, googleSearchConsoleVerification: e.target.value || null })}
            placeholder="verification meta content value"
            className="input-field"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </div>
  );
}

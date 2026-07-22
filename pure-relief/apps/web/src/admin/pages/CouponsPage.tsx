import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminCoupons, useDeleteCoupon } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { formatMoneyMinor } from '@/lib/format';
import type { CouponType } from '@pure-relief/shared';

export function CouponsPage() {
  const { data: coupons, isLoading } = useAdminCoupons();
  const deleteCoupon = useDeleteCoupon();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setIsSaving(true);
    try {
      await api.post('/api/admin/coupons', { code, type, value, active: true }, readCsrfCookie());
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCode('');
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Coupons</h1>
          <p className="mt-1 text-ink-soft">Create discount codes for your customers.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="card-surface mt-6 grid gap-4 p-6 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-field" placeholder="WELCOME10" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className="input-field">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed (£)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Value</label>
            <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="input-field" />
          </div>
          <div className="sm:col-span-3">
            <button onClick={handleCreate} disabled={isSaving || !code} className="btn-primary text-sm">
              {isSaving ? 'Saving…' : 'Create Coupon'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
        ) : coupons && coupons.length > 0 ? (
          coupons.map((coupon) => (
            <div key={coupon.id} className="card-surface flex items-center justify-between p-5">
              <div>
                <p className="font-mono font-semibold text-ink">{coupon.code}</p>
                <p className="text-sm text-ink-soft">
                  {coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatMoneyMinor(coupon.value * 100)} off`}
                  {' · '}{coupon.usedCount} used{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                </p>
              </div>
              <button onClick={() => { if (confirm(`Delete "${coupon.code}"?`)) deleteCoupon.mutate(coupon.id); }} className="text-red-500 hover:text-red-600" aria-label="Delete coupon">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-ink-soft">No coupons yet.</p>
        )}
      </div>
    </div>
  );
}

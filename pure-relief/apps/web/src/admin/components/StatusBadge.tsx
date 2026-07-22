const STATUS_STYLES: Record<string, string> = {
  published: 'bg-success-50 text-success-500',
  draft: 'bg-slate-100 text-ink-soft',
  archived: 'bg-slate-100 text-ink-soft',
  pending: 'bg-warm-50 text-warm-600',
  pending_payment: 'bg-warm-50 text-warm-600',
  approved: 'bg-success-50 text-success-500',
  paid: 'bg-success-50 text-success-500',
  fulfilled: 'bg-brand-50 text-brand-700',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-success-50 text-success-500',
  rejected: 'bg-red-50 text-red-600',
  cancelled: 'bg-red-50 text-red-600',
  refunded: 'bg-red-50 text-red-600',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-ink-soft';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

import type { Money } from '@pure-relief/shared';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: money.currency }).format(money.amountMinor / 100);
}

export function formatMoneyMinor(amountMinor: number, currency: 'GBP' = 'GBP'): string {
  return formatMoney({ amountMinor, currency });
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mediaUrl(r2Key: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}/media/${r2Key}`;
}

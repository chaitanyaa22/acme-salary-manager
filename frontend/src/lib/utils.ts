import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency locales and symbol mappings
 */
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  GBP: 'en-GB',
  EUR: 'de-DE',
  SGD: 'en-SG',
};

/**
 * Formats minor monetary units (cents, paise, pence) to human-readable major currency strings.
 * Safe integer math: amountMinor / 100.
 */
export function formatCurrency(
  amountMinor: number | string | null | undefined,
  currency: string = 'USD',
  options: { maximumFractionDigits?: number; compact?: boolean } = {},
): string {
  if (amountMinor === null || amountMinor === undefined || isNaN(Number(amountMinor))) {
    return '—';
  }

  const numericMinor = Number(amountMinor);
  const majorUnits = numericMinor / 100;
  const locale = CURRENCY_LOCALES[currency] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      notation: options.compact ? 'compact' : 'standard',
    }).format(majorUnits);
  } catch {
    // Fallback if currency code is not supported
    return `${currency} ${majorUnits.toLocaleString('en-US')}`;
  }
}

/**
 * Formats ISO date string to readable format (e.g. Nov 14, 2026).
 */
export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

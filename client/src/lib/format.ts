/** Formats a numeric amount in the given ISO currency (falls back to USD). */
export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Unknown currency code → plain number with the code appended.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Resolves the currency symbol (e.g. ₹, $) for the given ISO currency code. */
export function getCurrencySymbol(currency = 'USD'): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

/** Formats an ISO date string as a short, locale-aware date. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** ISO date (yyyy-mm-dd) for <input type="date">, defaulting to today. */
export function toDateInputValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Formatting helpers. All money is rendered through `Intl` so separators and
 * symbols match the user's locale instead of being hard-coded.
 */

export function formatCurrency(
  value: number,
  currency = 'PKR',
  locale = 'en-PK',
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      // Keep up to two decimals so an amount such as 1234.50 is not silently
      // rounded to 1235, but never show trailing ".00".
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to a plain number with the code.
    return `${currency} ${new Intl.NumberFormat(locale).format(value)}`;
  }
}

/** Short form for chart axes, e.g. `12K`, `1.2M`. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trimZero((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${trimZero((value / 1_000).toFixed(abs >= 10_000 ? 0 : 1))}K`;
  return trimZero(value.toFixed(abs < 10 && !Number.isInteger(value) ? 1 : 0));
}

/** Currency-aware compact form used on chart axes. */
export function formatCompactCurrency(value: number, currency = 'PKR', locale = 'en-PK'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatCompact(value);
  }
}

function trimZero(value: string): string {
  return value.replace(/\.0$/, '');
}

/** Formats a `YYYY-MM-DD` day for display, e.g. `15 Jun 2026`. */
export function formatDay(day: string, locale = 'en-PK'): string {
  const date = parseDay(day);
  if (!date) return day;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Formats a `YYYY-MM-DD` day as a short `15 Jun` label. */
export function formatDayShort(day: string, locale = 'en-PK'): string {
  const date = parseDay(day);
  if (!date) return day;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}

/** Parses a `YYYY-MM-DD` string into a local `Date` (avoids UTC off-by-one). */
export function parseDay(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today's calendar day in `YYYY-MM-DD` form, using local time. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The current month key, e.g. `2026-10`. */
export function currentMonthKey(now: Date = new Date()): string {
  return todayISO(now).slice(0, 7);
}

/** ISO timestamp without milliseconds. */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * `YYYY-MM-DD` strings sort lexicographically in chronological order, which
 * makes range comparisons both correct and fast.
 */
export function isDayInRange(day: string, from: string | null, to: string | null): boolean {
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/** Returns the `YYYY-MM-DD` day `offset` days away from `day`. */
export function addDays(day: string, offset: number): string {
  const date = parseDay(day);
  if (!date) return day;
  date.setDate(date.getDate() + offset);
  return todayISO(date);
}

/** Returns the `YYYY-MM` month key `offset` months away from `monthKey`. */
export function addMonths(monthKey: string, offset: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const date = new Date(y, m - 1 + offset, 1);
  return todayISO(date).slice(0, 7);
}

/** Human label for a `YYYY-MM` month key, e.g. `Oct 2026`. */
export function formatMonthKey(monthKey: string, locale = 'en-PK'): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
}

/** Percentage of `value` within `total`, clamped to 0–100. */
export function percentOf(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

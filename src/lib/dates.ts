import type { DateRangePreset } from '@/types';

/** Date-range helpers shared by the filter UI and the stats layer. */

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Formats a `Date` as a local `YYYY-MM-DD` day. */
export function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Computes the concrete from/to bounds for a range preset. */
export function resolveRange(
  preset: DateRangePreset,
  custom: { from: string | null; to: string | null },
  now: Date = new Date(),
): { from: string | null; to: string | null } {
  const today = toDay(now);

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'week':
      return { from: toDay(startOfWeek(now)), to: today };
    case 'month':
      return { from: toDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case 'quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        from: toDay(new Date(now.getFullYear(), quarterMonth, 1)),
        to: today,
      };
    }
    case 'year':
      return { from: toDay(new Date(now.getFullYear(), 0, 1)), to: today };
    case 'custom':
      return { from: custom.from, to: custom.to };
    case 'all':
    default:
      return { from: null, to: null };
  }
}

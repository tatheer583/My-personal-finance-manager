import { describe, expect, it } from 'vitest';
import {
  addMonths,
  currentMonthKey,
  formatCompact,
  formatCompactCurrency,
  isDayInRange,
  percentOf,
  todayISO,
} from './format';

describe('formatCompact', () => {
  it('keeps small values readable instead of collapsing them to 0k', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(750)).toBe('750');
    expect(formatCompact(1_500)).toBe('1.5K');
    expect(formatCompact(12_400)).toBe('12K');
    expect(formatCompact(1_250_000)).toBe('1.3M');
  });
});

describe('formatCompactCurrency', () => {
  it('falls back gracefully for an unknown currency code', () => {
    expect(formatCompactCurrency(1500, 'PKR', 'en-PK')).toContain('1.5');
  });
});

describe('isDayInRange', () => {
  it('compares calendar days inclusively', () => {
    expect(isDayInRange('2026-03-05', '2026-03-01', '2026-03-31')).toBe(true);
    expect(isDayInRange('2026-03-05', '2026-03-06', null)).toBe(false);
    expect(isDayInRange('2026-03-05', null, null)).toBe(true);
  });
});

describe('addMonths', () => {
  it('rolls over year boundaries', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-06', 0)).toBe('2026-06');
  });
});

describe('percentOf', () => {
  it('clamps to the 0-100 range', () => {
    expect(percentOf(50, 100)).toBe(50);
    expect(percentOf(150, 100)).toBe(100);
    expect(percentOf(-10, 100)).toBe(0);
    expect(percentOf(10, 0)).toBe(0);
  });
});

describe('todayISO / currentMonthKey', () => {
  it('uses local time rather than UTC', () => {
    // 23:30 local on the 31st must not roll over to the next day in UTC.
    const lateEvening = new Date(2026, 2, 31, 23, 30);
    expect(todayISO(lateEvening)).toBe('2026-03-31');
    expect(currentMonthKey(lateEvening)).toBe('2026-03');
  });
});

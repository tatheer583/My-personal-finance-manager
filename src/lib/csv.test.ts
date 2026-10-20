import { describe, expect, it } from 'vitest';
import { parseCsv, transactionsToCsv } from './csv';
import type { Category, Transaction } from '@/types';

const categories: Category[] = [
  { id: 'food', name: 'Food', kind: 'expense', color: '#f97316', builtin: true },
];

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: 250,
    categoryId: 'food',
    date: '2026-03-05',
    note: 'Lunch, "best" place',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
  },
];

describe('transactionsToCsv', () => {
  it('emits a BOM and CRLF line endings for Excel', () => {
    const csv = transactionsToCsv(transactions, { categories, currency: 'PKR' });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('\r\n');
  });

  it('escapes quotes and commas', () => {
    const csv = transactionsToCsv(transactions, { categories, currency: 'PKR' });
    expect(csv).toContain('"Lunch, ""best"" place"');
  });

  it('includes a row per transaction', () => {
    const csv = transactionsToCsv(transactions, { categories, currency: 'PKR' });
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['Date', 'Type', 'Category', 'Amount', 'Note']);
    expect(rows[1][0]).toBe('2026-03-05');
    expect(rows[1][2]).toBe('Food');
  });
});

describe('parseCsv', () => {
  it('handles quoted fields with embedded newlines', () => {
    const rows = parseCsv('a,"b\nc",d');
    expect(rows).toEqual([
      ['a', 'b\nc', 'd'],
    ]);
  });

  it('strips the BOM', () => {
    const rows = parseCsv('\uFEFFa,b');
    expect(rows[0][0]).toBe('a');
  });

  it('skips blank lines', () => {
    expect(parseCsv('a,b\n\n\nc,d')).toHaveLength(2);
  });
});

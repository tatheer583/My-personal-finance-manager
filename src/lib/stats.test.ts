import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  budgetStatuses,
  categoryBreakdown,
  monthlySeries,
  summarize,
} from './stats';
import type { Category, Transaction } from '@/types';

const categories: Category[] = [
  { id: 'food', name: 'Food', kind: 'expense', color: '#f97316', builtin: true },
  { id: 'rent', name: 'Rent', kind: 'expense', color: '#a855f7', builtin: true },
  { id: 'job', name: 'Job', kind: 'income', color: '#22c55e', builtin: true },
];

function transaction(
  partial: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'date'>,
): Transaction {
  return {
    categoryId: partial.type === 'income' ? 'job' : 'food',
    note: '',
    createdAt: `${partial.date}T10:00:00.000Z`,
    updatedAt: `${partial.date}T10:00:00.000Z`,
    ...partial,
  };
}

const transactions: Transaction[] = [
  transaction({ id: '1', type: 'income', amount: 5000, date: '2026-03-01' }),
  transaction({ id: '2', type: 'expense', amount: 1500, date: '2026-03-05' }),
  transaction({ id: '3', type: 'expense', amount: 2500, date: '2026-03-20', categoryId: 'rent' }),
  transaction({ id: '4', type: 'income', amount: 2000, date: '2026-04-02' }),
];

describe('summarize', () => {
  it('totals income, expenses and balance', () => {
    const summary = summarize(transactions);
    expect(summary.income).toBe(7000);
    expect(summary.expense).toBe(4000);
    expect(summary.balance).toBe(3000);
    expect(summary.transactionCount).toBe(4);
  });

  it('respects the date range', () => {
    const summary = summarize(transactions, { from: '2026-04-01', to: '2026-04-30' });
    expect(summary.income).toBe(2000);
    expect(summary.expense).toBe(0);
    expect(summary.balance).toBe(2000);
  });

  it('computes the savings rate', () => {
    expect(summarize(transactions).savingsRate).toBeCloseTo((3000 / 7000) * 100, 5);
  });

  it('reports a negative savings rate when spending exceeds income', () => {
    const summary = summarize([
      transaction({ id: 'x', type: 'income', amount: 100, date: '2026-03-01' }),
      transaction({ id: 'y', type: 'expense', amount: 150, date: '2026-03-02' }),
    ]);
    expect(summary.savingsRate).toBeCloseTo(-50, 5);
  });

  it('reports the largest expense', () => {
    expect(summarize(transactions).largestExpense?.id).toBe('3');
  });

  it('returns zeros for an empty list', () => {
    const summary = summarize([]);
    expect(summary.balance).toBe(0);
    expect(summary.savingsRate).toBe(0);
    expect(summary.largestExpense).toBeNull();
  });
});

describe('monthlySeries', () => {
  it('includes empty months so the timeline stays continuous', () => {
    const series = monthlySeries(transactions, 3, { endMonth: '2026-04' });
    expect(series.map((p) => p.key)).toEqual(['2026-02', '2026-03', '2026-04']);
    expect(series[0].income).toBe(0);
    expect(series[1].expense).toBe(4000);
    expect(series[2].income).toBe(2000);
  });
});

describe('categoryBreakdown', () => {
  it('groups expenses by category and sorts by amount', () => {
    const slices = categoryBreakdown(transactions, categories, 'expense');
    expect(slices[0].categoryId).toBe('rent');
    expect(slices[0].amount).toBe(2500);
    expect(slices[0].percent).toBeCloseTo(62.5, 5);
    expect(slices[1].percent).toBeCloseTo(37.5, 5);
  });
});

describe('budgetStatuses', () => {
  it('compares spend against the limit for the given month', () => {
    const statuses = budgetStatuses(
      [{ id: 'b1', categoryId: 'food', amount: 1000 }],
      transactions,
      categories,
      '2026-03',
    );
    expect(statuses).toHaveLength(1);
    expect(statuses[0].spent).toBe(1500);
    expect(statuses[0].over).toBe(true);
    expect(statuses[0].remaining).toBe(-500);
  });
});

describe('applyFilters', () => {
  const base = {
    type: 'all' as const,
    categoryIds: [] as string[],
    search: '',
    from: null,
    to: null,
    sort: 'date-desc' as const,
  };

  it('filters by type', () => {
    const result = applyFilters(transactions, { ...base, type: 'income' }, categories);
    expect(result).toHaveLength(2);
  });

  it('filters by category', () => {
    const result = applyFilters(transactions, { ...base, categoryIds: ['rent'] }, categories);
    expect(result.map((t) => t.id)).toEqual(['3']);
  });

  it('searches notes and category names', () => {
    const result = applyFilters(transactions, { ...base, search: 'rent' }, categories);
    expect(result.map((t) => t.id)).toEqual(['3']);
  });

  it('sorts by amount descending', () => {
    const result = applyFilters(transactions, { ...base, sort: 'amount-desc' }, categories);
    expect(result.map((t) => t.amount)).toEqual([5000, 2500, 2000, 1500]);
  });
});

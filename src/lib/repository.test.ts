import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultState, importLegacyState, sanitizeState } from './repository';
import { STORAGE_KEYS } from '@/constants';

describe('sanitizeState', () => {
  it('drops individual malformed records instead of the whole history', () => {
    const state = createDefaultState();
    state.transactions = [
      {
        id: 'good-1',
        type: 'expense',
        amount: 100,
        categoryId: 'exp-food',
        date: '2026-03-01',
        note: '',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      // Invalid: negative amount.
      {
        id: 'bad-1',
        type: 'expense',
        amount: -50,
        categoryId: 'exp-food',
        date: '2026-03-02',
        note: '',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
      {
        id: 'good-2',
        type: 'income',
        amount: 900,
        categoryId: 'inc-father',
        date: '2026-03-03',
        note: '',
        createdAt: '2026-03-03T00:00:00.000Z',
        updatedAt: '2026-03-03T00:00:00.000Z',
      },
    ];

    const { state: cleaned, dropped } = sanitizeState(state);
    expect(cleaned.transactions).toHaveLength(2);
    expect(cleaned.transactions.map((t) => t.id)).toEqual(['good-1', 'good-2']);
    expect(dropped).toBe(1);
  });

  it('keeps transactions whose category was deleted', () => {
    const state = createDefaultState();
    state.transactions = [
      {
        id: 'orphan',
        type: 'expense',
        amount: 25,
        categoryId: 'removed-category',
        date: '2026-03-01',
        note: '',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ];

    const { state: cleaned } = sanitizeState(state);
    expect(cleaned.transactions).toHaveLength(1);
  });
});

describe('importLegacyState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when there is nothing to import', () => {
    expect(importLegacyState()).toBeNull();
  });

  it('converts version 1 localStorage transactions', () => {
    localStorage.setItem(
      STORAGE_KEYS.legacyTransactions,
      JSON.stringify([
        {
          id: 1712345678901,
          type: 'INCOME',
          amount: 5000,
          categoryOrSender: 'Father (Abu)',
          date: '2026-03-05T10:00:00.000Z',
          note: 'Allowance',
        },
        {
          id: 1712345678902,
          type: 'EXPENSE',
          amount: 250,
          categoryOrSender: 'Food',
          date: '2026-03-06T10:00:00.000Z',
        },
      ]),
    );
    localStorage.setItem(STORAGE_KEYS.legacySenders, JSON.stringify(['Father (Abu)', 'Shakir Bhai']));

    const imported = importLegacyState();
    expect(imported).not.toBeNull();
    if (!imported) return;

    expect(imported.transactions).toHaveLength(2);
    const income = imported.transactions.find((t) => t.type === 'income');
    expect(income?.amount).toBe(5000);
    expect(income?.note).toBe('Allowance');
    expect(income?.categoryId).toBe('inc-father');
    expect(imported.transactions[1].categoryId).toBe('exp-food');
  });

  it('skips malformed legacy entries but keeps the valid ones', () => {
    localStorage.setItem(
      STORAGE_KEYS.legacyTransactions,
      JSON.stringify([
        { id: 1, type: 'INCOME', amount: 500, categoryOrSender: 'Father (Abu)', date: '2026-03-05' },
        { id: 2, type: 'EXPENSE', amount: -10, categoryOrSender: 'Food', date: '2026-03-06' },
        { id: 3, type: 'EXPENSE', amount: 10, categoryOrSender: '', date: '2026-03-07' },
      ]),
    );

    const imported = importLegacyState();
    expect(imported?.transactions).toHaveLength(1);
  });
});

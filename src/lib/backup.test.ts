import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup } from './backup';
import { createDefaultState } from './repository';
import type { AppState } from '@/types';

function sampleState(): AppState {
  const base = createDefaultState();
  return {
    ...base,
    transactions: [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 100,
        categoryId: 'exp-food',
        date: '2026-03-05',
        note: 'Lunch',
        createdAt: '2026-03-05T10:00:00.000Z',
        updatedAt: '2026-03-05T10:00:00.000Z',
      },
    ],
  };
}

describe('buildBackup / parseBackup', () => {
  it('round-trips a valid backup', () => {
    const backup = buildBackup(sampleState());
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.transactions).toHaveLength(1);
    expect(result.state.transactions[0].amount).toBe(100);
  });

  it('rejects a file that is not JSON', () => {
    const result = parseBackup('not json at all');
    expect(result.ok).toBe(false);
  });

  it('rejects a file with the wrong shape', () => {
    const result = parseBackup(JSON.stringify({ hello: 'world' }));
    expect(result.ok).toBe(false);
  });

  it('accepts a bare state document', () => {
    const result = parseBackup(JSON.stringify(sampleState()));
    expect(result.ok).toBe(true);
  });

  it('drops transactions that point at a missing category but keeps the rest', () => {
    const state = sampleState();
    state.transactions.push({
      id: 'tx-2',
      type: 'expense',
      amount: 50,
      categoryId: 'does-not-exist',
      date: '2026-03-06',
      note: '',
      createdAt: '2026-03-06T10:00:00.000Z',
      updatedAt: '2026-03-06T10:00:00.000Z',
    });

    const result = parseBackup(JSON.stringify(buildBackup(state)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.transactions).toHaveLength(1);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

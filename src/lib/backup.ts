import { z } from 'zod';
import type { AppState, BackupFile } from '@/types';
import { SCHEMA_VERSION } from '@/constants';

/**
 * Backup / restore.
 *
 * A backup is a plain JSON document that contains the entire application
 * state. The schema is validated with Zod on import so a corrupt or
 * hand-edited file can never corrupt the live data.
 */

const transactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().default(''),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['income', 'expense']),
  color: z.string().default('#64748b'),
  builtin: z.boolean().default(false),
});

const budgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().nonnegative(),
});

const settingsSchema = z.object({
  currency: z.string().default('PKR'),
  locale: z.string().default('en-PK'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  monthlyBudget: z.number().nonnegative().default(0),
  dailyLimit: z.number().nonnegative().default(0),
  savingsGoal: z.number().nonnegative().default(0),
});

export const appStateSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  transactions: z.array(transactionSchema).default([]),
  categories: z.array(categorySchema).default([]),
  budgets: z.array(budgetSchema).default([]),
  settings: settingsSchema,
});

export const backupFileSchema = z.object({
  app: z.literal('personal-finance-manager'),
  version: z.number(),
  exportedAt: z.string(),
  state: appStateSchema,
});

/** Wraps the current state in the portable backup envelope. */
export function buildBackup(state: AppState): BackupFile {
  return {
    app: 'personal-finance-manager',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export type RestoreResult =
  | { ok: true; state: AppState; warnings: string[] }
  | { ok: false; error: string };

/**
 * Validates a backup file.
 *
 * Invalid *individual* records are dropped with a warning rather than
 * rejecting the whole file — a partially corrupt backup should still restore
 * as much data as possible.
 */
export function parseBackup(raw: string): RestoreResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  const envelope = backupFileSchema.safeParse(json);
  if (!envelope.success) {
    // The file may be a bare state document (older export format).
    const bare = appStateSchema.safeParse(json);
    if (bare.success) {
      return { ok: true, state: bare.data as AppState, warnings: [] };
    }
    return {
      ok: false,
      error: 'That file is not a valid Personal Finance Manager backup.',
    };
  }

  const warnings: string[] = [];
  const parsed = appStateSchema.safeParse(envelope.data.state);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'The backup contains data that could not be read.',
    };
  }

  const state = parsed.data as AppState;
  const categoryIds = new Set(state.categories.map((c) => c.id));
  const validTransactions = state.transactions.filter((t) => {
    if (categoryIds.has(t.categoryId)) return true;
    warnings.push(`Skipped a transaction with unknown category "${t.categoryId}".`);
    return false;
  });

  return {
    ok: true,
    state: { ...state, transactions: validTransactions },
    warnings,
  };
}

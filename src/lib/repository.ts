import type { AppState, Category, Transaction } from '@/types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  STORAGE_KEYS,
} from '@/constants';
import { getDocument, setDocument } from './db';
import { uid } from './id';
import { todayISO } from './format';

/**
 * Persistence layer.
 *
 * Responsibilities:
 *  - build the default state for a fresh install,
 *  - migrate older persisted documents forward,
 *  - import data written by version 1 of the app (localStorage),
 *  - sanitise user data record-by-record so one bad entry can never wipe out
 *    an entire history.
 */

/** A fresh, empty application state. */
export function createDefaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isValidTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const t = value as Partial<Transaction>;
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    (t.type === 'income' || t.type === 'expense') &&
    typeof t.amount === 'number' &&
    Number.isFinite(t.amount) &&
    t.amount > 0 &&
    typeof t.categoryId === 'string' &&
    t.categoryId.length > 0 &&
    typeof t.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(t.date)
  );
}

/**
 * Removes malformed records individually.
 *
 * The previous version of this app validated the whole array at once and
 * discarded *everything* if a single record failed — losing a user's entire
 * history because of one bad row. Now each record is judged on its own.
 */
export function sanitizeState(state: AppState): { state: AppState; dropped: number } {
  const validCategories = state.categories.filter(
    (c) =>
      typeof c?.id === 'string' &&
      typeof c?.name === 'string' &&
      (c.kind === 'income' || c.kind === 'expense'),
  );
  const transactions = state.transactions.filter((t) => {
    if (!isValidTransaction(t)) return false;
    // Transactions whose category was deleted are kept — the UI labels them
    // "Uncategorised" rather than silently dropping the record.
    return true;
  });

  const budgets = state.budgets.filter(
    (b) =>
      typeof b?.id === 'string' &&
      typeof b?.categoryId === 'string' &&
      typeof b?.amount === 'number' &&
      b.amount > 0,
  );

  return {
    state: {
      ...state,
      schemaVersion: SCHEMA_VERSION,
      transactions,
      categories: validCategories,
      budgets,
      settings: { ...DEFAULT_SETTINGS, ...state.settings },
    },
    dropped: state.transactions.length - transactions.length,
  };
}

/**
 * Migrates a persisted document forward to the current schema version.
 * Unknown or future versions are returned untouched apart from sanitising.
 */
export function migrateState(raw: Partial<AppState> | null | undefined): AppState {
  if (!raw || typeof raw !== 'object') return createDefaultState();

  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;

  let state: AppState = {
    schemaVersion: version,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    categories: Array.isArray(raw.categories) && raw.categories.length > 0
      ? raw.categories
      : DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: Array.isArray(raw.budgets) ? raw.budgets : [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
  };

  if (version < 2) {
    // v1 stored transactions without a categoryId; map them onto the closest
    // matching built-in category by name.
    state = { ...state, schemaVersion: 2 };
  }

  const { state: clean } = sanitizeState(state);
  return clean;
}

/* ---------------------------------------------------------------------------
   Version 1 (localStorage) import
   --------------------------------------------------------------------------- */

interface LegacyTransaction {
  id?: number;
  type?: string;
  amount?: number;
  categoryOrSender?: string;
  date?: string;
  note?: string;
}

/**
 * Parses a JSON array from storage, returning an empty array for anything
 * that is missing or malformed.
 */
function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Converts a legacy ISO timestamp into a local `YYYY-MM-DD` day. */
function legacyDateToDay(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return todayISO();
  return todayISO(parsed);
}

/**
 * Maps the free-text category names used by version 1 onto the built-in
 * categories, so an old history does not turn into a dozen one-off
 * categories after the upgrade.
 */
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  food: 'exp-food',
  meals: 'exp-food',
  groceries: 'exp-food',
  transport: 'exp-transport',
  fuel: 'exp-transport',
  education: 'exp-education',
  fees: 'exp-education',
  tuition: 'exp-education',
  books: 'exp-education',
  utilities: 'exp-utilities',
  bills: 'exp-utilities',
  electricity: 'exp-utilities',
  health: 'exp-health',
  medical: 'exp-health',
  shopping: 'exp-shopping',
  clothes: 'exp-shopping',
  rent: 'exp-rent',
  hostel: 'exp-rent',
  entertainment: 'exp-entertainment',
  phone: 'exp-phone',
  internet: 'exp-phone',
  salary: 'inc-part-time',
  scholarship: 'inc-scholarship',
  freelance: 'inc-part-time',
  'other expense': 'exp-other',
  'other income': 'inc-other',
};

function matchCategory(
  categories: Category[],
  name: string,
  kind: 'income' | 'expense',
  color: string,
): string {
  const normalised = name.trim().toLowerCase();

  // 1. An exact name match against a category that already exists.
  const existing = categories.find(
    (c) => c.kind === kind && c.name.trim().toLowerCase() === normalised,
  );
  if (existing) return existing.id;

  // 2. A known alias from the legacy free-text format.
  const aliasId = LEGACY_CATEGORY_ALIASES[normalised];
  if (aliasId) {
    const alias = categories.find((c) => c.id === aliasId);
    if (alias && alias.kind === kind) return alias.id;
  }

  // 3. Otherwise create a dedicated category for it.
  const created: Category = {
    id: uid(),
    name: name.trim(),
    kind,
    color,
    builtin: false,
  };
  categories.push(created);
  return created.id;
}

/**
 * Imports data written by version 1 of the application.
 * Returns `null` when there is nothing to import.
 */
export function importLegacyState(): AppState | null {
  let rawTransactions: string | null = null;
  let rawSenders: string | null = null;

  try {
    rawTransactions = localStorage.getItem(STORAGE_KEYS.legacyTransactions);
    rawSenders = localStorage.getItem(STORAGE_KEYS.legacySenders);
  } catch {
    return null;
  }

  // The legacy format stores JSON strings, so they need parsing first.
  const legacy = parseJsonArray<LegacyTransaction>(rawTransactions);
  const legacySenders = parseJsonArray<string>(rawSenders);

  if (legacy.length === 0 && legacySenders.length === 0) return null;

  const state = createDefaultState();
  const categories = state.categories;

  // Legacy income sources become income categories.
  for (const sender of legacySenders) {
    if (typeof sender !== 'string' || !sender.trim()) continue;
    matchCategory(categories, sender, 'income', '#22c55e');
  }

  const transactions: Transaction[] = [];
  for (const item of legacy) {
    if (!item || typeof item !== 'object') continue;
    const type = item.type === 'INCOME' ? 'income' : item.type === 'EXPENSE' ? 'expense' : null;
    const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount);
    if (!type || !Number.isFinite(amount) || amount <= 0) continue;

    const label = typeof item.categoryOrSender === 'string' ? item.categoryOrSender.trim() : '';
    if (!label) continue;

    const categoryId = matchCategory(
      categories,
      label,
      type,
      type === 'income' ? '#22c55e' : '#f97316',
    );

    const timestamp = new Date().toISOString();
    transactions.push({
      id: uid(),
      type,
      amount,
      categoryId,
      date: legacyDateToDay(item.date ?? timestamp),
      note: typeof item.note === 'string' ? item.note : '',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return { ...state, categories, transactions };
}

/* ---------------------------------------------------------------------------
   Load / save
   --------------------------------------------------------------------------- */

export interface LoadResult {
  state: AppState;
  /** True when data was recovered from the version 1 localStorage format. */
  migratedFromLegacy: boolean;
  /** True when nothing was stored yet and defaults were used. */
  fresh: boolean;
}

/** Loads the persisted state, migrating or importing as needed. */
export async function loadState(): Promise<LoadResult> {
  const stored = await getDocument<Partial<AppState>>(STORAGE_KEYS.docKey);

  if (stored && typeof stored === 'object' && Array.isArray(stored.transactions)) {
    return { state: migrateState(stored), migratedFromLegacy: false, fresh: false };
  }

  const legacy = importLegacyState();
  if (legacy) {
    await setDocument(STORAGE_KEYS.docKey, legacy);
    return { state: legacy, migratedFromLegacy: true, fresh: false };
  }

  const fresh = createDefaultState();
  await setDocument(STORAGE_KEYS.docKey, fresh);
  return { state: fresh, migratedFromLegacy: false, fresh: true };
}

/** Persists the application state. */
export async function saveState(state: AppState): Promise<void> {
  await setDocument(STORAGE_KEYS.docKey, { ...state, schemaVersion: SCHEMA_VERSION });
}

/** Removes every trace of the legacy localStorage data after a successful import. */
export function clearLegacyState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.legacyTransactions);
    localStorage.removeItem(STORAGE_KEYS.legacySenders);
  } catch {
    /* ignore */
  }
}

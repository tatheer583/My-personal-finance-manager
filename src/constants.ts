import type { Category, Settings } from './types';

/** Current persisted schema version. Bump when the shape changes. */
export const SCHEMA_VERSION = 2;

export const APP_NAME = 'Personal Finance Manager';
export const STORAGE_KEYS = {
  /** IndexedDB database name. */
  db: 'personal-finance-manager',
  /** Object store holding the single application-state document. */
  store: 'documents',
  /** Key of the application-state document inside the store. */
  docKey: 'app-state',
  /** Legacy localStorage keys used by v1 of the app. */
  legacyTransactions: 'transactions',
  legacySenders: 'senders',
  /** Theme preference, mirrored to localStorage for the pre-paint script. */
  theme: 'pfm.theme',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  currency: 'PKR',
  locale: 'en-PK',
  theme: 'system',
  monthlyBudget: 0,
  dailyLimit: 0,
  savingsGoal: 0,
};

/**
 * Built-in categories. `id` values are stable so that migrations and existing
 * transactions keep pointing at the right category.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // Income sources
  { id: 'inc-father', name: 'Father (Abu)', kind: 'income', color: '#10b981', builtin: true },
  { id: 'inc-shakir', name: 'Shakir Bhai', kind: 'income', color: '#06b6d4', builtin: true },
  { id: 'inc-ameen', name: 'Ameen Bhai', kind: 'income', color: '#8b5cf6', builtin: true },
  { id: 'inc-tanveer', name: 'Tanveer Bhai', kind: 'income', color: '#f59e0b', builtin: true },
  { id: 'inc-scholarship', name: 'Scholarship', kind: 'income', color: '#6366f1', builtin: true },
  { id: 'inc-part-time', name: 'Part-time work', kind: 'income', color: '#14b8a6', builtin: true },
  { id: 'inc-other', name: 'Other income', kind: 'income', color: '#64748b', builtin: true },

  // Expense categories
  { id: 'exp-food', name: 'Food & meals', kind: 'expense', color: '#f97316', builtin: true },
  { id: 'exp-transport', name: 'Transport', kind: 'expense', color: '#0ea5e9', builtin: true },
  { id: 'exp-education', name: 'Education', kind: 'expense', color: '#8b5cf6', builtin: true },
  { id: 'exp-utilities', name: 'Utilities & bills', kind: 'expense', color: '#eab308', builtin: true },
  { id: 'exp-health', name: 'Health', kind: 'expense', color: '#ef4444', builtin: true },
  { id: 'exp-shopping', name: 'Shopping', kind: 'expense', color: '#ec4899', builtin: true },
  { id: 'exp-rent', name: 'Rent', kind: 'expense', color: '#a855f7', builtin: true },
  { id: 'exp-phone', name: 'Phone & internet', kind: 'expense', color: '#06b6d4', builtin: true },
  { id: 'exp-entertainment', name: 'Entertainment', kind: 'expense', color: '#22c55e', builtin: true },
  { id: 'exp-other', name: 'Other expense', kind: 'expense', color: '#64748b', builtin: true },
];

/** Palette used for chart series that are not tied to a category. */
export const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f97316',
  '#06b6d4',
  '#ec4899',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#64748b',
] as const;

/** Currencies offered in the settings page. */
export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'BDT', label: 'Bangladeshi Taka' },
] as const;

/** Maximum amount accepted for a single transaction. */
export const MAX_AMOUNT = 999_999_999;

/** Number of transactions rendered per page in the transactions table. */
export const PAGE_SIZE = 25;

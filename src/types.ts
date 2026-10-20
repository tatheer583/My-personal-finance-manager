/**
 * Domain model for the personal finance manager.
 *
 * Every persisted entity is plain JSON so the whole state can be exported,
 * backed up and restored without any serialisation surprises.
 */

export type TransactionType = 'income' | 'expense';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Transaction {
  /** Stable unique id (uuid v4 / crypto fallback). */
  id: string;
  type: TransactionType;
  /** Always a positive number; direction is expressed by `type`. */
  amount: number;
  /** Points at a `Category` id — an income source or an expense category. */
  categoryId: string;
  /** Calendar day in `YYYY-MM-DD` form (local time, no timezone drift). */
  date: string;
  note: string;
  /** ISO timestamps used for auditing and stable ordering. */
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: TransactionType;
  /** Hex colour used for charts, badges and progress bars. */
  color: string;
  /** Built-in categories can be renamed but are never hard-deleted. */
  builtin: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  /** Budget ceiling for one calendar month. */
  amount: number;
}

export interface Settings {
  currency: string;
  locale: string;
  theme: ThemePreference;
  /** Optional overall monthly spending ceiling. `0` disables the limit. */
  monthlyBudget: number;
  /** Optional daily spending ceiling. `0` disables the limit. */
  dailyLimit: number;
  /** Optional monthly savings target. `0` disables the goal. */
  savingsGoal: number;
}

export interface AppState {
  /** Bumped whenever the persisted shape changes; drives migrations. */
  schemaVersion: number;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings;
}

/** Shape of the JSON backup file produced by the Settings page. */
export interface BackupFile {
  app: 'personal-finance-manager';
  version: number;
  exportedAt: string;
  state: AppState;
}

export type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  /** Inclusive `YYYY-MM-DD` start, or null when unbounded. */
  from: string | null;
  /** Inclusive `YYYY-MM-DD` end, or null when unbounded. */
  to: string | null;
}

export interface TransactionFilter {
  type: 'all' | TransactionType;
  categoryIds: string[];
  search: string;
  range: DateRange;
  sort: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

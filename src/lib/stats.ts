import type { Budget, Category, Transaction } from '@/types';
import { addMonths, currentMonthKey, isDayInRange, percentOf, todayISO } from './format';

/**
 * Pure analytics helpers.
 *
 * Everything here is a pure function of its inputs so it can be unit tested
 * and memoised cheaply in the UI layer.
 */

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  /** Income minus expense, expressed as a percentage of income (0–100). */
  savingsRate: number;
  transactionCount: number;
  /** Average expense per day in the range. */
  averageDailySpend: number;
  largestExpense: Transaction | null;
  largestIncome: Transaction | null;
  /** Number of days the range covers — at least 1. */
  days: number;
}

export interface MonthPoint {
  /** `YYYY-MM` */
  key: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySlice {
  category: Category | null;
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  count: number;
  /** Share of the total, 0–100. */
  percent: number;
}

export interface BudgetStatus {
  budget: Budget;
  category: Category | null;
  spent: number;
  remaining: number;
  percent: number;
  over: boolean;
}

export interface FilterOptions {
  from?: string | null;
  to?: string | null;
}

function filterByRange(transactions: Transaction[], options: FilterOptions): Transaction[] {
  const { from = null, to = null } = options;
  if (!from && !to) return transactions;
  return transactions.filter((t) => isDayInRange(t.date, from, to));
}

/** Rolls a set of transactions up into the headline numbers. */
export function summarize(
  transactions: Transaction[],
  options: FilterOptions = {},
): Summary {
  const scoped = filterByRange(transactions, options);
  let income = 0;
  let expense = 0;
  let largestExpense: Transaction | null = null;
  let largestIncome: Transaction | null = null;

  for (const t of scoped) {
    if (t.type === 'income') {
      income += t.amount;
      if (!largestIncome || t.amount > largestIncome.amount) largestIncome = t;
    } else {
      expense += t.amount;
      if (!largestExpense || t.amount > largestExpense.amount) largestExpense = t;
    }
  }

  const days = options.from && options.to
    ? Math.max(1, Math.round((Date.parse(options.to) - Date.parse(options.from)) / 86_400_000) + 1)
    : 1;

  return {
    income,
    expense,
    balance: income - expense,
    // Can be negative when spending exceeds income — clamping to zero would
    // hide an overspend.
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    transactionCount: scoped.length,
    averageDailySpend: days > 0 ? expense / days : 0,
    largestExpense,
    largestIncome,
    days,
  };
}

/**
 * Builds a continuous series of the last `months` months ending with the
 * current month. Months without activity are included with zero values so the
 * chart never lies about the timeline.
 */
export function monthlySeries(
  transactions: Transaction[],
  months = 6,
  options: { endMonth?: string; labelFor?: (key: string) => string } = {},
): MonthPoint[] {
  const endMonth = options.endMonth ?? currentMonthKey();
  const buckets = new Map<string, { income: number; expense: number }>();

  for (let i = months - 1; i >= 0; i -= 1) {
    buckets.set(addMonths(endMonth, -i), { income: 0, expense: 0 });
  }

  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === 'income') bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return [...buckets.entries()].map(([key, value]) => ({
    key,
    label: options.labelFor ? options.labelFor(key) : key,
    income: value.income,
    expense: value.expense,
    balance: value.income - value.expense,
  }));
}

/** Aggregates spending (or income) per category for the given range. */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  kind: 'expense' | 'income',
  options: FilterOptions = {},
): CategorySlice[] {
  const scoped = filterByRange(transactions, options).filter((t) => t.type === kind);
  const byCategory = new Map<string, { amount: number; count: number }>();

  for (const t of scoped) {
    const entry = byCategory.get(t.categoryId) ?? { amount: 0, count: 0 };
    entry.amount += t.amount;
    entry.count += 1;
    byCategory.set(t.categoryId, entry);
  }

  const total = [...byCategory.values()].reduce((sum, e) => sum + e.amount, 0);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return [...byCategory.entries()]
    .map(([categoryId, entry]) => {
      const category = categoryMap.get(categoryId) ?? null;
      return {
        category,
        categoryId,
        name: category?.name ?? 'Uncategorised',
        color: category?.color ?? '#64748b',
        amount: entry.amount,
        count: entry.count,
        percent: percentOf(entry.amount, total),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Daily spend totals for the last `days` days (oldest first). */
export function dailySpendSeries(
  transactions: Transaction[],
  days = 14,
  today = todayISO(),
): { day: string; amount: number }[] {
  const series: { day: string; amount: number }[] = [];
  const index = new Map<string, number>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() - i);
    const key = todayISO(date);
    series.push({ day: key, amount: 0 });
    index.set(key, series.length - 1);
  }

  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const position = index.get(t.date);
    if (position === undefined) continue;
    series[position].amount += t.amount;
  }

  return series;
}

/**
 * Compares each budget against the spending in `monthKey`.
 */
export function budgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  monthKey: string = currentMonthKey(),
): BudgetStatus[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const spentByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (t.date.slice(0, 7) !== monthKey) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  return budgets
    .map((budget) => {
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      return {
        budget,
        category: categoryMap.get(budget.categoryId) ?? null,
        spent,
        remaining: budget.amount - spent,
        percent: percentOf(spent, budget.amount),
        over: spent > budget.amount,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

/**
 * Total monthly spending against the overall budget limit.
 */
export function overallBudgetStatus(
  monthlyBudget: number,
  transactions: Transaction[],
  monthKey: string = currentMonthKey(),
): { spent: number; remaining: number; percent: number; over: boolean } {
  const spent = transactions
    .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === monthKey)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    spent,
    remaining: monthlyBudget - spent,
    percent: percentOf(spent, monthlyBudget),
    over: spent > monthlyBudget,
  };
}

/** Applies the active filters to a transaction list. */
export function applyFilters(
  transactions: Transaction[],
  filters: {
    type: 'all' | 'income' | 'expense';
    categoryIds: string[];
    search: string;
    from: string | null;
    to: string | null;
    sort: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  },
  categories: Category[] = [],
): Transaction[] {
  const query = filters.search.trim().toLowerCase();
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const filtered = transactions.filter((t) => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(t.categoryId)) return false;
    if (!isDayInRange(t.date, filters.from, filters.to)) return false;
    if (query) {
      const name = nameById.get(t.categoryId) ?? '';
      const haystack = `${t.note} ${name}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'date-asc':
      sorted.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
      break;
    case 'amount-desc':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount-asc':
      sorted.sort((a, b) => a.amount - b.amount);
      break;
    case 'date-desc':
    default:
      sorted.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}

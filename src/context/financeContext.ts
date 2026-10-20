import { createContext, useContext } from 'react';
import type {
  AppState,
  Budget,
  Category,
  Settings,
  Transaction,
  TransactionType,
} from '@/types';

/** The shape of a transaction as it is entered or edited. */
export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

/** The shape of a category as it is created or edited. */
export interface CategoryInput {
  name: string;
  kind: TransactionType;
  color: string;
}

export interface FinanceContextValue {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  state: AppState;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings;
  categoryById: Map<string, Category>;
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, patch: Partial<CategoryInput>) => void;
  deleteCategory: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  removeBudget: (categoryId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceState: (state: AppState) => void;
  resetAll: () => void;
  reload: () => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextValue | null>(null);

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside a FinanceProvider');
  return context;
}

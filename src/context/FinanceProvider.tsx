import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  AppState,
  Budget,
  Category,
  Settings,
  Transaction,
} from '@/types';
import { createDefaultState, loadState, saveState } from '@/lib/repository';
import { uid } from '@/lib/id';
import { nowISO } from '@/lib/format';
import { FinanceContext } from './financeContext';
import type { CategoryInput, FinanceContextValue, TransactionInput } from './financeContext';
import { useTheme } from './themeContext';

const SAVE_DEBOUNCE_MS = 250;

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(() => createDefaultState());

  const { preference, setPreference } = useTheme();
  const hasHydrated = useRef(false);
  const themeAdopted = useRef(false);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }, []);

  /* ---------------------------------------------------------------------
     Load
     --------------------------------------------------------------------- */

  /**
   * Applies a freshly loaded state. Kept separate from the effect so the
   * mount effect never has to call `setState` synchronously.
   *
   * The first successful load also adopts the theme stored in the settings,
   * which is how a backup carries the user's theme to another device. Later
   * theme changes flow the other way: `preference` is the source of truth and
   * is mirrored into the settings below, so there is no synchronisation loop.
   */
  const applyLoaded = useCallback(
    (next: AppState) => {
      setState(next);
      setError(null);
      setStatus('ready');
      if (!themeAdopted.current) {
        themeAdopted.current = true;
        setPreference(next.settings.theme);
      }
    },
    [setPreference],
  );

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      applyLoaded((await loadState()).state);
    } catch (cause) {
      console.error('[finance] Failed to load state', cause);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Your saved data could not be loaded. The app is running with defaults.',
      );
      setState(createDefaultState());
      setStatus('error');
    }
  }, [applyLoaded]);

  useEffect(() => {
    let cancelled = false;

    void loadState()
      .then((result) => {
        if (cancelled) return;
        applyLoaded(result.state);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        console.error('[finance] Failed to load state', cause);
        setError(
          cause instanceof Error
            ? cause.message
            : 'Your saved data could not be loaded. The app is running with defaults.',
        );
        setState(createDefaultState());
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoaded]);

  /**
   * The theme lives in the ThemeProvider (it must be available before the
   * finance data loads). The settings shown to the rest of the app and written
   * to disk are derived from that preference, which keeps the two in sync
   * without a setState-in-effect feedback loop.
   */
  const effectiveState = useMemo<AppState>(
    () => ({
      ...state,
      settings: { ...state.settings, theme: preference },
    }),
    [state, preference],
  );

  /* ---------------------------------------------------------------------
     Persist (debounced)
     --------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasHydrated.current) return;
    const handle = window.setTimeout(() => {
      void saveState(effectiveState).catch((cause: unknown) => {
        console.error('[finance] Failed to save state', cause);
        setError('Changes could not be saved to this device.');
      });
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [effectiveState]);

  useEffect(() => {
    hasHydrated.current = true;
  }, []);

  /* ---------------------------------------------------------------------
     Transactions
     --------------------------------------------------------------------- */

  const addTransaction = useCallback((input: TransactionInput): Transaction => {
    const timestamp = nowISO();
    const transaction: Transaction = {
      id: uid(),
      type: input.type,
      amount: Math.round(input.amount * 100) / 100,
      categoryId: input.categoryId,
      date: input.date,
      note: input.note.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setState((current) => ({
      ...current,
      transactions: [transaction, ...current.transactions],
    }));
    return transaction;
  }, []);

  const updateTransaction = useCallback((id: string, input: TransactionInput) => {
    setState((current) => ({
      ...current,
      transactions: current.transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              type: input.type,
              amount: Math.round(input.amount * 100) / 100,
              categoryId: input.categoryId,
              date: input.date,
              note: input.note.trim(),
              updatedAt: nowISO(),
            }
          : t,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      transactions: current.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  /* ---------------------------------------------------------------------
     Categories
     --------------------------------------------------------------------- */

  const addCategory = useCallback((input: CategoryInput): Category => {
    const category: Category = {
      id: uid(),
      name: input.name.trim(),
      kind: input.kind,
      color: input.color,
      builtin: false,
    };
    setState((current) => ({
      ...current,
      categories: [...current.categories, category],
    }));
    return category;
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<CategoryInput>) => {
    setState((current) => ({
      ...current,
      categories: current.categories.map((c) =>
        c.id === id
          ? {
              ...c,
              ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
              ...(patch.color !== undefined ? { color: patch.color } : {}),
            }
          : c,
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      // Transactions are kept — they are re-labelled "Uncategorised".
      categories: current.categories.filter((c) => c.id !== id),
      budgets: current.budgets.filter((b) => b.categoryId !== id),
    }));
  }, []);

  /* ---------------------------------------------------------------------
     Budgets
     --------------------------------------------------------------------- */

  const setBudget = useCallback((categoryId: string, amount: number) => {
    setState((current) => {
      const existing = current.budgets.find((b) => b.categoryId === categoryId);
      if (amount <= 0) {
        return {
          ...current,
          budgets: current.budgets.filter((b) => b.categoryId !== categoryId),
        };
      }
      if (existing) {
        return {
          ...current,
          budgets: current.budgets.map((b) =>
            b.categoryId === categoryId ? { ...b, amount } : b,
          ),
        };
      }
      const budget: Budget = { id: uid(), categoryId, amount };
      return { ...current, budgets: [...current.budgets, budget] };
    });
  }, []);

  const removeBudget = useCallback((categoryId: string) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.filter((b) => b.categoryId !== categoryId),
    }));
  }, []);

  /* ---------------------------------------------------------------------
     Settings & whole-state operations
     --------------------------------------------------------------------- */

  const replaceState = useCallback(
    (next: AppState) => {
      setState(next);
      // A restored backup brings its own theme along with the data.
      themeAdopted.current = true;
      setPreference(next.settings.theme);
    },
    [setPreference],
  );

  const resetAll = useCallback(() => {
    setState(createDefaultState());
  }, []);

  const categoryById = useMemo(
    () => new Map(state.categories.map((c) => [c.id, c])),
    [state.categories],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      status,
      error,
      state: effectiveState,
      transactions: effectiveState.transactions,
      categories: effectiveState.categories,
      budgets: effectiveState.budgets,
      settings: effectiveState.settings,
      categoryById,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      removeBudget,
      updateSettings,
      replaceState,
      resetAll,
      reload,
    }),
    [
      status,
      error,
      effectiveState,
      categoryById,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      removeBudget,
      updateSettings,
      replaceState,
      resetAll,
      reload,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

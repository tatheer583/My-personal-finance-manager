import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FinanceProvider } from '@/context/FinanceProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { DashboardPage } from '@/pages/DashboardPage';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Route-level code splitting keeps the initial bundle small: the chart-heavy
 * dashboard and the transaction table are only downloaded when visited.
 */
const TransactionsPage = lazy(() =>
  import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
);
const TransactionEditorPage = lazy(() =>
  import('@/pages/TransactionEditorPage').then((m) => ({
    default: m.TransactionEditorPage,
  })),
);
const BudgetsPage = lazy(() =>
  import('@/pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner className="size-6" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <FinanceProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="transactions/new" element={<TransactionEditorPage />} />
                    <Route path="transactions/:id/edit" element={<TransactionEditorPage />} />
                    <Route path="budgets" element={<BudgetsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </FinanceProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

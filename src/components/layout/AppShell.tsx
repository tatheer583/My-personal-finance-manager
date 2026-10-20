import { Outlet } from 'react-router-dom';
import { BrandMark, Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';
import { useFinance } from '@/context/financeContext';
import { formatCurrency } from '@/lib/format';

/**
 * Application chrome: a persistent sidebar on large screens and a bottom tab
 * bar plus compact header on small screens.
 */
export function AppShell() {
  const { state, settings } = useFinance();
  const balance = state.transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0,
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact header for small screens. */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-canvas/85 px-4 py-3 backdrop-blur lg:hidden">
          <BrandMark className="size-8 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-fg">My Finance</p>
            <p className="truncate text-xs leading-tight text-subtle tabular">
              Balance {formatCurrency(balance, settings.currency, settings.locale)}
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop top bar. */}
        <header className="hidden items-center justify-end gap-3 px-8 pt-6 lg:flex">
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl pt-5 lg:pt-0">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

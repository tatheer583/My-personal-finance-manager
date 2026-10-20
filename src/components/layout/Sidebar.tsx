import { NavLink } from 'react-router-dom';
import { Download, Plus, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFinance } from '@/context/financeContext';
import { transactionsToCsv, downloadFile } from '@/lib/csv';
import { useToast } from '@/context/toastContext';
import { NAV_ITEMS } from './navItems';

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm shadow-accent/25',
        className,
      )}
      aria-hidden="true"
    >
      <Wallet className="size-5" />
    </div>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { transactions, categories, settings } = useFinance();
  const { toast } = useToast();

  const handleExport = () => {
    if (transactions.length === 0) {
      toast('There are no transactions to export yet.', 'info');
      return;
    }
    const csv = transactionsToCsv(transactions, {
      categories,
      currency: settings.currency,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`transactions_${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    toast(`Exported ${transactions.length} transactions.`);
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">My Finance</p>
          <p className="truncate text-xs text-subtle">Personal tracker</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <NavLink
          to="/transactions/new"
          onClick={onNavigate}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-fg',
            'shadow-sm shadow-accent/20 transition-all hover:bg-accent-hover active:scale-[0.98]',
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
          New transaction
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-fg',
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={handleExport}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </button>
        <p className="mt-3 text-center text-[11px] text-subtle">
          Stored privately on this device
        </p>
      </div>
    </aside>
  );
}

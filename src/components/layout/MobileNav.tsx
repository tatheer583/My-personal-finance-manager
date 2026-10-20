import { NavLink } from 'react-router-dom';
import { ListOrdered, Plus, Settings, Target, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/cn';

const TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Records', icon: ListOrdered, end: false },
  { to: '/budgets', label: 'Budgets', icon: Target, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

/**
 * Bottom tab bar for small screens.
 *
 * Version 1 of this app hid the only navigation behind `hidden md:flex`,
 * which left phones with no way to reach any screen other than the
 * dashboard. This bar closes that gap.
 */
export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 py-1.5">
        {TABS.slice(0, 2).map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}

        <div className="flex justify-center">
          <NavLink
            to="/transactions/new"
            aria-label="Add transaction"
            className={({ isActive }) =>
              cn(
                'flex size-12 -translate-y-3 items-center justify-center rounded-2xl shadow-lg shadow-accent/30 transition-transform active:scale-95',
                isActive ? 'bg-accent-hover' : 'bg-accent',
              )
            }
          >
            <Plus className="size-6 text-accent-fg" aria-hidden="true" />
          </NavLink>
        </div>

        {TABS.slice(2).map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors',
          isActive ? 'text-accent' : 'text-subtle hover:text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-5" aria-hidden="true" />
          <span>{label}</span>
          <span
            className={cn(
              'h-0.5 w-5 rounded-full transition-colors',
              isActive ? 'bg-accent' : 'bg-transparent',
            )}
            aria-hidden="true"
          />
        </>
      )}
    </NavLink>
  );
}

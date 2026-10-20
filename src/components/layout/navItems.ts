import {
  LayoutDashboard,
  ListOrdered,
  Settings,
  Target,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

/** Primary navigation, shared by the sidebar and the mobile tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ListOrdered },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
];

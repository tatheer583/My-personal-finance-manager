import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  PieChart,
  ListOrdered,
  Users,
  Download
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'income' | 'expense' | 'transactions' | 'senders') => void;
  onExport: () => void;
}

/**
 * Sidebar Component
 * @description Main navigation menu for app views and CSV export
 * @param {string} currentView - Currently active view
 * @param {Function} onNavigate - Callback to change views
 * @param {Function} onExport - Callback to export data as CSV
 * @returns Sidebar navigation with view links and export button
 */
export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onExport }) => {

  const navItemClass = (isActive: boolean) => `
    flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 group w-full text-left
    ${isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:translate-x-1'
    }
  `;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex animate-slideInRight z-20">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg animate-scaleIn">
          <PieChart className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">My Finance</span>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`${navItemClass(currentView === 'dashboard')} animate-fadeIn`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>

        <div className="my-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-fadeIn delay-100">
          Actions
        </div>

        <button
          onClick={() => onNavigate('income')}
          className={`${navItemClass(currentView === 'income')} animate-fadeIn delay-150`}
        >
          <Wallet className="w-5 h-5" />
          <span className="font-medium">Add Income</span>
        </button>

        <button
          onClick={() => onNavigate('expense')}
          className={`${navItemClass(currentView === 'expense')} animate-fadeIn delay-200`}
        >
          <TrendingDown className="w-5 h-5" />
          <span className="font-medium">Add Expense</span>
        </button>

        <div className="my-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-fadeIn delay-300">
          Management
        </div>

        <button
          onClick={() => onNavigate('transactions')}
          className={`${navItemClass(currentView === 'transactions')} animate-fadeIn delay-300`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="font-medium">Transactions</span>
        </button>

        <button
          onClick={() => onNavigate('senders')}
          className={`${navItemClass(currentView === 'senders')} animate-fadeIn delay-500`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Manage Senders</span>
        </button>

        <div className="mt-8 px-4 animate-fadeIn delay-500">
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-lg transition-all duration-300 text-sm font-medium hover:shadow-lg hover:border-slate-600 hover:text-white transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center animate-fadeIn delay-500">
        © {new Date().getFullYear()} Muhammad Tatheer
      </div>
    </aside>
  );
};
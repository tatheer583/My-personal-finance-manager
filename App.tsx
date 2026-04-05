import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { IncomeForm } from './components/IncomeForm';
import { ExpenseForm } from './components/ExpenseForm';
import { ManageSenders } from './components/ManageSenders';
import { TransactionsList } from './components/TransactionsList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Transaction, TransactionType } from './types';
import { PREDEFINED_SENDERS } from './constants';

/**
 * Validates transaction schema
 * @param data - Parsed transaction data
 * @returns true if valid transaction array
 */
const isValidTransaction = (data: unknown): data is Transaction[] => {
  if (!Array.isArray(data)) return false;
  return data.every(
    (t) =>
      typeof t.id === 'number' &&
      (t.type === 'INCOME' || t.type === 'EXPENSE') &&
      typeof t.amount === 'number' &&
      t.amount > 0 &&
      typeof t.categoryOrSender === 'string' &&
      t.categoryOrSender.trim().length > 0 &&
      typeof t.date === 'string'
  );
};

/**
 * Loads transactions from localStorage with validation
 * @returns Array of valid transactions or empty array
 */
const loadTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem('transactions');
    if (!stored) return [];

    const data = JSON.parse(stored);
    if (!isValidTransaction(data)) {
      console.warn('Invalid transaction data detected, resetting to empty');
      return [];
    }
    return data;
  } catch (e) {
    console.error('Failed to load transactions:', e);
    return [];
  }
};

/**
 * Loads senders from localStorage with fallback to defaults
 * @returns Array of sender names
 */
const loadSenders = (): string[] => {
  try {
    const stored = localStorage.getItem('senders');
    if (!stored) return [...PREDEFINED_SENDERS];

    const data = JSON.parse(stored);
    if (Array.isArray(data) && data.every((s) => typeof s === 'string')) {
      return data;
    }
    return [...PREDEFINED_SENDERS];
  } catch (e) {
    console.error('Failed to load senders:', e);
    return [...PREDEFINED_SENDERS];
  }
};

type ViewState = 'dashboard' | 'income' | 'expense' | 'transactions' | 'senders';

/**
 * App Component
 * @description Root component managing global state, view routing, and data persistence
 * @returns Main application layout with navigation and view routing
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [senders, setSenders] = useState<string[]>(loadSenders);

  // Persist transactions when they change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Persist senders when they change
  useEffect(() => {
    localStorage.setItem('senders', JSON.stringify(senders));
  }, [senders]);

  const handleAddTransaction = (
    type: TransactionType,
    amount: number,
    categoryOrSender: string,
    note: string
  ) => {
    const newTransaction: Transaction = {
      id: Date.now(),
      type,
      amount,
      categoryOrSender,
      date: new Date().toISOString(),
      note,
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleAddSender = (name: string) => {
    if (!senders.includes(name)) {
      setSenders(prev => [...prev, name]);
    }
  };

  const handleDeleteSender = (name: string) => {
    setSenders(prev => prev.filter(s => s !== name));
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Type", "Category/Sender", "Amount", "Date", "Note"];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      `"${t.categoryOrSender.replace(/"/g, '""')}"`, // Escape quotes
      t.amount,
      t.date,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} />;
      case 'income':
        return (
          <IncomeForm
            senders={senders}
            onSave={(amount, sender, note) => {
              handleAddTransaction('INCOME', amount, sender, note);
              setCurrentView('dashboard');
            }}
          />
        );
      case 'expense':
        return (
          <ExpenseForm
            onSave={(amount, category) => {
              handleAddTransaction('EXPENSE', amount, category, '');
              setCurrentView('dashboard');
            }}
          />
        );
      case 'transactions':
        return <TransactionsList transactions={transactions} />;
      case 'senders':
        return (
          <ManageSenders
            senders={senders}
            onAdd={handleAddSender}
            onDelete={handleDeleteSender}
          />
        );
      default:
        return <Dashboard transactions={transactions} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onExport={handleExportCSV}
        />

        <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 bg-slate-900/50">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {renderContent()}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
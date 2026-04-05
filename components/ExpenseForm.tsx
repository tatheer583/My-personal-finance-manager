import React, { useState } from 'react';
import { CURRENCY } from '../constants';
import { MinusCircle, Save } from 'lucide-react';

interface ExpenseFormProps {
  onSave: (amount: number, category: string) => void;
}

/**
 * ExpenseForm Component
 * @description Form to record expenses with free-text category input
 * @param {Function} onSave - Callback with (amount, category) parameters
 * @returns Expense form with validation and error feedback
 */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!category?.trim()) {
      setError('Please enter a category');
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val)) {
      setError('Please enter a valid amount');
      return;
    }
    if (val <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (val > 999999999) {
      setError('Amount is too large');
      return;
    }

    onSave(val, category.trim());
    setAmount('');
    setCategory('');
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-slideUp">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg hover:shadow-2xl hover:shadow-red-900/10 transition-shadow duration-500">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-6">
          <div className="bg-red-500/10 p-3 rounded-full animate-scaleIn">
            <MinusCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Record Expense</h2>
            <p className="text-slate-400">Track your spending and categories</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-medium animate-slideDown">
              {error}
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-slate-300 group-hover:text-red-400 transition-colors">Purpose / Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. University Fees, Food, Transport"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all hover:bg-slate-800"
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-slate-300 group-hover:text-red-400 transition-colors">Amount ({CURRENCY})</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{CURRENCY}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-14 text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono text-lg hover:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/20"
            >
              <Save className="w-5 h-5" />
              Save Expense
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
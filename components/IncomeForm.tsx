import React, { useState, useEffect } from 'react';
import { CURRENCY } from '../constants';
import { PlusCircle, Save } from 'lucide-react';

interface IncomeFormProps {
  senders: string[];
  onSave: (amount: number, sender: string, note: string) => void;
}

/**
 * IncomeForm Component
 * @description Form to record income from predefined senders with optional notes
 * @param {string[]} senders - List of available income senders
 * @param {Function} onSave - Callback with (amount, sender, note) parameters
 * @returns Income form with validation and error feedback
 */
export const IncomeForm: React.FC<IncomeFormProps> = ({ senders, onSave }) => {
  const [sender, setSender] = useState(senders[0] || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Update sender if list changes
  useEffect(() => {
    if (senders.length > 0 && !sender) {
      setSender(senders[0]);
    }
  }, [senders, sender]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!sender?.trim()) {
      setError('Please select a sender');
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

    onSave(val, sender, note.trim());
    setAmount('');
    setNote('');
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-slideUp">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg hover:shadow-2xl hover:shadow-green-900/10 transition-shadow duration-500">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-6">
          <div className="bg-green-500/10 p-3 rounded-full animate-scaleIn">
            <PlusCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Record Income</h2>
            <p className="text-slate-400">Add funds from a family member or source</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-medium animate-slideDown">
              {error}
            </div>
          )}

          <div className="space-y-2 group">
            <label htmlFor="sender-select" className="text-sm font-medium text-slate-300 group-hover:text-green-400 transition-colors">Select Sender</label>
            {senders.length > 0 ? (
              <select
                id="sender-select"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer hover:bg-slate-800"
              >
                {senders.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                No senders defined. Please go to "Manage Senders" to add one.
              </div>
            )}
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-slate-300 group-hover:text-green-400 transition-colors">Amount ({CURRENCY})</label>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-14 text-white placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-lg hover:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-medium text-slate-300 group-hover:text-green-400 transition-colors">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Monthly allowance"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all hover:bg-slate-800"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={senders.length === 0}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-900/20"
            >
              <Save className="w-5 h-5" />
              Save Income
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
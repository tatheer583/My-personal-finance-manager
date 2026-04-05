import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { CURRENCY, DATE_FORMAT_OPTIONS } from '../constants';
import { Search, Filter, Calendar } from 'lucide-react';

interface TransactionsListProps {
  transactions: Transaction[];
}

/**
 * TransactionsList Component
 * @description Displays all transactions with advanced filtering (type, text search, date range)
 * @param {Transaction[]} transactions - Array of all transactions
 * @returns Filtered transaction table with multiple search options
 */
export const TransactionsList: React.FC<TransactionsListProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /**
   * Filters transactions based on type, search text, and date range
   * Uses immutable date operations to avoid mutation issues
   */
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type Filter
      if (filterType !== 'ALL' && t.type !== filterType) return false;

      // Text Filter
      if (searchText) {
        const query = searchText.toLowerCase();
        const matchCategory = t.categoryOrSender.toLowerCase().includes(query);
        const matchNote = t.note?.toLowerCase().includes(query);
        if (!matchCategory && !matchNote) return false;
      }

      // Date Filter (using immutable date operations)
      if (startDate) {
        const tDate = new Date(t.date).getTime();
        const start = new Date(startDate).getTime();
        if (tDate < start) return false;
      }
      if (endDate) {
        const tDate = new Date(t.date).getTime();
        // Add 1 day to include all transactions on the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        const endTime = end.getTime();
        if (tDate >= endTime) return false;
      }

      return true;
    });
  }, [transactions, filterType, searchText, startDate, endDate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'decimal', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-slideUp h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tight">Transactions</h2>
        <span className="text-slate-400 bg-slate-800 px-3 py-1 rounded-full text-sm font-medium animate-fadeIn">
          {filteredTransactions.length} records found
        </span>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 hover:border-slate-600 transition-colors">

        {/* Type Filter */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <Filter className="w-4 h-4" />
          </div>
          <select
            title="Filter by transaction type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all hover:bg-slate-800"
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="relative md:col-span-1 group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search category, sender..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-slate-800"
          />
        </div>

        {/* Date Filters */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            title="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-slate-800"
          />
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            title="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-slate-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 hover:border-slate-600 transition-colors">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 text-slate-200 uppercase font-medium sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Source / Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Date</th>
                <th className="px-6 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-fadeIn">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>No transactions match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-700/30 transition-colors duration-200 animate-fadeIn">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${t.type === 'INCOME'
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-red-900/50 text-red-400 border border-red-800'
                        }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {t.categoryOrSender}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-400' : 'text-slate-200'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500">
                      {new Date(t.date).toLocaleDateString('en-PK', DATE_FORMAT_OPTIONS)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                      {t.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
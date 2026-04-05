import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { CURRENCY, DATE_FORMAT_OPTIONS } from '../constants';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

/**
 * Dashboard Component
 * @description Displays financial summary, interactive charts, and recent transactions
 * @param {Transaction[]} transactions - Array of all transactions for analysis
 * @returns Dashboard view with summary cards, analytics, and transaction list
 */
export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  // Prepare chart data (Income vs Expense)
  const chartData = [
    { name: 'Income', amount: summary.totalIncome, color: '#22c55e' },
    { name: 'Expense', amount: summary.totalExpense, color: '#ef4444' }
  ];

  // Get recent 10 transactions
  const recentTransactions = transactions.slice(0, 10);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'decimal', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h2>
        <span className="text-sm text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full">
          {transactions.length} transactions tracked
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 ease-out cursor-default">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 group-hover:rotate-12 transform">
            <Wallet className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Current Balance</p>
            <h3 className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {CURRENCY} {formatCurrency(summary.balance)}
            </h3>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-green-900/10 transition-all duration-300 ease-out cursor-default">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 group-hover:-translate-y-2 transform">
            <ArrowUpCircle className="w-24 h-24 text-green-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Total Income</p>
            <h3 className="text-3xl font-bold text-slate-100">
              {CURRENCY} {formatCurrency(summary.totalIncome)}
            </h3>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-red-900/10 transition-all duration-300 ease-out cursor-default">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 group-hover:translate-y-2 transform">
            <ArrowDownCircle className="w-24 h-24 text-red-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Total Expense</p>
            <h3 className="text-3xl font-bold text-slate-100">
              {CURRENCY} {formatCurrency(summary.totalExpense)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm lg:col-span-1 flex flex-col hover:border-slate-600 transition-colors duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Analysis
          </h3>
          <div className="flex-1 min-h-[250px] animate-fadeIn delay-150">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={1500}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-0 shadow-sm lg:col-span-2 overflow-hidden flex flex-col hover:border-slate-600 transition-colors duration-300">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-slate-200 uppercase font-medium">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Source / Category</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-700/50 transition-colors duration-200 animate-fadeIn">
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
                        {t.note && <div className="text-xs text-slate-500 font-normal mt-0.5">{t.note}</div>}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-400' : 'text-slate-200'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500">
                        {new Date(t.date).toLocaleDateString('en-PK', DATE_FORMAT_OPTIONS).split(',')[0]}
                        <div className="text-xs">{new Date(t.date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
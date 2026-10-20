import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { Badge, Card, ColorDot, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useFinance } from '@/context/financeContext';
import { useToast } from '@/context/toastContext';
import { applyFilters } from '@/lib/stats';
import { formatCurrency, formatDay } from '@/lib/format';
import { PAGE_SIZE } from '@/constants';
import type { Transaction, TransactionFilter } from '@/types';

const DEFAULT_FILTERS: TransactionFilter = {
  type: 'all',
  categoryIds: [],
  search: '',
  range: { preset: 'all', from: null, to: null },
  sort: 'date-desc',
};

export function TransactionsPage() {
  const { transactions, categories, categoryById, settings, deleteTransaction } = useFinance();
  const { toast } = useToast();

  const [filters, setFilters] = useState<TransactionFilter>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () =>
      applyFilters(
        transactions,
        {
          type: filters.type,
          categoryIds: filters.categoryIds,
          search: filters.search,
          from: filters.range.from,
          to: filters.range.to,
          sort: filters.sort,
        },
        categories,
      ),
    [transactions, filters, categories],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTransaction(pendingDelete.id);
    toast('Transaction deleted.', 'info');
    setPendingDelete(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Transactions</h1>
          <p className="mt-1 text-sm text-muted">
            Search, filter and edit every entry in your history.
          </p>
        </div>
        <Link
          to="/transactions/new"
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg shadow-sm shadow-accent/20 transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" aria-hidden="true" />
          New transaction
        </Link>
      </header>

      <TransactionFilters
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(0);
        }}
        categories={categories}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt className="size-5" />}
            title={transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            description={
              transactions.length === 0
                ? 'Record your first income or expense to start tracking.'
                : 'Try adjusting or clearing your filters.'
            }
            action={
              transactions.length === 0 ? (
                <Link
                  to="/transactions/new"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add transaction
                </Link>
              ) : null
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card flush className="hidden overflow-hidden md:block">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Note</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((transaction) => {
                    const category = categoryById.get(transaction.categoryId);
                    const income = transaction.type === 'income';
                    return (
                      <tr key={transaction.id} className="transition-colors hover:bg-surface-2/50">
                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                          {formatDay(transaction.date, settings.locale)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={income ? 'positive' : 'negative'}>
                            {income ? 'Income' : 'Expense'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-fg">
                            <ColorDot color={category?.color ?? '#64748b'} />
                            {category?.name ?? 'Uncategorised'}
                          </span>
                        </td>
                        <td className="max-w-[240px] truncate px-5 py-3 text-muted">
                          {transaction.note || '—'}
                        </td>
                        <td
                          className={cn(
                            'whitespace-nowrap px-5 py-3 text-right font-semibold tabular',
                            income ? 'text-positive' : 'text-fg',
                          )}
                        >
                          {income ? '+' : '−'}
                          {formatCurrency(transaction.amount, settings.currency, settings.locale)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/transactions/${transaction.id}/edit`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                              aria-label={`Edit transaction from ${formatDay(transaction.date, settings.locale)}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(transaction)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-negative-soft hover:text-negative"
                              aria-label={`Delete transaction from ${formatDay(transaction.date, settings.locale)}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile list */}
          <ul className="space-y-2 md:hidden">
            {visible.map((transaction) => {
              const category = categoryById.get(transaction.categoryId);
              const income = transaction.type === 'income';
              return (
                <li key={transaction.id} className="surface-card p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                        income ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative',
                      )}
                      aria-hidden="true"
                    >
                      <ColorDot color={category?.color ?? '#64748b'} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-medium text-fg">
                          {category?.name ?? 'Uncategorised'}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 font-semibold tabular',
                            income ? 'text-positive' : 'text-fg',
                          )}
                        >
                          {income ? '+' : '−'}
                          {formatCurrency(transaction.amount, settings.currency, settings.locale)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-subtle">
                        {formatDay(transaction.date, settings.locale)} · {income ? 'Income' : 'Expense'}
                      </p>
                      {transaction.note ? (
                        <p className="mt-1 truncate text-xs text-muted">{transaction.note}</p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          to={`/transactions/${transaction.id}/edit`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:text-fg"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(transaction)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-negative/40 hover:text-negative"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-sm text-muted tabular">
                Page {safePage + 1} of {pageCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  icon={<ChevronLeft className="size-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this transaction?"
        description="This permanently removes the entry from your history. It cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

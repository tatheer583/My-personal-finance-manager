import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useFinance } from '@/context/financeContext';
import { useToast } from '@/context/toastContext';
import { formatCurrency } from '@/lib/format';
import type { TransactionType } from '@/types';
import { useState } from 'react';

export function TransactionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, settings } =
    useFinance();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const existing = useMemo(
    () => (id ? transactions.find((t) => t.id === id) : undefined),
    [id, transactions],
  );

  const defaultType: TransactionType =
    searchParams.get('type') === 'income' ? 'income' : 'expense';

  const handleSubmit = (input: Parameters<typeof addTransaction>[0]) => {
    if (existing) {
      updateTransaction(existing.id, input);
      toast('Transaction updated.');
    } else {
      addTransaction(input);
      toast(
        input.type === 'income' ? 'Income recorded.' : 'Expense recorded.',
      );
    }
    navigate('/transactions');
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteTransaction(existing.id);
    setConfirmingDelete(false);
    toast('Transaction deleted.', 'info');
    navigate('/transactions');
  };

  // Editing a transaction that no longer exists (deleted in another tab).
  if (id && !existing) {
    return (
      <Card>
        <EmptyState
          title="Transaction not found"
          description="It may have been deleted already."
          action={
            <Link
              to="/transactions"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Back to transactions
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-4">
      <header>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to transactions
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
          {existing ? 'Edit transaction' : 'New transaction'}
        </h1>
        {existing ? (
          <p className="mt-1 text-sm text-muted tabular">
            Currently {formatCurrency(existing.amount, settings.currency, settings.locale)} on{' '}
            {existing.date}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Record money coming in or going out.</p>
        )}
      </header>

      <Card>
        <TransactionForm
          initial={existing}
          defaultType={defaultType}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/transactions')}
          submitLabel={existing ? 'Save changes' : 'Save transaction'}
        />
      </Card>

      {existing ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setConfirmingDelete(true)}
            icon={<Trash2 className="size-4" />}
            className="text-negative hover:bg-negative-soft"
          >
            Delete this transaction
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this transaction?"
        description="This permanently removes the entry from your history. It cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

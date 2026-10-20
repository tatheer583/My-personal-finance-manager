import { useMemo, useState } from 'react';
import { Pencil, Plus, Target, Trash2, TrendingDown } from 'lucide-react';
import { Badge, Card, CardHeader, ColorDot, EmptyState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useFinance } from '@/context/financeContext';
import { useToast } from '@/context/toastContext';
import { budgetStatuses, overallBudgetStatus } from '@/lib/stats';
import { formatCurrency, currentMonthKey, formatMonthKey } from '@/lib/format';
import type { Category } from '@/types';

export function BudgetsPage() {
  const { transactions, categories, budgets, settings, setBudget, removeBudget, updateSettings } =
    useFinance();
  const { toast } = useToast();

  const [editing, setEditing] = useState<Category | null>(null);
  const [draftAmount, setDraftAmount] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<Category | null>(null);

  const monthKey = currentMonthKey();
  const statuses = useMemo(
    () => budgetStatuses(budgets, transactions, categories, monthKey),
    [budgets, transactions, categories, monthKey],
  );
  const overall = useMemo(
    () => overallBudgetStatus(settings.monthlyBudget, transactions, monthKey),
    [settings.monthlyBudget, transactions, monthKey],
  );

  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgeted = expenseCategories.filter((c) => !budgetedIds.has(c.id));

  const openEditor = (category: Category) => {
    setEditing(category);
    const existing = budgets.find((b) => b.categoryId === category.id);
    setDraftAmount(existing ? String(existing.amount) : '');
  };

  const saveBudget = () => {
    if (!editing) return;
    const value = Number(draftAmount);
    if (!Number.isFinite(value) || value <= 0) {
      toast('Enter a budget amount greater than zero.', 'error');
      return;
    }
    setBudget(editing.id, value);
    toast(`Budget for ${editing.name} saved.`);
    setEditing(null);
  };

  const confirmRemove = () => {
    if (!pendingRemoval) return;
    removeBudget(pendingRemoval.id);
    toast(`Budget for ${pendingRemoval.name} removed.`, 'info');
    setPendingRemoval(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Budgets</h1>
        <p className="mt-1 text-sm text-muted">
          Set limits and track how much of them you have used for {formatMonthKey(monthKey, settings.locale)}.
        </p>
      </header>

      {/* Overall limit */}
      <Card>
        <CardHeader
          title="Overall monthly limit"
          description="A single ceiling across every expense category."
          action={
            <Badge tone={overall.over ? 'negative' : overall.percent > 80 ? 'warning' : 'positive'}>
              {settings.monthlyBudget <= 0
                ? 'Not set'
                : overall.over
                  ? 'Over limit'
                  : `${overall.percent.toFixed(0)}% used`}
            </Badge>
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field label="Monthly limit" className="flex-1">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0"
                value={settings.monthlyBudget || ''}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  updateSettings({ monthlyBudget: Number.isFinite(value) ? value : 0 });
                }}
              />
            )}
          </Field>
          <Field label="Daily spending limit" className="flex-1">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0"
                value={settings.dailyLimit || ''}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  updateSettings({ dailyLimit: Number.isFinite(value) ? value : 0 });
                }}
              />
            )}
          </Field>
        </div>

        {settings.monthlyBudget > 0 ? (
          <>
            <ProgressBar
              value={overall.percent}
              color={overall.over ? 'var(--negative)' : 'var(--accent)'}
              className="mt-4"
            />
            <p className="mt-2 text-xs text-muted tabular">
              {formatCurrency(overall.spent, settings.currency, settings.locale)} spent ·{' '}
              {overall.over
                ? `${formatCurrency(Math.abs(overall.remaining), settings.currency, settings.locale)} over`
                : `${formatCurrency(overall.remaining, settings.currency, settings.locale)} remaining`}
            </p>
          </>
        ) : null}
      </Card>

      {/* Per-category budgets */}
      <Card>
        <CardHeader
          title="Category budgets"
          description="Set an individual ceiling for each spending category."
        />

        {statuses.length === 0 ? (
          <EmptyState
            icon={<Target className="size-5" />}
            title="No category budgets yet"
            description="Pick a category below to set a limit for it."
          />
        ) : (
          <ul className="space-y-5">
            {statuses.map((status) => (
              <li key={status.budget.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <ColorDot color={status.category?.color ?? '#64748b'} />
                    <span className="truncate font-medium text-fg">
                      {status.category?.name ?? 'Uncategorised'}
                    </span>
                    {status.over ? (
                      <Badge tone="negative">Over</Badge>
                    ) : status.percent > 80 ? (
                      <Badge tone="warning">Almost</Badge>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-sm text-muted tabular">
                      {formatCurrency(status.spent, settings.currency, settings.locale)} /{' '}
                      {formatCurrency(status.budget.amount, settings.currency, settings.locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditor(status.category!)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      aria-label={`Edit budget for ${status.category?.name ?? 'category'}`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => status.category && setPendingRemoval(status.category)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-negative-soft hover:text-negative"
                      aria-label={`Remove budget for ${status.category?.name ?? 'category'}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                </div>
                <ProgressBar
                  value={status.percent}
                  color={
                    status.over
                      ? 'var(--negative)'
                      : status.percent > 80
                        ? 'var(--warning)'
                        : 'var(--accent)'
                  }
                />
              </li>
            ))}
          </ul>
        )}

        {unbudgeted.length > 0 ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-sm font-medium text-muted">Add a budget for</p>
            <div className="flex flex-wrap gap-2">
              {unbudgeted.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openEditor(category)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-border-strong"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Savings goal */}
      <Card>
        <CardHeader
          title="Savings goal"
          description="Track how much you set aside each month."
          action={<TrendingDown className="size-4 text-subtle" aria-hidden="true" />}
        />
        <Field label="Monthly savings target">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={settings.savingsGoal || ''}
              onChange={(event) => {
                const value = Number(event.target.value);
                updateSettings({ savingsGoal: Number.isFinite(value) ? value : 0 });
              }}
            />
          )}
        </Field>
        {settings.savingsGoal > 0 ? (
          <p className="mt-3 text-xs text-muted">
            Set a target to see your progress on the dashboard.
          </p>
        ) : null}
      </Card>

      {/* Budget editor modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setEditing(null)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl border border-border bg-surface p-5 shadow-pop animate-slide-up sm:rounded-2xl">
            <h2 className="text-base font-semibold text-fg">
              Budget for {editing.name}
            </h2>
            <p className="mt-1 text-sm text-muted">The limit resets at the start of each month.</p>
            <div className="mt-4">
              <Field label={`Amount (${settings.currency})`}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    autoFocus
                    value={draftAmount}
                    onChange={(event) => setDraftAmount(event.target.value)}
                  />
                )}
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={saveBudget}>Save budget</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove this budget?"
        description={`The limit for ${pendingRemoval?.name ?? 'this category'} will be removed. Your transactions are not affected.`}
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChartPie,
  PiggyBank,
  Plus,
  Receipt,
  Target,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { Badge, Card, CardHeader, ColorDot, EmptyState, ProgressBar } from '@/components/ui/Card';
import { cn } from '@/lib/cn';import { useFinance } from '@/context/financeContext';
import {
  budgetStatuses,
  categoryBreakdown,
  monthlySeries,
  overallBudgetStatus,
  summarize,
} from '@/lib/stats';
import { formatCurrency, formatDay, formatMonthKey } from '@/lib/format';

type RangeKey = '3m' | '6m' | '12m' | 'all';

const RANGES: { key: RangeKey; label: string; months: number }[] = [
  { key: '3m', label: '3M', months: 3 },
  { key: '6m', label: '6M', months: 6 },
  { key: '12m', label: '12M', months: 12 },
  { key: 'all', label: 'All', months: 120 },
];

export function DashboardPage() {
  const { transactions, categories, budgets, settings, categoryById } = useFinance();
  const [range, setRange] = useState<RangeKey>('6m');

  const { currency, locale } = settings;
  const months = RANGES.find((r) => r.key === range)?.months ?? 6;

  const series = useMemo(
    () =>
      monthlySeries(transactions, months, {
        labelFor: (key) => formatMonthKey(key, locale),
      }),
    [transactions, months, locale],
  );

  const summary = useMemo(() => summarize(transactions), [transactions]);

  const expenseSlices = useMemo(
    () => categoryBreakdown(transactions, categories, 'expense'),
    [transactions, categories],
  );

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    [transactions],
  );

  const budgetStatus = useMemo(
    () => overallBudgetStatus(settings.monthlyBudget, transactions),
    [settings.monthlyBudget, transactions],
  );

  const perCategoryBudgets = useMemo(
    () => budgetStatuses(budgets, transactions, categories),
    [budgets, transactions, categories],
  );

  const monthLabels = series.map((point) => point.label);

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {transactions.length === 0
              ? 'Start by recording your first transaction.'
              : `Tracking ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
            role="group"
            aria-label="Chart range"
          >
            {RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  range === option.key
                    ? 'bg-accent text-accent-fg shadow-sm'
                    : 'text-muted hover:text-fg',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Link
            to="/transactions/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-fg shadow-sm shadow-accent/20 transition-colors hover:bg-accent-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Link>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current balance"
          value={formatCurrency(summary.balance, currency, locale)}
          icon={<Wallet className="size-[18px]" />}
          tone={summary.balance >= 0 ? 'positive' : 'negative'}
          hint="All-time income minus expenses"
        />
        <StatCard
          label="Total income"
          value={formatCurrency(summary.income, currency, locale)}
          icon={<ArrowUpCircle className="size-[18px]" />}
          tone="positive"
          hint={`${transactions.filter((t) => t.type === 'income').length} income entries`}
        />
        <StatCard
          label="Total expenses"
          value={formatCurrency(summary.expense, currency, locale)}
          icon={<ArrowDownCircle className="size-[18px]" />}
          tone="negative"
          hint={`${transactions.filter((t) => t.type === 'expense').length} expense entries`}
        />
        <StatCard
          label="Savings rate"
          value={`${summary.savingsRate.toFixed(0)}%`}
          icon={<PiggyBank className="size-[18px]" />}
          tone={summary.savingsRate >= 20 ? 'positive' : summary.savingsRate >= 0 ? 'warning' : 'negative'}
          hint={
            settings.savingsGoal > 0
              ? `Target ${formatCurrency(settings.savingsGoal, currency, locale)}/mo`
              : 'Share of income kept'
          }
        />
      </div>

      {/* Overall budget */}
      {settings.monthlyBudget > 0 ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Target className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">Monthly budget</p>
                <p className="text-xs text-muted">
                  {formatCurrency(budgetStatus.spent, currency, locale)} of{' '}
                  {formatCurrency(settings.monthlyBudget, currency, locale)} spent this month
                </p>
              </div>
            </div>
            <Badge tone={budgetStatus.over ? 'negative' : budgetStatus.percent > 80 ? 'warning' : 'positive'}>
              {budgetStatus.over
                ? `${formatCurrency(Math.abs(budgetStatus.remaining), currency, locale)} over`
                : `${formatCurrency(budgetStatus.remaining, currency, locale)} left`}
            </Badge>
          </div>
          <ProgressBar
            value={budgetStatus.percent}
            color={budgetStatus.over ? 'var(--negative)' : 'var(--accent)'}
            className="mt-4"
          />
        </Card>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Income vs. expenses"
            description={`Monthly totals over the last ${Math.min(months, 12)} months`}
            action={
              <span className="hidden text-xs text-subtle sm:block">{monthLabels[0]}</span>
            }
          />
          {transactions.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="Nothing to chart yet"
              description="Add income and expenses to see your trend over time."
            />
          ) : (
            <TrendChart data={series} currency={currency} locale={locale} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Where money goes"
            description="Spending split by category"
            action={<ChartPie className="size-4 text-subtle" aria-hidden="true" />}
          />
          {expenseSlices.length === 0 ? (
            <EmptyState
              icon={<ChartPie className="size-5" />}
              title="No expenses recorded"
              description="Your category breakdown will appear here."
            />
          ) : (
            <>
              <CategoryDonut data={expenseSlices} currency={currency} locale={locale} />
              <ul className="mt-4 space-y-2">
                {expenseSlices.slice(0, 5).map((slice) => (
                  <li key={slice.categoryId} className="flex items-center gap-2.5 text-sm">
                    <ColorDot color={slice.color} />
                    <span className="min-w-0 flex-1 truncate text-muted">{slice.name}</span>
                    <span className="font-medium text-fg tabular">
                      {formatCurrency(slice.amount, currency, locale)}
                    </span>
                    <span className="w-10 text-right text-xs text-subtle tabular">
                      {slice.percent.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Recent transactions + budgets */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" flush>
          <div className="p-5 pb-3 sm:p-6 sm:pb-4">
            <CardHeader
              title="Recent transactions"
              description="Your eight most recent entries"
              action={
                <Link
                  to="/transactions"
                  className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  View all
                </Link>
              }
              className="mb-0"
            />
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="No transactions yet"
              description="Record income or an expense to get started."
              action={
                <Link
                  to="/transactions/new"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add transaction
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((transaction) => {
                const category = categoryById.get(transaction.categoryId);
                const income = transaction.type === 'income';
                return (
                  <li key={transaction.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        income ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative',
                      )}
                      aria-hidden="true"
                    >
                      {income ? (
                        <ArrowUpCircle className="size-[18px]" />
                      ) : (
                        <ArrowDownCircle className="size-[18px]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {category?.name ?? 'Uncategorised'}
                      </p>
                      <p className="truncate text-xs text-subtle">
                        {formatDay(transaction.date, locale)}
                        {transaction.note ? ` · ${transaction.note}` : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-sm font-semibold tabular',
                        income ? 'text-positive' : 'text-fg',
                      )}
                    >
                      {income ? '+' : '−'}
                      {formatCurrency(transaction.amount, currency, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Budget progress"
            description="Spending against your category limits"
            action={
              <Link
                to="/budgets"
                className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Manage
              </Link>
            }
          />
          {perCategoryBudgets.length === 0 ? (
            <EmptyState
              icon={<Target className="size-5" />}
              title="No category budgets"
              description="Set a limit per category to track your spending."
              action={
                <Link
                  to="/budgets"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 text-sm font-medium text-fg transition-colors hover:border-border-strong"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add a budget
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {perCategoryBudgets.slice(0, 5).map((status) => (
                <li key={status.budget.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <ColorDot color={status.category?.color ?? '#64748b'} />
                      <span className="truncate text-fg">
                        {status.category?.name ?? 'Uncategorised'}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular">
                      {formatCurrency(status.spent, currency, locale)} /{' '}
                      {formatCurrency(status.budget.amount, currency, locale)}
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
        </Card>
      </div>
    </div>
  );
}

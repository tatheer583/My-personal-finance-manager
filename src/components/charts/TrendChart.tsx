import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthPoint } from '@/lib/stats';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';

interface TrendChartProps {
  data: MonthPoint[];
  currency: string;
  locale: string;
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  name?: string;
  payload?: MonthPoint;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div className="space-y-1 text-xs">
        <p className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-positive" aria-hidden="true" />
            Income
          </span>
          <span className="font-semibold text-fg tabular">
            {formatCurrency(point.income)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-negative" aria-hidden="true" />
            Expenses
          </span>
          <span className="font-semibold text-fg tabular">
            {formatCurrency(point.expense)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4 border-t border-border pt-1">
          <span className="text-muted">Net</span>
          <span
            className={`font-semibold tabular ${
              point.balance >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {formatCurrency(point.balance)}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Income vs. expenses over time.
 *
 * The Y axis uses a compact currency format — the previous implementation
 * divided by 1000 unconditionally, which rendered every value below 1000 as
 * "0k" and made small balances unreadable.
 */
export function TrendChart({ data, currency, locale }: TrendChartProps) {
  // A stable id keeps the SVG gradient references consistent across renders.
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradientId}-income`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${gradientId}-expense`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--negative)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--negative)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--subtle)', fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: 'var(--subtle)', fontSize: 12 }}
            tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="var(--positive)"
            strokeWidth={2}
            fill={`url(#${gradientId}-income)`}
            animationDuration={600}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expenses"
            stroke="var(--negative)"
            strokeWidth={2}
            fill={`url(#${gradientId}-expense)`}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

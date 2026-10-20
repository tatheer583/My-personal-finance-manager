import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '@/lib/stats';
import { formatCurrency } from '@/lib/format';

interface CategoryDonutProps {
  data: CategorySlice[];
  currency: string;
  locale: string;
}

interface TooltipEntry {
  payload?: CategorySlice;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]?.payload;
  if (!slice) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="text-xs font-semibold text-fg">{slice.name}</p>
      <p className="mt-0.5 text-xs text-muted tabular">
        {formatCurrency(slice.amount)} · {slice.percent.toFixed(1)}%
      </p>
    </div>
  );
}

/** Donut chart of spending (or income) split by category. */
export function CategoryDonut({ data, currency, locale }: CategoryDonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.amount, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-subtle">
        No data in this period
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<DonutTooltip />} />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            animationDuration={600}
          >
            {data.map((slice) => (
              <Cell key={slice.categoryId} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-wide text-subtle">Total</span>
        <span className="text-lg font-bold text-fg tabular">
          {formatCurrency(total, currency, locale)}
        </span>
      </div>
    </div>
  );
}

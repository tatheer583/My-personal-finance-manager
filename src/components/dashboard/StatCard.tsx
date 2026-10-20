import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'accent' | 'warning';
  /** Optional supporting line under the value. */
  hint?: ReactNode;
}

const TONE_STYLES = {
  neutral: 'bg-surface-2 text-muted',
  positive: 'bg-positive-soft text-positive',
  negative: 'bg-negative-soft text-negative',
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning-soft text-warning',
} as const;

export function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  hint,
}: StatCardProps) {
  return (
    <div className="surface-card p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            TONE_STYLES[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-fg tabular">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

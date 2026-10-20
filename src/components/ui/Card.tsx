import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes the default padding so the card can host flush content. */
  flush?: boolean;
}

export function Card({ flush = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card',
        !flush && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-subtle">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'accent' | 'warning';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-2 text-muted border-border',
    positive: 'bg-positive-soft text-positive border-positive/30',
    negative: 'bg-negative-soft text-negative border-negative/30',
    accent: 'bg-accent-soft text-accent border-accent/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A coloured dot used to identify categories at a glance. */
export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function ProgressBar({
  value,
  color,
  className,
  height = 'h-2',
}: {
  /** 0–100 */
  value: number;
  color?: string;
  className?: string;
  height?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-2', height, className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color ?? 'var(--accent)' }}
      />
    </div>
  );
}

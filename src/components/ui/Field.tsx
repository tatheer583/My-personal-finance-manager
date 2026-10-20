import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-fg placeholder:text-subtle ' +
  'transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required ? <span className="ml-0.5 text-negative">*</span> : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'min-h-24 resize-y', className)} {...rest} />;
}

/**
 * A segmented control used to pick between two or three exclusive options
 * (for example income vs. expense).
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex w-full rounded-lg border border-border bg-surface-2 p-1',
        className,
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-accent text-accent-fg shadow-sm'
                : 'text-muted hover:text-fg',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

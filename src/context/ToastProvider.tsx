import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import clsx from 'clsx';
import { ToastContext } from './toastContext';
import type { ToastTone } from './toastContext';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-positive/40 bg-positive-soft text-positive',
  error: 'border-negative/40 bg-negative-soft text-negative',
  info: 'border-accent/40 bg-accent-soft text-accent',
};

const TONE_ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      counter += 1;
      const id = counter;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const Icon = TONE_ICONS[item.tone];
          return (
            <div
              key={item.id}
              className={clsx(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur animate-slide-up',
                TONE_STYLES[item.tone],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 leading-snug">{item.message}</span>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

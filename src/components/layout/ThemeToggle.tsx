import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/themeContext';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:text-fg',
        className,
      )}
      aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {resolved === 'dark' ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

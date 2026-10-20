import clsx from 'clsx';

/**
 * Small helper so components can compose class names safely.
 * Kept in its own module so UI files only ever export components.
 */
export function cn(...values: (string | false | null | undefined)[]): string {
  return clsx(values);
}

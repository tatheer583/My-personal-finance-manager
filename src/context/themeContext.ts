import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** The preference the user selected (may be `system`). */
  preference: ThemePreference;
  /** The theme actually applied right now. */
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark, pinning the preference to the result. */
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}

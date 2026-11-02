import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { readItem, writeItem } from './utils/storage';

export type Theme = {
  dark: boolean;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  danger: string;
  backdrop: string;
};

const lightTheme: Theme = {
  dark: false,
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceMuted: '#E9E9EF',
  border: '#D6D6DE',
  text: '#141414',
  textMuted: '#6B6B76',
  primary: '#2F5BEA',
  onPrimary: '#FFFFFF',
  success: '#1E8E3E',
  danger: '#D93025',
  backdrop: 'rgba(0, 0, 0, 0.45)',
};

const darkTheme: Theme = {
  dark: true,
  background: '#0E0E12',
  surface: '#1C1C22',
  surfaceMuted: '#2A2A33',
  border: '#3A3A44',
  text: '#F4F4F6',
  textMuted: '#A0A0AB',
  primary: '#7C9CFF',
  onPrimary: '#0E0E12',
  success: '#5BC873',
  danger: '#FF6B5E',
  backdrop: 'rgba(0, 0, 0, 0.6)',
};

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  /** False until the saved preference (if any) has been loaded from storage. */
  isHydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

/** Makes native UI (alerts, keyboard) follow the chosen theme; web has no such override. */
function applyNativeOverride(preference: ThemePreference): void {
  if (Platform.OS === 'web') return;
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readItem('theme')
      .then((stored) => {
        if (cancelled || !isPreference(stored)) return;
        // Keep a choice made while loading instead of overwriting it with the stored one.
        setPreference((current) => (current === 'system' ? stored : current));
      })
      .catch((error: unknown) => console.warn('Failed to load the theme preference', error))
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyNativeOverride(preference);
  }, [preference]);

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const toggle = useCallback(() => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    setPreference(next);
    writeItem('theme', next).catch((error: unknown) =>
      console.warn('Failed to save the theme preference', error),
    );
  }, [isDark]);

  const value = useMemo(
    () => ({ theme: isDark ? darkTheme : lightTheme, toggle, isHydrated }),
    [isDark, toggle, isHydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('Theme hooks must be used within a ThemeProvider');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Switches between the light and dark theme, remembering the choice. */
export function useThemeToggle(): () => void {
  return useThemeContext().toggle;
}

/** False until the saved theme preference has been loaded, so the UI does not flash the wrong theme. */
export function useThemeHydrated(): boolean {
  return useThemeContext().isHydrated;
}

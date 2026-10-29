import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import { darkColors, lightColors, type Colors } from '@/theme/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  colors: Colors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      colors,
      mode,
      isDark,
      setMode,
    }),
    [colors, mode, isDark, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to create memoized StyleSheets using the current colors.
 * Define `stylesFn` at module level so it stays referentially stable.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  stylesFn: (colors: Colors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(stylesFn(colors)), [colors, stylesFn]);
}

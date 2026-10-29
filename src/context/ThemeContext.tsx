import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, type Colors } from '@/theme/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme_mode';

async function getStoredTheme(): Promise<ThemeMode | null> {
  try {
    const val = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (val === 'system' || val === 'light' || val === 'dark') {
      return val;
    }
  } catch (error) {
    console.warn('Failed to load theme preference from storage:', error);
  }
  return null;
}

async function setStoredTheme(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to save theme preference to storage:', error);
  }
}

interface ThemeContextType {
  colors: Colors;
  mode: ThemeMode;
  isDark: boolean;
  isLoaded: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

// provides active theme colors, current mode, and setmode handler across the app
export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getStoredTheme()
      .then((stored) => {
        if (isMounted) {
          if (stored) {
            setModeState(stored);
          }
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    void setStoredTheme(newMode);
  }, []);

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
      isLoaded,
      setMode,
    }),
    [colors, mode, isDark, isLoaded, setMode],
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
 * Define `stylesFn` returning the StyleSheet at module level so it stays referentially stable.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  stylesFn: (colors: Colors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(stylesFn(colors)), [colors, stylesFn]);
}

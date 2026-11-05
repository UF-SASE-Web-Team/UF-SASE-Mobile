import { useEffect, useMemo } from 'react';
import {
  Stack,
  SplashScreen,
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function SplashController() {
  const { isLoading } = useAuth();
  const { isLoaded: isThemeLoaded } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (!isLoading && isThemeLoaded && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isThemeLoaded, fontsLoaded, fontError]);

  return null;
}

function RootNavigator() {
  const { session, isRecovering } = useAuth();
  const { colors, isDark } = useTheme();
  const isAuthenticated = !!session && !isRecovering;

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.surface.saseBlue.primary,
        background: colors.surface.base.primary,
        card: colors.surface.base.secondary,
        text: colors.content.onBase.primary,
        border: colors.border.base.subtle,
        notification: colors.surface.accent.primary,
      },
    }),
    [isDark, colors],
  );

  // syncs custom theme tokens with react navigation elements and screen transitions
  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface.base.primary },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <AuthProvider>
        <SplashController />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

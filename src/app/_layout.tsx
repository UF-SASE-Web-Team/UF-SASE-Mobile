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
import { EventsProvider } from '@/context/EventsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function SplashController({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useAuth();
  const { isLoaded: isThemeLoaded } = useTheme();

  useEffect(() => {
    if (!isLoading && isThemeLoaded && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isThemeLoaded, fontsReady]);

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
          <Stack.Screen name="events/[id]" />
          <Stack.Screen name="profile" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Prevent layout calculation with unmeasured fallback fonts before custom fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <AuthProvider>
        <EventsProvider>
          <SplashController fontsReady={Boolean(fontsLoaded || fontError)} />
          <RootNavigator />
        </EventsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

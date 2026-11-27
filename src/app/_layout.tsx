import { useEffect, useMemo } from 'react';
import {
  Stack,
  SplashScreen,
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
  usePathname,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { EventsProvider } from '@/context/EventsContext';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { fontAssets } from '@/theme';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading, session, isRecovering } = useAuth();
  const { colors, isDark, isLoaded: isThemeLoaded } = useTheme();
  const { onboarding, profile } = useProfile();
  // The database enforces officer access too; this only hides the screens.
  const isOfficer = profile?.role === 'officer';

  const isAuthenticated = !!session && !isRecovering;
  const isOnboarded = onboarding === 'complete';
  // Keep the splash up until we know whether to land on the app or onboarding.
  const isRouteKnown = !session || onboarding !== 'loading';

  useEffect(() => {
    if (!isLoading && isThemeLoaded && fontsReady && isRouteKnown) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isThemeLoaded, fontsReady, isRouteKnown]);

  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (pathname) {
      posthog?.screen(pathname, {
        route: segments.join('/'),
      });
    }
  }, [pathname, segments]);

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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface.base.primary },
        }}
      >
        <Stack.Protected guard={isAuthenticated && !isOnboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && isOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="events/[id]" />
          <Stack.Screen name="programs/[slug]" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="points" />
          <Stack.Screen name="resources/freshman-faqs" />
          <Stack.Protected guard={isOfficer}>
            <Stack.Screen name="admin" />
          </Stack.Protected>
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
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

  const fontsReady = Boolean(fontsLoaded || fontError);

  const appContent = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <EventsProvider>
              <RootNavigator fontsReady={fontsReady} />
            </EventsProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );

  // If no PostHog API key is provided, render app without PostHog
  if (!posthog) {
    return appContent;
  }

  // If PostHog API key is provided, wrap app with PostHog provider
  return (
    <PostHogProvider client={posthog} autocapture>
      {appContent}
    </PostHogProvider>
  );
}

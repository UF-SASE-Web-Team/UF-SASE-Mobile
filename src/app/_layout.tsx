import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

function SplashController() {
  const { isLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (!isLoading && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded, fontError]);

  return null;
}

function RootNavigator() {
  const { session, isRecovering } = useAuth();
  const isAuthenticated = !!session && !isRecovering;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SplashController />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

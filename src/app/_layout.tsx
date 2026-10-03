import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function SplashController() {
  const { isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);
  return null;
}

function RootNavigator() {
  const { session } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      {/* <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected> */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashController />
      <RootNavigator />
    </AuthProvider>
  );
}

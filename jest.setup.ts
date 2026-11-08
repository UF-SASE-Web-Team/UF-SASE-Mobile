import '@testing-library/react-native';
import React from 'react';

process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'mock-anon-key';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useNavigation: jest.fn(() => ({ dispatch: jest.fn() })),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => ''),
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
  DarkTheme: {
    dark: true,
    colors: {
      primary: '#0A84FF',
      background: '#000000',
      card: '#121212',
      text: '#FFFFFF',
      border: '#272729',
      notification: '#FF453A',
    },
  },
  DefaultTheme: {
    dark: false,
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#1C1C1E',
      border: '#D8D8D8',
      notification: '#FF3B30',
    },
  },
  Stack: Object.assign(
    jest.fn(({ children }: { children?: React.ReactNode }) => children ?? null),
    { Screen: jest.fn(() => null) },
  ),
  Tabs: Object.assign(
    jest.fn(({ children }: { children?: React.ReactNode }) => children ?? null),
    { Screen: jest.fn(() => null) },
  ),
}));

// Mock expo-router/unstable-native-tabs
const createTriggerSubcomponent = (name: string) => {
  const comp = jest.fn(() => null);
  Object.assign(comp, { displayName: name });
  return comp;
};

const MockTrigger = Object.assign(
  jest.fn(({ children }: { children?: React.ReactNode }) => children ?? null),
  {
    Label: createTriggerSubcomponent('NativeTabs.Trigger.Label'),
    Icon: createTriggerSubcomponent('NativeTabs.Trigger.Icon'),
    Badge: createTriggerSubcomponent('NativeTabs.Trigger.Badge'),
    VectorIcon: createTriggerSubcomponent('NativeTabs.Trigger.VectorIcon'),
  },
);

const MockNativeTabs = Object.assign(
  jest.fn(({ children }: { children?: React.ReactNode }) => children ?? null),
  {
    Trigger: MockTrigger,
    BottomAccessory: jest.fn(() => null),
  },
);

jest.mock('expo-router/unstable-native-tabs', () => ({
  NativeTabs: MockNativeTabs,
  NativeTabTrigger: MockTrigger,
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      verifyOtp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      resend: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    rpc: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    session: null,
    user: null,
    isLoading: false,
    isRecovering: false,
    setIsRecovering: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  })),
  AuthProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: jest.fn(({ children, onBarcodeScanned, testID, ...props }: any) =>
      React.createElement(View, { testID: testID || 'camera-view', ...props }, children),
    ),
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true, status: 'granted' },
      jest.fn().mockResolvedValue({ granted: true }),
    ]),
  };
});

// Mock @react-native-masked-view/masked-view
jest.mock('@react-native-masked-view/masked-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn(({ maskElement, children, ...props }: any) =>
    React.createElement(View, props, maskElement),
  );
});

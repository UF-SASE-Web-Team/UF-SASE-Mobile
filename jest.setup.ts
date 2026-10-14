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
  Stack: Object.assign(
    jest.fn(({ children }: { children?: React.ReactNode }) => children ?? null),
    { Screen: jest.fn(() => null) },
  ),
}));

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

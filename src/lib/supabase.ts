import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnvironment } from '@/lib/env';
import { Database } from '@/types/supabase';

const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvironment();

// Connection timeout in milliseconds (8 seconds) to prevent hanging on unreachable networks
export const SUPABASE_CONNECTION_TIMEOUT_MS = 8000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('The request took too long to complete.'));
  }, SUPABASE_CONNECTION_TIMEOUT_MS);

  if (init?.signal) {
    if (init.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      init.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Adapter for bridging SecureStore to Supabase storage for auth
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

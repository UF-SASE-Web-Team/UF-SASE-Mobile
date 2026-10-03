import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnvironment } from '@/lib/env';

const { supabaseUrl, supabasePublishableKey } = getSupabaseEnvironment();

// Adapter for bridging SecureStore to Supabase storage for auth
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

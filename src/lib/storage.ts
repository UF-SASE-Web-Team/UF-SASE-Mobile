// Web: expo-secure-store has no web implementation, so fall back to localStorage.
// During static rendering (Node) there is no window, so reads return null and writes are no-ops.
const hasLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  getItem: async (key: string): Promise<string | null> =>
    hasLocalStorage() ? window.localStorage.getItem(key) : null,
  setItem: async (key: string, value: string): Promise<void> => {
    if (hasLocalStorage()) window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (hasLocalStorage()) window.localStorage.removeItem(key);
  },
};

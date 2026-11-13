import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRecovering: boolean;
  setIsRecovering: (value: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecovering, setIsRecovering] = useState(false);

  const signOut = useCallback(async () => {
    setIsRecovering(false);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If the server rejects the sign-out request (e.g. invalid token or wrong project),
        // clear the local session scope to guarantee the user is signed out locally.
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (!currentSession) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      // On startup or token refresh, verify that the session is still valid
      // on the server. If the database was reset, the project changed, or the
      // user was removed, getUser() will reject the token.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        const { error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error) {
          // If the auth server rejects the token (invalid JWT, user not found, 401/403/400),
          // clear the cached session so the user lands on the unauthenticated screen.
          // Retryable network errors (e.g. offline device) are ignored so users aren't logged out when offline.
          if (!isAuthRetryableFetchError(error)) {
            await signOut();
            return;
          }
        }
      }

      setSession(currentSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [signOut]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isRecovering,
      setIsRecovering,
      signOut,
    }),
    [session, isLoading, isRecovering, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

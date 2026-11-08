import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getProfile, updateProfile } from '@/services/profiles';
import type { ProfileChanges, ProfileWithPrograms } from '@/types/profiles';

interface ProfileContextValue {
  profile: ProfileWithPrograms | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  save: (changes: ProfileChanges) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    userId: string;
    revision: number;
    profile: ProfileWithPrograms | null;
    error: string | null;
  } | null>(null);
  const isCurrent = result?.userId === userId && result?.revision === revision;
  const profile = isCurrent ? (result?.profile ?? null) : null;
  const error = isCurrent ? (result?.error ?? null) : null;
  const isLoading = !!userId && !isCurrent;

  useEffect(() => {
    let active = true;
    if (!userId) return;
    getProfile(userId)
      .then((profile) => {
        if (active) setResult({ userId, revision, profile, error: null });
      })
      .catch((cause: unknown) => {
        if (active)
          setResult({
            userId,
            revision,
            profile: null,
            error: getProfileError(cause, 'Could not load your profile.'),
          });
      });
    return () => {
      active = false;
    };
  }, [userId, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const save = useCallback(
    async (changes: ProfileChanges) => {
      if (!userId) throw new Error('Please sign in to edit your profile.');
      const saved = await updateProfile(userId, changes);
      setResult((current) =>
        current?.userId === userId && current.revision === revision && current.profile
          ? { ...current, profile: { ...current.profile, ...saved } }
          : current,
      );
    },
    [userId, revision],
  );
  const value = useMemo(
    () => ({ profile, isLoading, error, reload, save }),
    [profile, isLoading, error, reload, save],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
}

export function getProfileError(cause: unknown, fallback: string): string {
  if (
    cause &&
    typeof cause === 'object' &&
    'message' in cause &&
    typeof cause.message === 'string'
  ) {
    return cause.message;
  }
  return fallback;
}

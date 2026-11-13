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
import { getProfile, getUfid, saveUfid, updateProfile } from '@/services/profiles';
import type { ProfileEdits, ProfileWithPrograms } from '@/types/profiles';

/**
 * `loading` until we know whether the signed-in member has finished onboarding
 * (set a UFID). Once known it stays put across profile reloads.
 */
export type OnboardingStatus = 'loading' | 'required' | 'complete';

interface ProfileContextValue {
  profile: ProfileWithPrograms | null;
  /** The member's own UFID. Private: never render it on a profile. */
  ufid: string | null;
  onboarding: OnboardingStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  save: (changes: ProfileEdits) => Promise<void>;
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
    ufid: string | null;
    error: string | null;
  } | null>(null);
  const [onboarded, setOnboarded] = useState<{ userId: string; complete: boolean } | null>(null);
  const isCurrent = result?.userId === userId && result?.revision === revision;
  const profile = isCurrent ? (result?.profile ?? null) : null;
  const ufid = isCurrent ? (result?.ufid ?? null) : null;
  const error = isCurrent ? (result?.error ?? null) : null;
  const onboarding: OnboardingStatus = !userId
    ? 'complete'
    : onboarded?.userId !== userId
      ? 'loading'
      : onboarded.complete
        ? 'complete'
        : 'required';
  const isLoading = !!userId && !isCurrent;

  useEffect(() => {
    let active = true;
    if (!userId) return;
    Promise.all([getProfile(userId), getUfid(userId)])
      .then(([profile, ufid]) => {
        if (!active) return;
        setResult({ userId, revision, profile, ufid: ufid ?? null, error: null });
        setOnboarded({ userId, complete: Boolean(ufid) });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResult({
          userId,
          revision,
          profile: null,
          ufid: null,
          error: getProfileError(cause, 'Could not load your profile.'),
        });
        // A failed load must not lock the member out of the app; onboarding is
        // re-evaluated on the next successful load.
        setOnboarded((current) =>
          current?.userId === userId ? current : { userId, complete: true },
        );
      });
    return () => {
      active = false;
    };
  }, [userId, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const save = useCallback(
    async ({ ufid: nextUfid, ...changes }: ProfileEdits) => {
      if (!userId) throw new Error('Please sign in to edit your profile.');
      // The UFID goes first: it is the write that can be rejected (already in use).
      const savedUfid = nextUfid === undefined ? undefined : await saveUfid(userId, nextUfid);
      const saved = Object.keys(changes).length ? await updateProfile(userId, changes) : null;
      setResult((current) =>
        current?.userId === userId && current.revision === revision && current.profile
          ? {
              ...current,
              profile: { ...current.profile, ...saved },
              ufid: savedUfid ?? current.ufid,
            }
          : current,
      );
      if (savedUfid) setOnboarded({ userId, complete: true });
    },
    [userId, revision],
  );
  const value = useMemo(
    () => ({ profile, ufid, onboarding, isLoading, error, reload, save }),
    [profile, ufid, onboarding, isLoading, error, reload, save],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

const defaultProfileContext: ProfileContextValue = {
  profile: null,
  ufid: null,
  onboarding: 'complete',
  isLoading: false,
  error: null,
  reload: () => {},
  save: async () => {},
};

export function useProfile() {
  const context = useContext(ProfileContext);
  return context ?? defaultProfileContext;
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

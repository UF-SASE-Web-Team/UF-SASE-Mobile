import { useState } from 'react';
import type { ProfileDraft } from '@/components/profile/ProfileForm';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { UFID_LENGTH, isValidUfid } from '@/lib/ufid';
import { saveUfid, updateProfile } from '@/services/profiles';
import type { ProfileEdits, ProfileWithPrograms } from '@/types/profiles';

export interface UseOnboardingProps {
  profile: ProfileWithPrograms;
  ufid: string | null;
}

export function useOnboarding({ profile, ufid }: UseOnboardingProps) {
  const [step, setStep] = useState<'required' | 'personalize'>('required');
  const [draft, setDraft] = useState<ProfileDraft>(() => ({
    full_name: profile.full_name,
    majors: profile.majors,
    minors: profile.minors,
    grad_time: profile.grad_time ?? '',
    discord_handle: profile.discord_handle ?? '',
    instagram_handle: profile.instagram_handle ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    bio: profile.bio ?? '',
    avatar_url: profile.avatar_url ?? '',
    ufid: ufid ?? '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<'continue' | 'finish' | 'skip' | 'logout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { save } = useProfile();

  const fullName = draft.full_name.trim();
  const nameError = submitted && !fullName ? 'Please enter your full name.' : undefined;
  const ufidError =
    submitted && !isValidUfid(draft.ufid) ? `Your UFID is ${UFID_LENGTH} digits.` : undefined;

  const change = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  // Submitting the UFID is enough to be onboarded: the required details are
  // persisted here, so quitting during the optional step loses nothing. Finish
  // and Skip only decide what happens to the optional details. The UFID goes
  // first because it is the write that can be rejected (already in use).
  const continueToPersonalize = async () => {
    setSubmitted(true);
    if (!fullName || !isValidUfid(draft.ufid) || !user) return;
    setBusy('continue');
    setError(null);
    try {
      await saveUfid(user.id, draft.ufid);
      await updateProfile(user.id, { full_name: fullName });
      setStep('personalize');
    } catch (cause) {
      setError(getProfileError(cause, 'Could not save your details. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const finish = async (mode: 'finish' | 'skip') => {
    if (mode === 'finish' && draft.linkedin_url.trim()) {
      try {
        const url = new URL(draft.linkedin_url.trim());
        if (
          url.protocol !== 'https:' ||
          !(url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'))
        )
          throw new Error();
      } catch {
        setError('Enter a valid LinkedIn URL beginning with https://.');
        return;
      }
    }
    setBusy(mode);
    setError(null);
    const { ufid: draftUfid, full_name: _fullName, ...optional } = draft;
    const changes: ProfileEdits = {
      ...(mode === 'finish'
        ? Object.fromEntries(
            Object.entries(optional).map(([key, value]) => [
              key,
              typeof value === 'string' ? value.trim() || null : value,
            ]),
          )
        : {}),
      full_name: fullName,
      ufid: draftUfid,
    };
    try {
      // Completing the save marks onboarding done, which swaps this screen for the app.
      await save(changes);
    } catch (cause) {
      setError(getProfileError(cause, 'Could not save your profile. Please try again.'));
      setBusy(null);
    }
  };

  const logOut = async () => {
    setBusy('logout');
    try {
      await signOut();
    } catch (cause) {
      setError(getProfileError(cause, 'Could not log out. Please try again.'));
      setBusy(null);
    }
  };

  return {
    step,
    setStep,
    draft,
    change,
    busy,
    error,
    nameError,
    ufidError,
    avatarPickerOpen,
    setAvatarPickerOpen,
    continueToPersonalize,
    finish,
    logOut,
  };
}

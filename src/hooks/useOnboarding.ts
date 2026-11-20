import { useState } from 'react';
import type { ProfileDraft } from '@/components/profile/ProfileForm';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { UFID_LENGTH, isValidUfid } from '@/lib/ufid';
import {
  INVALID_UF_EMAIL_MESSAGE,
  isValidUfEmail,
  normalizeUfEmail,
  ufEmailFromLogin,
} from '@/lib/ufEmail';
import { INVALID_GRAD_YEAR_MESSAGE, isValidGradYear } from '@/lib/gradYear';
import { normalizeLinkedInUrl } from '@/lib/linkedin';
import { saveUfEmail, saveUfid, updateProfile } from '@/services/profiles';
import type { ProfileEdits, ProfileWithPrograms } from '@/types/profiles';

export interface UseOnboardingProps {
  profile: ProfileWithPrograms;
  ufid: string | null;
}

export function useOnboarding({ profile, ufid }: UseOnboardingProps) {
  const { user, signOut } = useAuth();
  const { save } = useProfile();
  const [step, setStep] = useState<'required' | 'personalize'>('required');
  const [draft, setDraft] = useState<ProfileDraft>(() => ({
    full_name: profile.full_name,
    pronouns: profile.pronouns ?? '',
    majors: profile.majors,
    minors: profile.minors,
    grad_time: profile.grad_time ?? '',
    discord_handle: profile.discord_handle ?? '',
    instagram_handle: profile.instagram_handle ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    bio: profile.bio ?? '',
    avatar_url: profile.avatar_url ?? '',
    ufid: ufid ?? '',
    // Optional; prefilled when the member signed up with their UF address.
    uf_email: ufEmailFromLogin(user?.email),
    // Private and optional; set later in profile editing.
    gender: '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<'continue' | 'finish' | 'skip' | 'logout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const fullName = draft.full_name.trim();
  const nameError = submitted && !fullName ? 'Please enter your full name.' : undefined;
  const ufidError =
    submitted && !isValidUfid(draft.ufid) ? `Your UFID is ${UFID_LENGTH} digits.` : undefined;
  const ufEmailError =
    submitted && draft.uf_email.trim() && !isValidUfEmail(draft.uf_email)
      ? INVALID_UF_EMAIL_MESSAGE
      : undefined;

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
    const ufEmail = normalizeUfEmail(draft.uf_email);
    if (ufEmail && !isValidUfEmail(ufEmail)) return;
    setBusy('continue');
    setError(null);
    try {
      await saveUfid(user.id, draft.ufid);
      if (ufEmail) await saveUfEmail(user.id, ufEmail);
      await updateProfile(user.id, { full_name: fullName });
      setStep('personalize');
    } catch (cause) {
      setError(getProfileError(cause, 'Could not save your details. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const finish = async (mode: 'finish' | 'skip') => {
    let normalizedLinkedIn: string | null = null;
    if (mode === 'finish' && draft.linkedin_url.trim()) {
      normalizedLinkedIn = normalizeLinkedInUrl(draft.linkedin_url);
      if (!normalizedLinkedIn) {
        setError('Enter a valid LinkedIn URL or username.');
        return;
      }
    }
    if (mode === 'finish' && draft.grad_time.trim()) {
      if (!isValidGradYear(draft.grad_time)) {
        setError(INVALID_GRAD_YEAR_MESSAGE);
        return;
      }
    }
    setBusy(mode);
    setError(null);
    const {
      ufid: draftUfid,
      uf_email: _ufEmail,
      gender: _gender,
      full_name: _fullName,
      ...optional
    } = draft;
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
    if (mode === 'finish' && draft.linkedin_url.trim()) {
      changes.linkedin_url = normalizedLinkedIn;
    }
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
    ufEmailError,
    avatarPickerOpen,
    setAvatarPickerOpen,
    continueToPersonalize,
    finish,
    logOut,
  };
}

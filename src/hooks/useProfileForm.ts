import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import type { ProfileDraft } from '@/components/profile/ProfileForm';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { isValidUfid } from '@/lib/ufid';
import type { ProfileEdits, ProfileWithPrograms } from '@/types/profiles';

export interface UseProfileFormProps {
  profile: ProfileWithPrograms;
  ufid: string | null;
}

export function createDraft(profile: ProfileWithPrograms, ufid: string | null): ProfileDraft {
  return {
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
  };
}

export function useProfileForm({ profile, ufid }: UseProfileFormProps) {
  const [initialDraft] = useState(() => createDraft(profile, ufid));
  const [draft, setDraft] = useState(initialDraft);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { save } = useProfile();
  const router = useRouter();
  const navigation = useNavigation();
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  usePreventRemove((isDirty || saving) && !saved, ({ data }) => {
    if (saving) return;
    Alert.alert('Discard changes?', 'Your profile changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // Navigate after the unsaved-changes guard has observed the successful save.
  useEffect(() => {
    if (saved) {
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    }
  }, [saved, router]);

  const change = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const saveChanges = async () => {
    if (saving) return;
    if (!draft.full_name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isValidUfid(draft.ufid)) {
      setError('Enter your 8-digit UFID.');
      return;
    }
    if (draft.linkedin_url.trim()) {
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
    setSaving(true);
    setError(null);
    const { ufid: draftUfid, ...fields } = draft;
    const changes: ProfileEdits = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() || null : value,
      ]),
    );
    changes.full_name = draft.full_name.trim();
    if (draftUfid !== initialDraft.ufid) changes.ufid = draftUfid;
    try {
      await save(changes);
      setSaved(true);
    } catch (cause) {
      setError(getProfileError(cause, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (!saving) {
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    }
  };

  return {
    draft,
    change,
    avatarPickerOpen,
    setAvatarPickerOpen,
    saving,
    error,
    saveChanges,
    goBack,
  };
}

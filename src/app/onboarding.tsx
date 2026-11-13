import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileForm, type ProfileDraft } from '@/components/profile/ProfileForm';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { UFID_LENGTH, isValidUfid, sanitizeUfid } from '@/lib/ufid';
import { saveUfid, updateProfile } from '@/services/profiles';
import type { ProfileEdits, ProfileWithPrograms } from '@/types/profiles';
import { useTheme, useThemedStyles, type Colors, space } from '@/theme';

export default function OnboardingPage() {
  const { profile, ufid } = useProfile();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Shown while the profile loads, before we know onboarding is needed.
  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator
          accessibilityLabel="Loading profile"
          color={colors.surface.saseBlue.primary}
        />
      </SafeAreaView>
    );
  }
  return <Onboarding key={profile.id} profile={profile} ufid={ufid} />;
}

function Onboarding({ profile, ufid }: { profile: ProfileWithPrograms; ufid: string | null }) {
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
  const styles = useThemedStyles(createStyles);

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

  if (step === 'personalize') {
    return (
      <ProfileScreen
        onBack={busy ? () => {} : () => setStep('required')}
        // Closing is the same as skipping: the required details are already saved.
        onClose={busy ? () => {} : () => finish('skip')}
        footer={
          <View style={styles.footer}>
            {error && (
              <Text variant="bodySm" accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <ProfileButton
              title={busy === 'finish' ? 'Saving...' : 'Finish'}
              onPress={() => finish('finish')}
              loading={busy === 'finish'}
              disabled={!!busy}
            />
            <ProfileButton
              title="Skip for now"
              onPress={() => finish('skip')}
              variant="ghost"
              loading={busy === 'skip'}
              disabled={!!busy}
            />
          </View>
        }
      >
        <View style={styles.intro}>
          <Text variant="title">Make it yours</Text>
          <Text variant="body" style={styles.subtitle}>
            All of this is optional, and you can change it anytime from your profile.
          </Text>
        </View>
        <ProfileHero
          profile={{ ...profile, avatar_url: draft.avatar_url || null }}
          onEditAvatar={busy ? undefined : () => setAvatarPickerOpen(true)}
        />
        <ProfileForm draft={draft} onChange={change} disabled={!!busy} variant="optional" />
        <AvatarPicker
          visible={avatarPickerOpen}
          selected={draft.avatar_url || null}
          onSelect={(value) => change('avatar_url', value)}
          onClose={() => setAvatarPickerOpen(false)}
        />
      </ProfileScreen>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Text variant="display">Welcome to UF SASE</Text>
            <Text variant="body" style={styles.subtitle}>
              Just two things before you jump in.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              accessibilityLabel="Full name"
              placeholder="Full name"
              value={draft.full_name}
              onChangeText={(text) => change('full_name', text)}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              maxLength={100}
              editable={!busy}
              icon="person-outline"
              error={nameError}
            />
            <View style={styles.fieldGroup}>
              <Input
                accessibilityLabel="UFID"
                placeholder={`UFID (${UFID_LENGTH} digits)`}
                value={draft.ufid}
                onChangeText={(text) => change('ufid', sanitizeUfid(text))}
                keyboardType="number-pad"
                maxLength={UFID_LENGTH}
                editable={!busy}
                icon="card-outline"
                error={ufidError}
              />
              <Text variant="bodySm" style={styles.hint}>
                Your UFID stays private. Other members never see it.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {error && (
              <Text variant="bodySm" accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <Button
              variant="primary"
              onPress={continueToPersonalize}
              loading={busy === 'continue'}
              disabled={!!busy}
              accessibilityLabel="Continue"
            >
              Continue
            </Button>
            <ProfileButton
              title="Log Out"
              onPress={logOut}
              variant="ghost"
              loading={busy === 'logout'}
              disabled={!!busy}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface.base.primary },
    centered: { alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: space['600'],
      paddingVertical: space['600'],
      gap: space['600'],
    },
    intro: { gap: space['200'], paddingBottom: space['400'] },
    subtitle: { color: colors.content.onBase.secondary },
    form: { gap: space['400'] },
    fieldGroup: { gap: space['150'] },
    hint: { color: colors.content.onBase.secondary, paddingHorizontal: space['400'] },
    actions: { gap: space['300'] },
    footer: { gap: space['200'] },
    error: { color: colors.surface.danger.primary },
  });

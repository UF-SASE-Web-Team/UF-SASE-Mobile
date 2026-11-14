import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/context/ProfileContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { sanitizeUfid, UFID_LENGTH } from '@/lib/ufid';
import { type Colors, space, useTheme, useThemedStyles } from '@/theme';
import type { ProfileWithPrograms } from '@/types/profiles';

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
  const {
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
  } = useOnboarding({ profile, ufid });
  const styles = useThemedStyles(createStyles);

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

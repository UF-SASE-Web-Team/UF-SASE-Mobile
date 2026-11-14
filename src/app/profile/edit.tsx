import { StyleSheet, View } from 'react-native';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileLoadingState, ProfileScreen } from '@/components/profile/ProfileScreen';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/context/ProfileContext';
import { useProfileForm } from '@/hooks/useProfileForm';
import { type Colors, space, useThemedStyles } from '@/theme';
import type { ProfileWithPrograms } from '@/types/profiles';

export default function EditProfilePage() {
  const { profile, ufid } = useProfile();
  if (!profile) return <ProfileLoadingState />;
  return <ProfileEditor key={profile.id} profile={profile} ufid={ufid} />;
}

function ProfileEditor({ profile, ufid }: { profile: ProfileWithPrograms; ufid: string | null }) {
  const {
    draft,
    change,
    avatarPickerOpen,
    setAvatarPickerOpen,
    saving,
    error,
    saveChanges,
    goBack,
  } = useProfileForm({ profile, ufid });
  const styles = useThemedStyles(createStyles);

  return (
    <ProfileScreen
      onBack={goBack}
      backLabel="Cancel editing"
      footer={
        <View style={styles.footer}>
          {error && (
            <Text variant="bodySm" accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <ProfileButton
            title={saving ? 'Saving Changes...' : 'Save Changes'}
            onPress={saveChanges}
            loading={saving}
          />
        </View>
      }
    >
      <ProfileHero
        profile={{ ...profile, avatar_url: draft.avatar_url || null }}
        onEditAvatar={saving ? undefined : () => setAvatarPickerOpen(true)}
      />
      <ProfileForm draft={draft} onChange={change} disabled={saving} />
      <AvatarPicker
        visible={avatarPickerOpen}
        selected={draft.avatar_url || null}
        onSelect={(value) => change('avatar_url', value)}
        onClose={() => setAvatarPickerOpen(false)}
      />
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    footer: {
      gap: space['200'],
    },
    error: { color: colors.surface.danger.primary },
  });

import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { Button } from '@/components/ui/Button';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileHero } from '@/components/profile/ProfileHero';
import {
  ProfileLoadingState,
  ProfileModalSlot,
  ProfileScreen,
} from '@/components/profile/ProfileScreen';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/context/ProfileContext';
import { useProfileForm } from '@/hooks/useProfileForm';
import { type Colors, borderWidth, radius, space, useThemedStyles } from '@/theme';
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
  const scrollViewRef = useRef<ScrollView>(null);

  const handleBioFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 240, animated: true });
    }, 120);
  }, []);

  return (
    <ProfileScreen
      scrollViewRef={scrollViewRef}
      onBack={goBack}
      backLabel="Cancel editing"
      title="Edit Profile"
      headerRight={
        <Button
          size="sm"
          variant="primary"
          accessibilityLabel="Save Changes"
          onPress={saveChanges}
          loading={saving}
          disabled={saving}
        >
          Save
        </Button>
      }
    >
      {error && (
        <View style={styles.errorBanner}>
          <Text variant="bodySmStrong" accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}
      <ProfileHero
        profile={{ ...profile, avatar_url: draft.avatar_url || null }}
        onEditAvatar={() => setAvatarPickerOpen(true)}
        disabledAvatar={saving}
      />
      <ProfileForm draft={draft} onChange={change} disabled={saving} onBioFocus={handleBioFocus} />
      <ProfileModalSlot>
        <AvatarPicker
          visible={avatarPickerOpen}
          selected={draft.avatar_url || null}
          onSelect={(value) => change('avatar_url', value)}
          onClose={() => setAvatarPickerOpen(false)}
        />
      </ProfileModalSlot>
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
      backgroundColor: colors.surface.base.secondary,
      borderColor: colors.border.danger.primary,
      borderWidth: borderWidth.sm,
      borderRadius: radius.md,
      paddingHorizontal: space['400'],
      paddingVertical: space['250'],
      marginBottom: space['300'],
    },
    errorText: {
      color: colors.border.danger.primary,
      flex: 1,
    },
  });

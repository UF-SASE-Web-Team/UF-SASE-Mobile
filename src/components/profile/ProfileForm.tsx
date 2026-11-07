import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { academicFields, socialFields, ProfileCard } from './ProfileDetails';
import { ProfileSelect } from './ProfileSelect';
import {
  useTheme,
  useThemedStyles,
  type Colors,
  iconSize,
  profileLayout,
  radius,
  space,
  textStyles,
} from '@/theme';
import type { ProfileChanges } from '@/types/profiles';

export type ProfileDraft = { [K in keyof Required<ProfileChanges>]: string };

const subjects = [
  'Computer Science',
  'Digital Arts and Sciences',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Computer Engineering',
  'Biomedical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Industrial and Systems Engineering',
  'Aerospace Engineering',
  'Biology',
  'Chemistry',
  'Mathematics',
  'Psychology',
  'Business Administration',
] as const;
const graduationYears = Array.from({ length: 17 }, (_, index) =>
  String(new Date().getFullYear() - 6 + index),
);

interface ProfileFormProps {
  draft: ProfileDraft;
  onChange: (key: keyof ProfileDraft, value: string) => void;
  disabled: boolean;
}

export function ProfileForm({ draft, onChange, disabled }: ProfileFormProps) {
  const [selection, setSelection] = useState<'major' | 'minor' | 'grad_time' | null>(null);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const renderRow = (field: (typeof academicFields)[number] | (typeof socialFields)[number]) => {
    const isSelect = field.key === 'major' || field.key === 'minor' || field.key === 'grad_time';
    return (
      <View
        key={field.key}
        style={[
          styles.row,
          (field.key === 'discord_handle' ||
            field.key === 'instagram_handle' ||
            field.key === 'linkedin_url') &&
            styles.socialRow,
        ]}
      >
        <Text variant="body" style={styles.label}>
          {field.label}:
        </Text>
        {isSelect ? (
          <Pressable
            accessibilityLabel={field.label}
            accessibilityRole="button"
            accessibilityValue={{ text: draft[field.key] || 'Not set' }}
            disabled={disabled}
            hitSlop={space['150']}
            onPress={() => setSelection(field.key as 'major' | 'minor' | 'grad_time')}
            style={styles.select}
          >
            <Text variant="body" style={styles.selectText}>
              {draft[field.key] || 'Not set'}
            </Text>
            <Ionicons name="chevron-down" size={iconSize.sm} color={colors.content.onBase.brand} />
          </Pressable>
        ) : (
          <View style={styles.inputContainer}>
            <Input
              accessibilityLabel={field.label}
              value={draft[field.key]}
              onChangeText={(text) => onChange(field.key, text)}
              editable={!disabled}
              maxLength={field.key === 'linkedin_url' ? 300 : 100}
              autoCapitalize={field.key === 'full_name' ? 'words' : 'none'}
              autoCorrect={field.key === 'full_name'}
              keyboardType={field.key === 'linkedin_url' ? 'url' : 'default'}
              placeholder={field.key === 'full_name' ? 'Your name' : 'Not set'}
              style={styles.input}
            />
            <Image
              source={require('@/assets/icons/profile/pencil-small.svg')}
              style={styles.pencil}
              contentFit="contain"
              tintColor={colors.content.onBase.primary}
              accessible={false}
              pointerEvents="none"
            />
          </View>
        )}
      </View>
    );
  };
  return (
    <View style={styles.form}>
      <ProfileCard editing>{academicFields.map(renderRow)}</ProfileCard>
      <ProfileCard editing>{socialFields.map(renderRow)}</ProfileCard>
      <ProfileCard editing>
        <Input
          accessibilityLabel="Bio"
          placeholder="Tell us a little about yourself..."
          value={draft.bio}
          onChangeText={(text) => onChange('bio', text)}
          multiline
          maxLength={500}
          editable={!disabled}
          textAlignVertical="top"
          style={styles.bio}
        />
      </ProfileCard>
      {selection && (
        <ProfileSelect
          key={selection}
          visible
          label={
            selection === 'grad_time' ? 'Grad Year' : selection === 'major' ? 'Major' : 'Minor'
          }
          value={draft[selection]}
          options={selection === 'grad_time' ? graduationYears : subjects}
          onClose={() => setSelection(null)}
          onSelect={(value) => onChange(selection, value)}
        />
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    form: { gap: space['200'] },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: profileLayout.academicRowHeight,
      gap: space['100'],
    },
    socialRow: { minHeight: profileLayout.socialRowHeight },
    label: { width: '26%', color: colors.content.onBase.brand, lineHeight: space['500'] },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      paddingRight: space['200'],
    },
    input: {
      ...textStyles.body,
      color: colors.content.onBase.brand,
      flex: 1,
      minWidth: 0,
      minHeight: profileLayout.fieldHeight,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      lineHeight: space['500'],
    },
    pencil: { width: iconSize.sm, height: iconSize.sm },
    select: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      minHeight: profileLayout.fieldHeight,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      gap: space['100'],
    },
    selectText: { color: colors.content.onBase.brand, flex: 1, lineHeight: space['500'] },
    bio: {
      ...textStyles.body,
      color: colors.content.onBase.brand,
      lineHeight: space['500'],
      minHeight: profileLayout.bioHeight - space['500'],
      padding: 0,
      paddingTop: space['100'],
    },
  });

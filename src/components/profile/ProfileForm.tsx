import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { academicFields, socialFields, ProfileCard } from './ProfileDetails';
import { ProfileSelect } from './ProfileSelect';
import {
  useTheme,
  useThemedStyles,
  type Colors,
  iconSize,
  radius,
  space,
  textStyles,
  borderWidth,
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
            accessibilityValue={{ text: draft[field.key] }}
            disabled={disabled}
            hitSlop={space['150']}
            onPress={() => setSelection(field.key as 'major' | 'minor' | 'grad_time')}
            style={styles.select}
          >
            <Text variant="body" style={styles.selectText}>
              {draft[field.key]}
            </Text>
            <Ionicons
              name="chevron-down"
              size={iconSize.sm}
              color={colors.content.onBase.primary}
            />
          </Pressable>
        ) : (
          <View style={styles.inputWrapper}>
            <Input
              accessibilityLabel={field.label}
              value={draft[field.key]}
              onChangeText={(text) => onChange(field.key, text)}
              editable={!disabled}
              maxLength={field.key === 'linkedin_url' ? 300 : 100}
              autoCapitalize={field.key === 'full_name' ? 'words' : 'none'}
              autoCorrect={field.key === 'full_name'}
              keyboardType={field.key === 'linkedin_url' ? 'url' : 'default'}
              placeholder={field.key === 'full_name' ? 'Full name' : undefined}
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              rightIcon={
                !disabled && Boolean(draft[field.key]?.length) ? (
                  <Pressable
                    onPress={() => onChange(field.key, '')}
                    hitSlop={space['200']}
                    accessibilityLabel={`Clear ${field.label.toLowerCase()}`}
                    accessibilityRole="button"
                    style={styles.clearButton}
                  >
                    <Ionicons
                      name="close-outline"
                      size={iconSize.md}
                      color={colors.content.onBase.secondary}
                    />
                  </Pressable>
                ) : null
              }
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
          containerStyle={styles.bioContainer}
          inputStyle={styles.bio}
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
      minHeight: 42,
      gap: space['100'],
    },
    socialRow: { minHeight: 38 },
    label: { width: '26%', color: colors.content.onBase.primary, lineHeight: space['500'] },
    inputWrapper: {
      flex: 1,
    },
    clearButton: {
      height: space['500'],
      width: space['500'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputContainer: {
      borderColor: colors.border.base.subtle,
      borderWidth: borderWidth.lg,
    },
    input: {},
    select: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      minHeight: 32,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      gap: space['100'],
    },
    selectText: { color: colors.content.onBase.primary, flex: 1, lineHeight: space['500'] },
    bioContainer: {},
    bio: {
      ...textStyles.body,
      color: colors.content.onBase.primary,
      lineHeight: space['500'],
      minHeight: 100,
      padding: 0,
      paddingTop: space['100'],
    },
  });

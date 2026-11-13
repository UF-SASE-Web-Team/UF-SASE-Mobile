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
import { UFID_LENGTH, sanitizeUfid } from '@/lib/ufid';
import type { ProfileChanges } from '@/types/profiles';

type ListKey = 'majors' | 'minors';
type SelectKey = ListKey | 'grad_time';

export type ProfileDraft = {
  [K in Exclude<keyof Required<ProfileChanges>, ListKey>]: string;
} & Record<ListKey, string[]> & { ufid: string };

/** Mirrors the `profiles_majors_limit` and `profiles_minors_limit` constraints. */
const MAX_SUBJECTS = 3;

// Private fields are editable here but deliberately absent from `ProfileDetails`,
// so they never appear on a profile.
const privateFields = [{ key: 'ufid', label: 'UFID', icon: 'card-outline' }] as const;

type ProfileField =
  (typeof academicFields)[number] | (typeof socialFields)[number] | (typeof privateFields)[number];

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
  onChange: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  disabled: boolean;
  /** `optional` leaves out the required fields (full name and UFID). */
  variant?: 'full' | 'optional';
}

export function ProfileForm({ draft, onChange, disabled, variant = 'full' }: ProfileFormProps) {
  const [selection, setSelection] = useState<SelectKey | null>(null);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const renderRow = (field: ProfileField) => {
    const { key } = field;
    return (
      <View
        key={key}
        style={[
          styles.row,
          (key === 'discord_handle' || key === 'instagram_handle' || key === 'linkedin_url') &&
            styles.socialRow,
        ]}
      >
        <Ionicons
          name={field.icon}
          size={iconSize.sm}
          color={colors.content.onBase.secondary}
          style={styles.fieldIcon}
        />
        <Text variant="body" style={styles.label}>
          {field.label}:
        </Text>
        {key === 'majors' || key === 'minors' || key === 'grad_time' ? (
          <Pressable
            accessibilityLabel={field.label}
            accessibilityRole="button"
            accessibilityValue={{ text: [draft[key]].flat().join(', ') }}
            disabled={disabled}
            hitSlop={space['150']}
            onPress={() => setSelection(key)}
            style={styles.select}
          >
            <Text variant="body" style={styles.selectText}>
              {[draft[key]].flat().join(', ')}
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
              value={draft[key]}
              onChangeText={(text) => onChange(key, key === 'ufid' ? sanitizeUfid(text) : text)}
              editable={!disabled}
              maxLength={key === 'ufid' ? UFID_LENGTH : key === 'linkedin_url' ? 300 : 100}
              autoCapitalize={key === 'full_name' ? 'words' : 'none'}
              autoCorrect={key === 'full_name'}
              keyboardType={
                key === 'ufid' ? 'number-pad' : key === 'linkedin_url' ? 'url' : 'default'
              }
              placeholder={key === 'full_name' ? 'Full name' : undefined}
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              rightIcon={
                !disabled && Boolean(draft[key]?.length) ? (
                  <Pressable
                    onPress={() => onChange(key, '')}
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
      <ProfileCard editing>
        {academicFields
          .filter((field) => variant === 'full' || field.key !== 'full_name')
          .map(renderRow)}
      </ProfileCard>
      {variant === 'full' && (
        <ProfileCard editing>
          {privateFields.map(renderRow)}
          <Text variant="bodySm" style={styles.privateNote}>
            Only you can see your UFID.
          </Text>
        </ProfileCard>
      )}
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
            selection === 'grad_time' ? 'Grad Year' : selection === 'majors' ? 'Major' : 'Minor'
          }
          values={[draft[selection]].flat().filter(Boolean)}
          options={selection === 'grad_time' ? graduationYears : subjects}
          max={selection === 'grad_time' ? 1 : MAX_SUBJECTS}
          onClose={() => setSelection(null)}
          onChange={(values) =>
            selection === 'grad_time'
              ? onChange('grad_time', values[0] ?? '')
              : onChange(selection, values)
          }
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
    privateNote: { color: colors.content.onBase.secondary, paddingHorizontal: space['100'] },
    fieldIcon: { marginRight: space['150'] },
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

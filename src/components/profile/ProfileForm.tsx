import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { academicFields, socialFields, ProfileCard } from './ProfileDetails';
import { ProfileModalSlot } from './ProfileScreen';
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
import { INVALID_GRAD_YEAR_MESSAGE, isValidGradYear, sanitizeGradYear } from '@/lib/gradYear';
import type { ProfileChanges } from '@/types/profiles';

type ListKey = 'majors' | 'minors';
type SelectKey = ListKey;

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
  'Aerospace Engineering',
  'Agricultural and Biological Engineering',
  'Animal Sciences',
  'Biology',
  'Biomedical Engineering',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Computer Engineering',
  'Computer Science',
  'Digital Arts and Sciences',
  'Electrical Engineering',
  'Food Science',
  'Health Science',
  'Industrial and Systems Engineering',
  'Marine Sciences',
  'Materials Science and Engineering',
  'Mathematics',
  'Mechanical Engineering',
  'Psychology',
] as const;

interface ProfileFormProps {
  draft: ProfileDraft;
  onChange: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  disabled: boolean;
  /** `optional` leaves out the required fields (full name and UFID). */
  variant?: 'full' | 'optional';
  onBioFocus?: () => void;
}

export function ProfileForm({
  draft,
  onChange,
  disabled,
  variant = 'full',
  onBioFocus,
}: ProfileFormProps) {
  const [selection, setSelection] = useState<SelectKey | null>(null);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const renderField = (field: ProfileField) => {
    const { key } = field;
    const isSelect = key === 'majors' || key === 'minors';
    const selectValues = [draft[key]].flat().filter(Boolean);
    const selectDisplayText = selectValues.join(', ');

    return (
      <View key={key} style={styles.fieldItem}>
        <View style={styles.fieldHeader}>
          <Ionicons name={field.icon} size={iconSize.sm} color={colors.content.onBase.secondary} />
          <Text variant="bodyStrong" style={styles.fieldLabel}>
            {field.label}
          </Text>
        </View>

        {isSelect ? (
          <Pressable
            accessibilityLabel={field.label}
            accessibilityRole="button"
            accessibilityValue={{ text: [draft[key]].flat().join(', ') }}
            disabled={disabled}
            hitSlop={space['100']}
            onPress={() => setSelection(key)}
            style={({ pressed }) => [
              styles.selectContainer,
              pressed && !disabled && styles.selectPressed,
            ]}
          >
            <Text
              variant="body"
              style={[styles.selectText, !selectDisplayText && styles.placeholderText]}
              numberOfLines={1}
            >
              {selectDisplayText ||
                (key === 'majors' ? 'Tap to select major(s)' : 'Tap to select minor(s)')}
            </Text>
            <Ionicons
              name="chevron-down"
              size={iconSize.sm}
              color={colors.content.onBase.secondary}
            />
          </Pressable>
        ) : (
          <Input
            accessibilityLabel={field.label}
            value={draft[key]}
            onChangeText={(text) =>
              onChange(
                key,
                key === 'ufid'
                  ? sanitizeUfid(text)
                  : key === 'grad_time'
                    ? sanitizeGradYear(text)
                    : text,
              )
            }
            editable={!disabled}
            maxLength={
              key === 'ufid'
                ? UFID_LENGTH
                : key === 'grad_time'
                  ? 4
                  : key === 'linkedin_url'
                    ? 300
                    : 100
            }
            autoCapitalize={key === 'full_name' ? 'words' : 'none'}
            autoCorrect={key === 'full_name'}
            keyboardType={
              key === 'ufid' || key === 'grad_time'
                ? 'number-pad'
                : key === 'linkedin_url'
                  ? 'url'
                  : 'default'
            }
            placeholder={
              key === 'full_name'
                ? 'Full name'
                : key === 'ufid'
                  ? `${UFID_LENGTH}-digit UFID`
                  : key === 'grad_time'
                    ? 'e.g. 2028'
                    : key === 'discord_handle'
                      ? 'Discord handle'
                      : key === 'instagram_handle'
                        ? 'Instagram handle'
                        : key === 'linkedin_url'
                          ? 'linkedin.com/in/username'
                          : undefined
            }
            error={
              key === 'grad_time' &&
              draft.grad_time.trim().length === 4 &&
              !isValidGradYear(draft.grad_time)
                ? INVALID_GRAD_YEAR_MESSAGE
                : undefined
            }
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            rightIcon={
              Boolean(draft[key]?.length) ? (
                <Pressable
                  onPress={() => onChange(key, '')}
                  disabled={disabled}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={`Clear ${field.label.toLowerCase()}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled }}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && !disabled && styles.iconButtonPressed,
                  ]}
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
        )}
      </View>
    );
  };

  return (
    <View style={styles.form}>
      <ProfileCard editing style={styles.card}>
        {academicFields
          .filter((field) => variant === 'full' || field.key !== 'full_name')
          .map(renderField)}
      </ProfileCard>
      <ProfileCard editing style={styles.card}>
        <View style={styles.fieldItem}>
          <View style={styles.fieldHeader}>
            <Ionicons
              name="create-outline"
              size={iconSize.sm}
              color={colors.content.onBase.secondary}
            />
            <Text variant="bodyStrong" style={styles.fieldLabel}>
              About Me
            </Text>
          </View>
          <Input
            accessibilityLabel="Bio"
            placeholder="Tell us a little about yourself, your interests, or what you're working on..."
            value={draft.bio}
            onChangeText={(text) => onChange('bio', text)}
            multiline
            maxLength={300}
            editable={!disabled}
            scrollEnabled={false}
            containerStyle={styles.bioContainer}
            inputStyle={styles.bioInput}
            onFocus={onBioFocus}
          />
          <View style={styles.bioFooter}>
            <Text variant="bodySm" style={styles.charCount}>
              {(draft.bio || '').length}/300
            </Text>
          </View>
        </View>
      </ProfileCard>
      <ProfileCard editing style={styles.card}>
        {socialFields.map(renderField)}
      </ProfileCard>
      {variant === 'full' && (
        <ProfileCard editing style={styles.card}>
          {privateFields.map(renderField)}
        </ProfileCard>
      )}
      {selection && (
        <ProfileModalSlot>
          <ProfileSelect
            key={selection}
            visible
            label={selection === 'majors' ? 'Major' : 'Minor'}
            values={draft[selection]}
            options={subjects}
            max={MAX_SUBJECTS}
            onClose={() => setSelection(null)}
            onChange={(values) => onChange(selection, values)}
          />
        </ProfileModalSlot>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    form: { gap: space['300'] },
    card: {
      padding: space['400'],
      // borderColor: colors.border.base.subtle,
      // borderWidth: borderWidth.sm,
      gap: space['400'],
    },
    fieldItem: {
      gap: space['150'],
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['150'],
      paddingHorizontal: space['050'],
    },
    fieldLabel: {
      color: colors.content.onBase.primary,
    },
    inputContainer: {
      backgroundColor: colors.surface.base.primary,
      borderColor: colors.border.base.subtle,
      borderWidth: borderWidth.sm,
      borderRadius: radius.full,
      minHeight: 52,
      paddingLeft: space['600'],
      paddingVertical: space['150'],
    },
    input: {
      color: colors.content.onBase.primary,
    },
    iconButton: {
      paddingHorizontal: space['100'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonPressed: {
      opacity: 0.6,
    },
    selectContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface.base.primary,
      borderColor: colors.border.base.subtle,
      borderWidth: borderWidth.sm,
      borderRadius: radius.full,
      minHeight: 52,
      paddingHorizontal: space['600'],
      paddingVertical: space['200'],
      gap: space['200'],
    },
    selectText: {
      flex: 1,
      color: colors.content.onBase.primary,
    },
    placeholderText: {
      color: colors.content.onBase.secondary,
      opacity: 0.7,
    },
    selectPressed: {
      opacity: 0.7,
    },
    bioContainer: {
      backgroundColor: colors.surface.base.primary,
      borderColor: colors.border.base.subtle,
      borderWidth: borderWidth.sm,
      borderRadius: radius.md,
      minHeight: 120,
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['300'],
      alignItems: 'flex-start',
    },
    bioInput: {
      ...textStyles.body,
      color: colors.content.onBase.primary,
      lineHeight: space['600'],
      minHeight: 100,
      width: '100%',
      padding: 0,
    },
    bioFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: space['050'],
      marginTop: space['100'],
    },
    charCount: {
      color: colors.content.onBase.secondary,
    },
  });

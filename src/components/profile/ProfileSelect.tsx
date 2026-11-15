import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import {
  useTheme,
  useThemedStyles,
  type Colors,
  iconSize,
  radius,
  space,
  textStyles,
} from '@/theme';

interface ProfileSelectProps {
  label: string;
  values: string[];
  options: readonly string[];
  /** Above 1, options toggle on and off and the sheet stays open until dismissed. */
  max?: number;
  visible: boolean;
  onClose: () => void;
  onChange: (values: string[]) => void;
}

export function ProfileSelect({
  label,
  values,
  options,
  max = 1,
  visible,
  onClose,
  onChange,
}: ProfileSelectProps) {
  // `null` while the "Other" entry is collapsed.
  const [other, setOther] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const multiple = max > 1;
  const full = multiple && values.length >= max;
  const name = label.toLowerCase();
  // Selected values lead the list so entries typed under "Other" stay visible.
  const matches = [...new Set([...values, ...options])];

  const choose = (option: string) => {
    if (!multiple) {
      onChange(option ? [option] : []);
      onClose();
    } else if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
    } else if (!full) {
      onChange([...values, option]);
    }
  };
  const addOther = () => {
    const entry = other?.trim();
    if (!entry) return;
    // Reuse the listed spelling so "computer science" does not duplicate an option.
    const existing = [...values, ...options].find(
      (option) => option.toLowerCase() === entry.toLowerCase(),
    );
    setOther(null);
    if (!existing || !values.includes(existing)) choose(existing ?? entry);
  };

  return (
    <ModalSheet title={label} visible={visible} onClose={onClose}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={50}
        ListHeaderComponent={
          multiple ? (
            <View style={styles.header}>
              <Text variant="bodySm" style={styles.hint}>
                Select up to {max}.
              </Text>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => choose('')} style={styles.option}>
              <Text variant="body">Not set</Text>
            </Pressable>
          )
        }
        renderItem={({ item }) => {
          const checked = values.includes(item);
          const disabled = full && !checked;
          return (
            <Pressable
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityLabel={item}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => choose(item)}
              style={[styles.option, disabled && styles.disabled]}
            >
              <Text variant="body" style={styles.optionLabel}>
                {item}
              </Text>
              {checked && (
                <Ionicons
                  name="checkmark"
                  size={iconSize.md}
                  color={colors.content.onBase.primary}
                />
              )}
            </Pressable>
          );
        }}
        ListFooterComponent={
          other === null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Other"
              accessibilityState={{ disabled: full }}
              disabled={full}
              onPress={() => setOther('')}
              style={[styles.option, full && styles.disabled]}
            >
              <Text variant="body" style={styles.optionLabel}>
                Other
              </Text>
              <Ionicons name="add" size={iconSize.md} color={colors.content.onBase.primary} />
            </Pressable>
          ) : (
            <View style={styles.other}>
              <Input
                accessibilityLabel={`Enter your ${name}`}
                placeholder={`Enter your ${name}`}
                value={other}
                onChangeText={setOther}
                onSubmitEditing={addOther}
                returnKeyType="done"
                autoCapitalize="words"
                autoFocus
                maxLength={100}
                style={styles.input}
              />
              <Button size="md" onPress={addOther} variant="secondary" disabled={!other.trim()}>
                Add
              </Button>
            </View>
          )
        }
      />
      {multiple && (
        <View style={styles.done}>
          <Button size="md" onPress={onClose}>
            Done
          </Button>
        </View>
      )}
    </ModalSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { paddingBottom: space['200'] },
    hint: { color: colors.content.onBase.secondary, paddingHorizontal: space['300'] },
    input: {
      ...textStyles.body,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
      padding: space['300'],
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingHorizontal: space['300'],
      paddingVertical: space['200'],
      gap: space['200'],
    },
    optionLabel: { flex: 1 },
    disabled: { opacity: 0.5 },
    other: { gap: space['200'], paddingTop: space['200'] },
    done: { paddingTop: space['300'] },
  });

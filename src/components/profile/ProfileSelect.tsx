import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { ProfileButton } from './ProfileButton';
import { ProfileSheet } from './ProfileSheet';
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
  value: string;
  options: readonly string[];
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function ProfileSelect({
  label,
  value,
  options,
  visible,
  onClose,
  onSelect,
}: ProfileSelectProps) {
  const [search, setSearch] = useState('');
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const matches = [...new Set([value, ...options])].filter(
    (option) => option && option.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const select = (next: string) => {
    onSelect(next);
    onClose();
  };
  return (
    <ProfileSheet title={label} visible={visible} onClose={onClose}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.search}>
            <Input
              accessibilityLabel={`Search or enter ${label.toLowerCase()}`}
              placeholder={`Search or enter ${label.toLowerCase()}`}
              value={search}
              onChangeText={setSearch}
              maxLength={100}
              style={styles.input}
            />
            {search.trim() ? (
              <ProfileButton
                title={`Use ${search.trim()}`}
                onPress={() => select(search.trim())}
                variant="secondary"
              />
            ) : null}
            {label !== 'Major' && (
              <Pressable
                accessibilityRole="button"
                onPress={() => select('')}
                style={styles.option}
              >
                <Text variant="body">{label === 'Minor' ? 'No minor' : 'Not set'}</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={item}
            accessibilityState={{ checked: item === value }}
            onPress={() => select(item)}
            style={styles.option}
          >
            <Text variant="body" style={styles.optionLabel}>
              {item}
            </Text>
            {item === value && (
              <Ionicons name="checkmark" size={iconSize.md} color={colors.content.onBase.primary} />
            )}
          </Pressable>
        )}
      />
    </ProfileSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    search: { gap: space['200'] },
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
  });

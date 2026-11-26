import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { searchMembers } from '@/services/admin';
import { type Colors, borderWidth, iconSize, space } from '@/theme';
import type { MemberSearchResult } from '@/types/admin';

const SEARCH_DELAY_MS = 300;

interface AddAttendeeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Members already checked in, shown as such and not selectable. */
  checkedInIds: Set<string>;
  onAdd: (member: MemberSearchResult) => Promise<void>;
}

/** Search members by name or username and check one in by hand. */
export function AddAttendeeSheet({ visible, onClose, checkedInIds, onAdd }: AddAttendeeSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      searchMembers(query)
        .then((members) => {
          if (!active) return;
          setResults(members);
          setError(null);
        })
        .catch((cause) => {
          if (active) setError(getFriendlyErrorMessage(cause, 'Search failed.'));
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const add = async (member: MemberSearchResult) => {
    setAdding(member.id);
    setError(null);
    try {
      await onAdd(member);
      setQuery('');
      onClose();
    } catch (cause) {
      setError(getFriendlyErrorMessage(cause, `Could not check in ${member.fullName}.`));
    } finally {
      setAdding(null);
    }
  };

  return (
    <ModalSheet title="Add Attendee" visible={visible} onClose={onClose} busy={!!adding}>
      <View style={styles.search}>
        <Input
          accessibilityLabel="Search members"
          placeholder="Search by name or username"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          icon="search-outline"
          error={error ?? undefined}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(member) => member.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searching ? (
            <ActivityIndicator color={colors.surface.saseBlue.primary} />
          ) : (
            <Text variant="bodySm" color={colors.content.onBase.secondary} style={styles.hint}>
              {query.trim().length < 2 ? 'Type at least 2 letters.' : 'No members found.'}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const checkedIn = checkedInIds.has(item.id);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                checkedIn ? `${item.fullName}, already checked in` : `Check in ${item.fullName}`
              }
              accessibilityState={{ disabled: checkedIn || !!adding }}
              disabled={checkedIn || !!adding}
              onPress={() => add(item)}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <View style={styles.copy}>
                <Text variant="body" numberOfLines={1}>
                  {item.fullName}
                </Text>
                {item.username ? (
                  <Text variant="bodySm" color={colors.content.onBase.secondary}>
                    @{item.username}
                  </Text>
                ) : null}
              </View>
              {adding === item.id ? (
                <ActivityIndicator color={colors.surface.saseBlue.primary} />
              ) : (
                <Ionicons
                  name={checkedIn ? 'checkmark-circle' : 'add-circle-outline'}
                  size={iconSize.md}
                  color={
                    checkedIn ? colors.content.accent.secondary : colors.content.onBase.primary
                  }
                />
              )}
            </Pressable>
          );
        }}
      />
    </ModalSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    search: { paddingHorizontal: space['300'], paddingBottom: space['200'] },
    hint: { textAlign: 'center', padding: space['300'] },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: space['300'],
      paddingVertical: space['300'],
      borderBottomWidth: borderWidth.sm,
      borderBottomColor: colors.border.base.subtle,
    },
    pressed: { opacity: 0.7 },
    copy: { flex: 1 },
  });

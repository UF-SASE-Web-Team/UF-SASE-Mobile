import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';
import type { EventLinkDraft } from '@/types/admin';

interface EventLinksEditorProps {
  links: EventLinkDraft[];
  onChange: (links: EventLinkDraft[]) => void;
  errors: Partial<Record<string, string>>;
  disabled?: boolean;
}

/** An event's links (slides, forms, RSVP). One link can be the RSVP link. */
export function EventLinksEditor({ links, onChange, errors, disabled }: EventLinksEditorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const update = (index: number, changes: Partial<EventLinkDraft>) =>
    onChange(
      links.map((link, i) => {
        if (i === index) return { ...link, ...changes };
        // Only one RSVP link per event.
        return changes.isRsvp ? { ...link, isRsvp: false } : link;
      }),
    );

  return (
    <View style={styles.field}>
      <Text variant="bodyStrong">Links</Text>
      {links.map((link, index) => (
        <View key={link.id ?? `new-${index}`} style={styles.link}>
          <View style={styles.linkHeader}>
            <Text variant="bodySmStrong" style={styles.linkTitle}>
              Link {index + 1}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove link ${index + 1}`}
              disabled={disabled}
              hitSlop={space['100']}
              onPress={() => onChange(links.filter((_, i) => i !== index))}
            >
              <Ionicons
                name="trash-outline"
                size={iconSize.md}
                color={colors.content.onBase.secondary}
              />
            </Pressable>
          </View>
          <Input
            accessibilityLabel={`Link ${index + 1} title`}
            placeholder="Title (e.g. RSVP Form)"
            value={link.title}
            onChangeText={(title) => update(index, { title })}
            editable={!disabled}
            maxLength={60}
          />
          <Input
            accessibilityLabel={`Link ${index + 1} URL`}
            placeholder="https://"
            value={link.url}
            onChangeText={(url) => update(index, { url })}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={500}
            error={errors[`link${index}`]}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Use link ${index + 1} for RSVP`}
            accessibilityState={{ checked: link.isRsvp, disabled }}
            disabled={disabled}
            onPress={() => update(index, { isRsvp: !link.isRsvp })}
            style={styles.rsvp}
          >
            <Ionicons
              name={link.isRsvp ? 'checkbox' : 'square-outline'}
              size={iconSize.md}
              color={link.isRsvp ? colors.content.onBase.brand : colors.content.onBase.secondary}
            />
            <Text variant="bodySm">Members RSVP with this link</Text>
          </Pressable>
        </View>
      ))}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onPress={() => onChange([...links, { title: '', url: '', isRsvp: false }])}
      >
        Add Link
      </Button>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    field: { gap: space['200'] },
    link: {
      gap: space['200'],
      padding: space['300'],
      borderRadius: radius.md,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    linkHeader: { flexDirection: 'row', alignItems: 'center' },
    linkTitle: { flex: 1 },
    rsvp: { flexDirection: 'row', alignItems: 'center', gap: space['200'] },
  });

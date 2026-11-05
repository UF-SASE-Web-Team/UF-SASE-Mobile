import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ContactCard } from '@/components/ContactCard';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { space } from '@/theme';
import { EventWithDetails } from '@/types/events';

export interface EventContactItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface EventContactsSectionProps {
  contacts?: EventContactItem[] | null;
  program?: EventWithDetails['program'] | null;
  title?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventContactsSection({
  contacts,
  program,
  title = 'Contacts',
  style,
  testID,
}: EventContactsSectionProps) {
  const styles = useThemedStyles(createStyles);

  const resolvedContacts = useMemo<EventContactItem[]>(() => {
    if (contacts) return contacts;
    if (!program?.program_members) return [];

    return program.program_members
      .filter((m) => m.is_poc)
      .map((m) => ({
        id: m.id,
        name: m.display_name || m.profile?.full_name || 'Contact',
        avatarUrl: m.profile?.avatar_url,
      }));
  }, [contacts, program]);

  if (resolvedContacts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.section, style]} testID={testID}>
      <Text variant="bodyStrong" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.contactsContainer}>
        {resolvedContacts.map((contact) => (
          <ContactCard key={contact.id} name={contact.name} avatarUrl={contact.avatarUrl} />
        ))}
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    section: {
      gap: space['200'],
    },
    sectionTitle: {
      marginBottom: space['050'],
    },
    contactsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['200'],
    },
  });

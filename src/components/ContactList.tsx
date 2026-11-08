import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ContactCard } from '@/components/ContactCard';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { space } from '@/theme';

export interface ContactItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  userId?: string | null;
}

export interface ContactListProps {
  /**
   * Complete contacts to display.
   */
  contacts: ContactItem[];

  /**
   * Optional callback fired when a contact with a profile is pressed.
   */
  onContactPress?: (contact: ContactItem) => void;

  /**
   * Header title for the contact list section (default: 'Contacts').
   * If null or empty string, no title is rendered.
   */
  title?: string | null;

  /**
   * Custom style for the container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier.
   */
  testID?: string;

  /**
   * Component rendered when no contacts are found.
   */
  emptyComponent?: React.ReactNode;
}

export function ContactList({
  contacts,
  onContactPress,
  title = 'Contacts',
  style,
  testID,
  emptyComponent,
}: ContactListProps) {
  const styles = useThemedStyles(createStyles);

  if (!contacts || contacts.length === 0) {
    if (emptyComponent) {
      return (
        <View style={[styles.section, style]} testID={testID}>
          {Boolean(title) && (
            <Text variant="bodyStrong" style={styles.sectionTitle}>
              {title}
            </Text>
          )}
          {emptyComponent}
        </View>
      );
    }
    return null;
  }

  return (
    <View style={[styles.section, style]} testID={testID}>
      {Boolean(title) && (
        <Text variant="bodyStrong" style={styles.sectionTitle}>
          {title}
        </Text>
      )}
      <View style={styles.contactsContainer}>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            name={contact.name}
            avatarUrl={contact.avatarUrl}
            userId={contact.userId}
            onPress={contact.userId && onContactPress ? () => onContactPress(contact) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

export { ContactList as ContactContainer, ContactList as ContactsContainer };

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

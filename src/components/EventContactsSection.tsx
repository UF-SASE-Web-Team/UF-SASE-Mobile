import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ContactItem, ContactList } from '@/components/ContactList';
import { EventWithDetails } from '@/types/events';
import { ProgramWithPoCs } from '@/types/programs';

export type EventContactItem = ContactItem;

export interface EventContactsSectionProps {
  contacts?: EventContactItem[] | null;
  program?: EventWithDetails['program'] | ProgramWithPoCs | null;
  title?: string;
  onContactPress?: (contact: EventContactItem) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventContactsSection({
  contacts,
  program,
  title = 'Contacts',
  onContactPress,
  style,
  testID,
}: EventContactsSectionProps) {
  const resolvedContacts = useMemo<EventContactItem[]>(() => {
    if (contacts) return contacts;
    if (!program) return [];

    if ('pocs' in program && Array.isArray(program.pocs)) {
      return program.pocs.map((m) => ({
        id: m.id,
        name: m.display_name || m.profile?.full_name || 'Contact',
        avatarUrl: m.profile?.avatar_url,
        userId: m.user_id || m.profile?.id || null,
      }));
    }

    if ('program_members' in program && Array.isArray(program.program_members)) {
      return program.program_members
        .filter((m) => m.is_poc)
        .map((m) => ({
          id: m.id,
          name: m.display_name || m.profile?.full_name || 'Contact',
          avatarUrl: m.profile?.avatar_url,
          userId: m.user_id || m.profile?.id || null,
        }));
    }

    return [];
  }, [contacts, program]);

  return (
    <ContactList
      title={title}
      contacts={resolvedContacts}
      onContactPress={onContactPress}
      style={style}
      testID={testID}
    />
  );
}

export { EventContactsSection as ProgramContactsSection };

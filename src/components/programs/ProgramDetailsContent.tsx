import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { ContactItem, ContactList } from '@/components/ui/ContactList';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';

function renderFormattedText(text: string) {
  if (!text.includes('**')) {
    return text;
  }
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} variant="bodyStrong">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

interface ProgramDetailsContentProps {
  description?: string | null;
  action?: {
    url: string;
    label: string;
    accessibilityLabel: string;
  } | null;
  pocContacts: ContactItem[];
  onOpenAction: () => void;
  onContactPress?: (contact: ContactItem) => void;
}

export function ProgramDetailsContent({
  description,
  action,
  pocContacts,
  onOpenAction,
  onContactPress,
}: ProgramDetailsContentProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {/* Program Description in Offset Shadow Card */}
      {Boolean(description) && (
        <View style={styles.cardSection}>
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.offsetShadow}
            />
            <View style={styles.card}>
              <Text
                variant="body"
                color={colors.content.onBase.primary}
                style={styles.descriptionText}
              >
                {renderFormattedText(description as string)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Join / Apply link, shown while the program is accepting members */}
      {action && (
        <View style={styles.actionSection}>
          <Button onPress={onOpenAction} accessibilityLabel={action.accessibilityLabel}>
            {action.label}
          </Button>
        </View>
      )}

      {/* Program Contacts Section */}
      {pocContacts.length > 0 && (
        <View style={styles.contactsSection}>
          <ContactList title="Contacts" contacts={pocContacts} onContactPress={onContactPress} />
        </View>
      )}
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    cardSection: {
      paddingHorizontal: space['400'],
      paddingRight: space['600'],
      paddingBottom: space['400'],
    },
    cardWrapper: {
      position: 'relative',
    },
    offsetShadow: {
      position: 'absolute',
      top: 10,
      left: 6,
      right: -10,
      bottom: -10,
      borderRadius: radius.lg,
      zIndex: 0,
    },
    card: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      padding: space['500'],
      zIndex: 1,
    },
    descriptionText: {
      lineHeight: 24,
    },
    actionSection: {
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
      paddingBottom: space['400'],
    },
    contactsSection: {
      paddingHorizontal: space['400'],
      marginTop: space['200'],
      marginBottom: space['400'],
    },
  });

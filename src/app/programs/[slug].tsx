import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { ContactItem, ContactList } from '@/components/ContactList';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getProgramAction } from '@/lib/programs';
import { getProgramBySlug } from '@/services/programs';
import { type Colors, radius, space } from '@/theme';
import { ProgramWithPoCs } from '@/types/programs';

function formatSlugToName(slug?: string) {
  if (!slug) return '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

interface ProgramDetailScreenProps {
  onContactPress?: (contact: ContactItem) => void;
}

export default function ProgramDetailScreen({ onContactPress }: ProgramDetailScreenProps = {}) {
  const { slug, name: paramName } = useLocalSearchParams<{ slug: string; name?: string }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [program, setProgram] = useState<ProgramWithPoCs | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    getProgramBySlug(slug)
      .then((data) => {
        if (isMounted && data) {
          setProgram(data);
        }
      })
      .catch((err) => {
        console.warn('Error fetching program:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const programName = paramName || program?.name || formatSlugToName(slug);
  const description = program?.description || program?.short_description;
  const action = program ? getProgramAction(program) : null;

  const openAction = async () => {
    if (action && (await Linking.canOpenURL(action.url))) await Linking.openURL(action.url);
  };

  const pocContacts = useMemo<ContactItem[]>(() => {
    if (!program?.pocs) return [];
    return program.pocs.map((poc) => ({
      id: poc.id,
      name: poc.display_name || poc.profile?.full_name || 'Contact',
      avatarUrl: poc.profile?.avatar_url,
      userId: poc.user_id || poc.profile?.id || null,
    }));
  }, [program]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with BackButton */}
      <View style={styles.header}>
        <BackButton fallbackRoute="/programs" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top-aligned container with gradient display text in saseblue flanked by offset decorative stars */}
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <Image
              source={require('@/assets/star-left.png')}
              style={styles.starLeft}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessibilityRole="none"
              importantForAccessibility="no"
              accessibilityElementsHidden
            />

            <MaskedView
              maskElement={
                <Text
                  variant="display"
                  color={colors.content.onBase.primary}
                  style={[styles.titleText, styles.maskText]}
                >
                  {programName}
                </Text>
              }
            >
              <LinearGradient
                colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text
                  variant="display"
                  style={[styles.titleText, styles.hiddenTitleText]}
                  aria-hidden
                >
                  {programName}
                </Text>
              </LinearGradient>
            </MaskedView>

            <Image
              source={require('@/assets/star-right.png')}
              style={styles.starRight}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessibilityRole="none"
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
          </View>
        </View>

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
            <Button onPress={openAction} accessibilityLabel={action.accessibilityLabel}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    header: {
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
    },
    scrollContent: {
      paddingBottom: space['1000'],
    },
    titleContainer: {
      paddingHorizontal: space['1000'],
      paddingTop: space['400'],
      paddingBottom: space['400'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleWrapper: {
      position: 'relative',
      alignSelf: 'center',
    },
    starLeft: {
      position: 'absolute',
      left: -38,
      bottom: 0,
      width: 36,
      height: 37,
      zIndex: 1,
    },
    starRight: {
      position: 'absolute',
      right: -30,
      top: -16,
      width: 28,
      height: 39,
      zIndex: 1,
    },
    titleText: {
      textAlign: 'center',
    },
    maskText: {
      backgroundColor: 'transparent',
    },
    hiddenTitleText: {
      opacity: 0,
    },
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

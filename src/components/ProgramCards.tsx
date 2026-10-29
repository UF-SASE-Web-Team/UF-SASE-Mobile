import React from 'react';
import { ImageBackground, Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Database } from '@/types/supabase';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space, radius, fonts } from '@/theme';

export type ProgramRow = Database['public']['Tables']['programs']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProgramCategory = Database['public']['Enums']['program_category'];

export interface ProgramMemberWithProfile {
  id: string;
  user_id: string | null;
  display_name: string;
  academic_term: string;
  is_poc: boolean;
  profile: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface ProgramWithPoCs extends ProgramRow {
  pocs: ProgramMemberWithProfile[];
}

interface CardProps {
  program: ProgramWithPoCs;
  onPress?: (program: ProgramWithPoCs) => void;
}

/**
 * Top Row Card: Open / Upcoming Applications
 */
export function ApplicationProgramCard({ program, onPress }: CardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const now = new Date();
  const opensAt = program.opens_at ? new Date(program.opens_at) : null;
  const closesAt = program.closes_at ? new Date(program.closes_at) : null;

  const isUpcoming = opensAt !== null && opensAt > now;
  const isOpen = !isUpcoming && (closesAt === null || closesAt > now);

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

  const handleApplyPress = async () => {
    if (isOpen && program.application_url) {
      const supported = await Linking.canOpenURL(program.application_url);
      if (supported) {
        await Linking.openURL(program.application_url);
      }
    } else if (onPress) {
      onPress(program);
    }
  };

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(program)}>
      <ImageBackground
        source={program.image_url ? { uri: program.image_url } : undefined}
        style={styles.imageHeader}
        imageStyle={styles.imageStyle}
      >
        {isUpcoming && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Waiting</Text>
            <View style={styles.statusDot} />
          </View>
        )}

        <Text style={styles.cardTitle} numberOfLines={2}>
          {program.name}
        </Text>
      </ImageBackground>

      <View style={styles.appCardFooter}>
        <Text style={styles.statusSubtext} numberOfLines={1}>
          {isUpcoming ? (
            <>
              Applications open <Text style={styles.boldText}>soon!</Text>
            </>
          ) : closesAt ? (
            <>
              Apply by <Text style={styles.boldText}>{formatShortDate(closesAt)}!</Text>
            </>
          ) : (
            <>
              Applications <Text style={styles.boldText}>open!</Text>
            </>
          )}
        </Text>

        <Pressable
          style={[styles.applyButton, !isOpen && styles.applyButtonDisabled]}
          disabled={!isOpen || !program.application_url}
          onPress={handleApplyPress}
        >
          <Text style={[styles.applyButtonText, !isOpen && styles.applyButtonTextDisabled]}>
            Apply
          </Text>
          {isOpen && (
            <Ionicons
              name="open-outline"
              size={15}
              color={colors.content.onSaseBlue.secondary}
              style={styles.buttonIcon}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Category Row Card: Uses `short_description` with inline "Read More"
 */
export function StandardProgramCard({ program, onPress }: CardProps) {
  const styles = useThemedStyles(createStyles);

  const summary = program.short_description || program.description || '';
  const maxChars = 82;
  const truncated =
    summary.length > maxChars ? `${summary.slice(0, maxChars).trimEnd()}... ` : `${summary} `;

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(program)}>
      <ImageBackground
        source={program.image_url ? { uri: program.image_url } : undefined}
        style={styles.imageHeader}
        imageStyle={styles.imageStyle}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {program.name}
        </Text>
      </ImageBackground>

      <View style={styles.standardCardBody}>
        <Text style={styles.descriptionText} numberOfLines={4}>
          {truncated}
          <Text style={styles.readMoreText}>Read More</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 164,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginRight: space['300'],
    },
    imageHeader: {
      height: 125,
      backgroundColor: colors.surface.base.tertiary,
      padding: space['300'],
      justifyContent: 'flex-end',
    },
    imageStyle: {
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    statusBadge: {
      position: 'absolute',
      top: space['200'],
      right: space['200'],
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      borderRadius: radius.md,
      gap: space['100'],
    },
    statusBadgeText: {
      fontFamily: fonts.sans.semibold,
      fontSize: 10,
      color: colors.content.onBase.primary,
    },
    statusDot: {
      width: space['200'],
      height: space['200'],
      borderRadius: radius.sm,
      backgroundColor: colors.content.onBase.secondary,
    },
    cardTitle: {
      fontFamily: fonts.sans.bold,
      fontSize: 16,
      lineHeight: 20,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    appCardFooter: {
      paddingHorizontal: space['200'],
      paddingVertical: space['200'],
      justifyContent: 'space-between',
      gap: space['200'],
    },
    statusSubtext: {
      fontFamily: fonts.sans.regular,
      fontSize: 11,
      color: colors.content.onBase.secondary,
    },
    boldText: {
      fontFamily: fonts.sans.bold,
      color: colors.content.onBase.primary,
    },
    applyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.saseBlue.primary,
      paddingVertical: space['200'],
      borderRadius: radius.lg,
      gap: space['150'],
    },
    applyButtonDisabled: {
      backgroundColor: colors.surface.base.tertiary,
    },
    applyButtonText: {
      fontFamily: fonts.sans.semibold,
      fontSize: 14,
      color: colors.content.onSaseBlue.secondary,
    },
    applyButtonTextDisabled: {
      color: colors.content.onBase.secondary,
    },
    buttonIcon: {
      marginLeft: space['050'],
    },
    standardCardBody: {
      padding: space['200'],
      minHeight: 74,
    },
    descriptionText: {
      fontFamily: fonts.sans.regular,
      fontSize: 11,
      lineHeight: 14,
      color: colors.content.onBase.secondary,
    },
    readMoreText: {
      fontFamily: fonts.sans.bold,
      color: colors.content.saseBlue.primary,
    },
  });

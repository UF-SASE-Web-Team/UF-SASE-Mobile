import React from 'react';
import { ImageBackground, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Database } from '@/types/supabase';

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
            <Ionicons name="open-outline" size={15} color="#111" style={styles.buttonIcon} />
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

const styles = StyleSheet.create({
  card: {
    width: 164,
    backgroundColor: '#DCDCDC',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  imageHeader: {
    height: 125,
    backgroundColor: '#B0B0B0',
    padding: 12,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#222',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A8A8A8',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 20,
  },
  appCardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    gap: 8,
  },
  statusSubtext: {
    fontSize: 10.5,
    color: '#222',
  },
  boldText: {
    fontWeight: '700',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BDBDBD',
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  applyButtonDisabled: {
    backgroundColor: '#C8C8C8',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  applyButtonTextDisabled: {
    color: '#555',
  },
  buttonIcon: {
    marginLeft: 2,
  },
  standardCardBody: {
    padding: 10,
    minHeight: 74,
  },
  descriptionText: {
    fontSize: 10.5,
    lineHeight: 13.5,
    color: '#1F1F1F',
  },
  readMoreText: {
    fontWeight: '700',
    color: '#000',
  },
});

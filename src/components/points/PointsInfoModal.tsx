import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';

interface PointsInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PointsInfoModal({ visible, onClose }: PointsInfoModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
              SASE Points
            </Text>{' '}
            are a reward system designed to recognize members for their involvement and
            participation. Members can earn points by attending events such as General Body Meetings
            (GBMs), socials, and other SASE activities, as well as participating in our programs.
          </Text>
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            As you accumulate points, you can unlock rewards, including free SASE merchandise!
            Remember to check in at every event you attend to ensure your points are recorded!
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="points-info-close"
            onPress={onClose}
            style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
          >
            <Text variant="bodySmStrong" color={colors.content.onSaseBlueSubtle.primary}>
              Back to Attendance
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.surface.media.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space['600'],
    },
    modalCard: {
      backgroundColor: colors.surface.base.primary,
      borderRadius: radius.lg,
      padding: space['600'],
      gap: space['400'],
      maxWidth: 400,
      width: '100%',
    },
    infoButton: {
      alignSelf: 'center',
      paddingVertical: space['200'],
      paddingHorizontal: space['400'],
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderRadius: radius.full,
    },
    pressed: {
      opacity: 0.7,
    },
  });

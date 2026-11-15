import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { space, type Colors } from '@/theme';

interface PointsInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PointsInfoModal({ visible, onClose }: PointsInfoModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ModalSheet title="SASE Points" visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text variant="body" color={colors.content.onBase.secondary}>
          <Text variant="bodyStrong" color={colors.content.onBase.primary}>
            SASE Points
          </Text>{' '}
          are a reward system designed to recognize members for their involvement and participation.
          Members can earn points by attending events such as General Body Meetings (GBMs), socials,
          and other SASE activities, as well as participating in our programs.
        </Text>
        <Text variant="body" color={colors.content.onBase.secondary}>
          As you accumulate points, you can unlock rewards, including free SASE merchandise!
          Remember to check in at every event you attend to ensure your points are recorded!
        </Text>
        <Button
          variant="secondary"
          size="md"
          onPress={onClose}
          accessibilityLabel="Back to Attendance"
          testID="points-info-close"
          style={styles.button}
        >
          Back to Attendance
        </Button>
      </View>
    </ModalSheet>
  );
}

const createStyles = (_colors: Colors) =>
  StyleSheet.create({
    content: {
      gap: space['400'],
      paddingTop: space['200'],
    },
    button: {
      marginTop: space['200'],
    },
  });

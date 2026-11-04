import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SixDigitInput } from '@/components/SixDigitInput';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { checkInToEvent } from '@/services/events';
import { type Colors, borderWidth, radius, space } from '@/theme';

export interface EventCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  pointsValue: number;
  onSuccess: () => void;
}

export function EventCheckInModal({
  visible,
  onClose,
  eventId,
  eventTitle,
  pointsValue,
  onSuccess,
}: EventCheckInModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [checkInCode, setCheckInCode] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setCheckInCode('');
    setCheckInError(null);
    onClose();
  };

  const handleCheckInSubmit = async (codeToSubmit: string) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }
    if (!eventId || codeToSubmit.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setCheckInError(null);

    try {
      await checkInToEvent(eventId, codeToSubmit);
      setCheckInCode('');
      onSuccess();
      onClose();
      Alert.alert(
        'Checked In!',
        `You have successfully checked in to ${eventTitle}! +${pointsValue} points earned.`,
      );
    } catch (err: any) {
      setCheckInError(err.message || 'Invalid check-in code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      testID="event-check-in-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View style={styles.modalCard}>
          <Text variant="title" style={styles.modalTitle}>
            Event Check-in
          </Text>
          <Text
            variant="bodySm"
            color={colors.content.onBase.secondary}
            style={styles.modalSubtitle}
          >
            Enter the 6-digit code provided at the event.
          </Text>

          <View style={styles.modalInputWrapper}>
            <SixDigitInput
              value={checkInCode}
              onChangeText={(text) => {
                setCheckInCode(text);
                setCheckInError(null);
              }}
              onComplete={handleCheckInSubmit}
              disabled={isSubmitting}
            />
          </View>

          {Boolean(checkInError) && (
            <Text variant="bodySm" color={colors.content.onDanger.primary} style={styles.errorText}>
              {checkInError}
            </Text>
          )}

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text variant="bodyStrong" color={colors.content.onBase.primary}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalButton,
                styles.modalSubmitButton,
                (checkInCode.length !== 6 || isSubmitting) && styles.modalSubmitButtonDisabled,
              ]}
              onPress={() => handleCheckInSubmit(checkInCode)}
              disabled={checkInCode.length !== 6 || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Submit code"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text variant="bodyStrong" color="#FFFFFF">
                  Submit
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space['400'],
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface.base.primary,
      borderRadius: radius.lg,
      padding: space['500'],
      alignItems: 'center',
      gap: space['200'],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    modalTitle: {
      textAlign: 'center',
    },
    modalSubtitle: {
      textAlign: 'center',
      marginBottom: space['200'],
    },
    modalInputWrapper: {
      marginVertical: space['200'],
      alignItems: 'center',
    },
    errorText: {
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: space['300'],
      marginTop: space['300'],
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: space['250'],
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelButton: {
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    modalSubmitButton: {
      backgroundColor: colors.surface.saseBlue.primary,
    },
    modalSubmitButtonDisabled: {
      opacity: 0.5,
    },
  });

import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SixDigitInput } from '@/components/SixDigitInput';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { checkInToEvent } from '@/services/events';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';

export interface EventCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  pointsValue: number;
  onSuccess: () => void;
  initialMode?: 'code' | 'qr';
}

export function EventCheckInModal({
  visible,
  onClose,
  eventId,
  eventTitle,
  pointsValue,
  onSuccess,
  initialMode = 'qr',
}: EventCheckInModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [mode, setMode] = useState<'code' | 'qr'>(initialMode);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (isSubmitting) return;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    setCheckInCode('');
    setCheckInError(null);
    hasScannedRef.current = false;
    setMode(initialMode);
    onClose();
  };

  const handleModeChange = (newMode: 'code' | 'qr') => {
    if (isSubmitting) return;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    setCheckInError(null);
    hasScannedRef.current = false;
    setMode(newMode);
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
      Alert.alert('Check-in successful!', `You've gained +${pointsValue} points.`);
    } catch (err: any) {
      setCheckInError(err.message || 'Invalid check-in code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isSubmitting || hasScannedRef.current) return;
    if (!data || typeof data !== 'string') return;

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }

    hasScannedRef.current = true;
    setIsSubmitting(true);
    setCheckInError(null);

    const trimmed = data.trim();
    let method: 'code' | 'qr' = 'qr';
    let payload = trimmed;

    if (/^\d{6}$/.test(trimmed)) {
      method = 'code';
      payload = trimmed;
    } else {
      try {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get('code');
        if (codeParam && /^\d{6}$/.test(codeParam.trim())) {
          method = 'code';
          payload = codeParam.trim();
        }
      } catch {
        // Not a URL with query params; treat as direct QR payload
      }
    }

    try {
      await checkInToEvent(eventId, payload, method);
      onSuccess();
      onClose();
      Alert.alert('Check-in successful!', `You've gained +${pointsValue} points.`);
    } catch (err: any) {
      setCheckInError(err.message || 'Invalid QR code. Please try again.');
      // Cooldown for 2.5 seconds before allowing another scan attempt
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
      cooldownTimeoutRef.current = setTimeout(() => {
        hasScannedRef.current = false;
      }, 2500);
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

          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <Pressable
              style={[styles.segmentButton, mode === 'qr' && styles.segmentButtonActive]}
              onPress={() => handleModeChange('qr')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'qr' }}
              accessibilityLabel="Scan QR"
            >
              <Ionicons
                name="qr-code-outline"
                size={iconSize.sm}
                color={
                  mode === 'qr' ? colors.content.onBase.primary : colors.content.onBase.secondary
                }
              />
              <Text
                variant="bodySmStrong"
                color={
                  mode === 'qr' ? colors.content.onBase.primary : colors.content.onBase.secondary
                }
              >
                Scan QR
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentButton, mode === 'code' && styles.segmentButtonActive]}
              onPress={() => handleModeChange('code')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'code' }}
              accessibilityLabel="6-Digit Code"
            >
              <Ionicons
                name="keypad-outline"
                size={iconSize.sm}
                color={
                  mode === 'code' ? colors.content.onBase.primary : colors.content.onBase.secondary
                }
              />
              <Text
                variant="bodySmStrong"
                color={
                  mode === 'code' ? colors.content.onBase.primary : colors.content.onBase.secondary
                }
              >
                Code
              </Text>
            </Pressable>
          </View>

          {mode === 'code' ? (
            <View style={styles.modalInputWrapper}>
              <Text
                variant="bodySm"
                color={colors.content.onBase.secondary}
                style={styles.codePromptText}
              >
                Enter the 6-digit code provided.
              </Text>
              <SixDigitInput
                value={checkInCode}
                onChangeText={(text) => {
                  setCheckInCode(text);
                  setCheckInError(null);
                }}
                onComplete={handleCheckInSubmit}
                disabled={isSubmitting}
              />
              {Boolean(checkInError) && (
                <Text
                  variant="bodySm"
                  color={colors.surface.danger.primary}
                  style={styles.errorText}
                >
                  {checkInError}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.scannerWrapper}>
              <Text
                variant="bodySm"
                color={
                  checkInError ? colors.surface.danger.primary : colors.content.onBase.secondary
                }
                style={styles.scannerPromptText}
                numberOfLines={2}
              >
                {checkInError ?? 'Scan the QR code displayed.'}
              </Text>
              <View style={styles.scannerContainer}>
                {permission === null ? (
                  <View style={styles.permissionPlaceholder}>
                    <ActivityIndicator size="small" color={colors.content.onBase.primary} />
                  </View>
                ) : !permission.granted ? (
                  <View style={styles.permissionPlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={iconSize.lg}
                      color={colors.content.onBase.secondary}
                    />
                    <Text
                      variant="bodySm"
                      color={colors.content.onBase.secondary}
                      style={styles.permissionText}
                    >
                      Camera permission is required to scan QR codes.
                    </Text>
                    <Pressable
                      style={styles.permissionButton}
                      onPress={requestPermission}
                      accessibilityRole="button"
                      accessibilityLabel="Enable Camera"
                    >
                      <Text variant="bodySmStrong" color={colors.content.onSaseBlue.secondary}>
                        Enable Camera
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.cameraViewport}>
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={isSubmitting ? undefined : handleBarcodeScanned}
                      testID="camera-view"
                    />
                    <View style={styles.reticleOverlay} pointerEvents="none">
                      <View style={styles.reticleBox} />
                    </View>
                    {isSubmitting && (
                      <View style={styles.submittingOverlay}>
                        <ActivityIndicator size="large" color={colors.content.onMedia.primary} />
                        <Text
                          variant="bodySmStrong"
                          color={colors.content.onMedia.primary}
                          style={styles.submittingText}
                        >
                          Checking in...
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
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

            {mode === 'code' && (
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
                  <ActivityIndicator size="small" color={colors.content.onSaseBlue.secondary} />
                ) : (
                  <Text variant="bodyStrong" color={colors.content.onSaseBlue.secondary}>
                    Submit
                  </Text>
                )}
              </Pressable>
            )}
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
      backgroundColor: colors.surface.media.scrim,
    },
    modalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface.base.primary,
      borderRadius: radius.lg,
      padding: space['400'],
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
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
      padding: space['050'],
      marginTop: space['100'],
      width: '100%',
    },
    segmentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['150'],
      borderRadius: radius.sm,
      gap: space['150'],
    },
    segmentButtonActive: {
      backgroundColor: colors.surface.base.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    codePromptText: {
      textAlign: 'center',
    },
    modalInputWrapper: {
      width: '100%',
      maxWidth: 300,
      height: 326,
      marginVertical: space['150'],
      justifyContent: 'center',
      alignItems: 'center',
      gap: space['200'],
    },
    scannerWrapper: {
      width: '100%',
      maxWidth: 300,
      alignItems: 'center',
      marginVertical: space['150'],
      gap: space['200'],
    },
    scannerPromptText: {
      textAlign: 'center',
    },
    scannerContainer: {
      width: '100%',
      maxWidth: 300,
      aspectRatio: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface.base.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraViewport: {
      ...StyleSheet.absoluteFill,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    reticleOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reticleBox: {
      width: 220,
      height: 220,
      borderRadius: radius.md,
      borderWidth: borderWidth.lg,
      borderColor: colors.surface.media.scrim,
    },
    submittingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.surface.media.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      gap: space['200'],
    },
    submittingText: {
      marginTop: space['100'],
    },
    permissionPlaceholder: {
      padding: space['400'],
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['200'],
    },
    permissionText: {
      textAlign: 'center',
    },
    permissionButton: {
      backgroundColor: colors.surface.saseBlue.primary,
      paddingVertical: space['150'],
      paddingHorizontal: space['300'],
      borderRadius: radius.md,
      marginTop: space['100'],
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

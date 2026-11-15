import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { Button } from '@/components/ui/Button';
import { SixDigitInput } from '@/components/ui/SixDigitInput';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useEventCheckIn } from '@/hooks/useEventCheckIn';
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

const SEGMENT_TABS = [
  { key: 'qr', label: 'Scan QR', icon: 'qr-code-outline' },
  { key: 'code', label: 'Code', icon: 'keypad-outline' },
] as const;

export function EventCheckInModal({
  visible,
  onClose,
  eventId,
  eventTitle,
  pointsValue,
  onSuccess,
  initialMode = 'qr',
}: EventCheckInModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    mode,
    checkInCode,
    setCheckInCode,
    checkInError,
    setCheckInError,
    isSubmitting,
    permission,
    requestPermission,
    handleModeChange,
    handleCheckInSubmit,
    handleBarcodeScanned,
    handleClose,
  } = useEventCheckIn({
    eventId,
    pointsValue,
    initialMode,
    onSuccess,
    onClose,
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      testID="event-check-in-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <View style={styles.segmentContainer} accessibilityRole="tablist">
            {SEGMENT_TABS.map((tab) => {
              const isSelected = mode === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                  onPress={() => handleModeChange(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={tab.key === 'code' ? '6-Digit Code' : tab.label}
                >
                  <Ionicons
                    name={tab.icon}
                    size={iconSize.sm}
                    color={
                      isSelected ? colors.content.onBase.primary : colors.content.onBase.secondary
                    }
                  />
                  <Text
                    variant="bodySmStrong"
                    color={
                      isSelected ? colors.content.onBase.primary : colors.content.onBase.secondary
                    }
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'qr' ? (
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
                    <Button
                      size="sm"
                      onPress={requestPermission}
                      accessibilityLabel="Enable Camera"
                    >
                      Enable Camera
                    </Button>
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
          ) : (
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
              {isSubmitting && (
                <View style={styles.submittingStatusRow}>
                  <ActivityIndicator size="small" color={colors.surface.saseBlue.primary} />
                  <Text variant="bodySmStrong" color={colors.content.onBase.secondary}>
                    Checking in...
                  </Text>
                </View>
              )}
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
          )}

          <View style={styles.modalActions}>
            <Button
              variant="outline"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.modalActionButton}
              accessibilityLabel="Cancel"
              size="md"
            >
              Cancel
            </Button>
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
      padding: space['100'],
      gap: space['100'],
      marginTop: space['100'],
      width: '100%',
    },
    segmentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['200'],
      borderRadius: radius.md,
      gap: space['150'],
    },
    segmentButtonActive: {
      backgroundColor: colors.surface.base.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    codePromptText: {
      textAlign: 'center',
    },
    modalInputWrapper: {
      width: '100%',
      maxWidth: 300,
      paddingVertical: space['300'],
      marginVertical: space['150'],
      justifyContent: 'center',
      alignItems: 'center',
      gap: space['200'],
    },
    submittingStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['150'],
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
    errorText: {
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: space['300'],
      marginTop: space['300'],
      width: '100%',
    },
    modalActionButton: {
      flex: 1,
    },
  });

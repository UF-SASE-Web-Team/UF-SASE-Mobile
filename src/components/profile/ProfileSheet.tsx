import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles, type Colors, iconSize, radius, space } from '@/theme';

interface ProfileSheetProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}

export function ProfileSheet({
  title,
  visible,
  onClose,
  children,
  busy = false,
}: ProfileSheetProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const insetStyle = useMemo(() => ({ paddingBottom: bottom + space['400'] }), [bottom]);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
        />
        <View style={[styles.sheet, insetStyle]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              disabled={busy}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={iconSize.md} color={colors.content.onBase.primary} />
            </Pressable>
            <Text variant="bodyStrong" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <View style={styles.placeholder} />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.surface.media.scrim,
      opacity: 0.25,
    },
    sheet: {
      width: '100%',
      maxWidth: 560,
      maxHeight: '85%',
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
    },
    grabber: {
      alignSelf: 'center',
      width: 60,
      height: space['100'],
      borderRadius: radius.full,
      backgroundColor: colors.border.base.subtle,
      marginBottom: space['200'],
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: space['400'] },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.surface.base.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { flex: 1, textAlign: 'center' },
    placeholder: { width: 44 },
  });

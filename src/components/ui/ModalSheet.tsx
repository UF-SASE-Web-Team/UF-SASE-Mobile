import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '@/components/ui/CloseButton';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, type Colors, radius, space } from '@/theme';

export interface ModalSheetProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  testID?: string;
}

export function ModalSheet({
  title,
  visible,
  onClose,
  children,
  busy = false,
  testID,
}: ModalSheetProps) {
  const styles = useThemedStyles(createStyles);
  const { bottom } = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const insetStyle = useMemo(
    () => ({
      paddingBottom: keyboardVisible ? space['200'] : Math.max(bottom, space['400']),
    }),
    [bottom, keyboardVisible],
  );

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
      testID={testID}
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
          testID="modal-sheet-scrim"
        />
        <View style={[styles.sheet, insetStyle]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <CloseButton accessibilityLabel={`Close ${title}`} disabled={busy} onClose={onClose} />
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
    title: { flex: 1, textAlign: 'center' },
    placeholder: { width: 40 },
  });

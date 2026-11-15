import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  type KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/ui/BackButton';
import { CloseButton } from '@/components/ui/CloseButton';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/context/ProfileContext';
import { useThemedStyles, useTheme, type Colors, iconSize, space } from '@/theme';

interface ProfileScreenProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
  onEdit?: () => void;
  /** Shows a close (X) button at the top right. */
  onClose?: () => void;
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export type ProfileModalContextType = {
  register: (id: string, node: ReactNode) => void;
  unregister: (id: string) => void;
} | null;

export const ProfileModalContext = createContext<ProfileModalContextType>(null);

export function ProfileModalSlot({ children }: { children: ReactNode }) {
  const id = useId();
  const context = useContext(ProfileModalContext);
  useEffect(() => {
    if (context) {
      context.register(id, children);
      return () => context.unregister(id);
    }
  }, [context, id, children]);

  if (!context) {
    return <>{children}</>;
  }
  return null;
}

export function ProfileScreen({
  children,
  title,
  headerRight,
  onEdit,
  onClose,
  onBack,
  backLabel = 'Back',
  footer,
  scrollViewRef,
}: ProfileScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [modals, setModals] = useState<Record<string, ReactNode>>({});

  const registerModal = useCallback((id: string, node: ReactNode) => {
    setModals((prev) => ({ ...prev, [id]: node }));
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setModals((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const modalContextValue = useMemo(
    () => ({ register: registerModal, unregister: unregisterModal }),
    [registerModal, unregisterModal],
  );

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const insetStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, space['400']) }),
    [insets.bottom],
  );

  const scrollPaddingBottom = useMemo(() => {
    if (footer) return insetStyle.paddingBottom;
    if (keyboardHeight > 0) {
      return keyboardHeight + space['1200'] * 3;
    }
    return insetStyle.paddingBottom;
  }, [footer, keyboardHeight, insetStyle.paddingBottom]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ProfileModalContext.Provider value={modalContextValue}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' && footer ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <View style={styles.toolbar}>
              <View style={styles.toolbarSide}>
                <BackButton
                  fallbackRoute="/(tabs)"
                  onPress={onBack}
                  accessibilityLabel={backLabel}
                />
              </View>
              {title ? (
                <View style={styles.toolbarCenter} pointerEvents="none">
                  <Text variant="bodyStrong" style={styles.toolbarTitle} numberOfLines={1}>
                    {title}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.toolbarSide, styles.toolbarRight]}>
                {headerRight ? (
                  headerRight
                ) : (
                  <>
                    {onEdit && (
                      <Pressable
                        accessibilityLabel="Edit profile"
                        accessibilityRole="button"
                        onPress={onEdit}
                        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                      >
                        <Ionicons
                          name="pencil"
                          size={iconSize.md}
                          color={colors.content.onBase.primary}
                        />
                      </Pressable>
                    )}
                    {onClose && <CloseButton onClose={onClose} accessibilityLabel="Close" />}
                  </>
                )}
              </View>
            </View>
          </View>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>{children}</View>
          </ScrollView>
          {footer && <View style={[styles.footer, insetStyle]}>{footer}</View>}
        </KeyboardAvoidingView>
        {Object.entries(modals).map(([key, node]) => (
          <Fragment key={key}>{node}</Fragment>
        ))}
      </ProfileModalContext.Provider>
    </SafeAreaView>
  );
}

export function ProfileLoadingState() {
  const { isLoading, error, reload } = useProfile();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ProfileScreen>
      <View style={styles.status}>
        {isLoading ? (
          <ActivityIndicator
            accessibilityLabel="Loading profile"
            color={colors.surface.saseBlue.primary}
          />
        ) : (
          <>
            <Text variant="title">Profile unavailable</Text>
            <Text variant="body" accessibilityRole="alert">
              {error ?? 'Please sign in to view your profile.'}
            </Text>
            <Button onPress={reload}>Try again</Button>
          </>
        )}
      </View>
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface.base.primary },
    flex: { flex: 1 },
    header: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      paddingHorizontal: space['500'],
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: space['200'] },
    scrollBottomBuffer: {
      paddingBottom: space['1200'] * 3,
    },
    footer: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      paddingHorizontal: space['500'],
      paddingTop: space['200'],
      backgroundColor: colors.surface.base.primary,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 480,
      paddingHorizontal: space['500'],
      paddingTop: space['200'],
    },
    toolbar: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space['300'],
      marginBottom: space['200'],
      position: 'relative',
    },
    toolbarSide: {
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    toolbarRight: {
      justifyContent: 'flex-end',
    },
    toolbarCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbarTitle: {
      color: colors.content.onBase.primary,
    },
    editButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
    status: {
      flex: 1,
      justifyContent: 'center',
      gap: space['400'],
      paddingVertical: space['1200'],
    },
  });

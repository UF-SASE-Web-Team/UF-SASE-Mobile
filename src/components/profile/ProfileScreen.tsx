import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { ProfileButton } from './ProfileButton';
import { useProfile } from '@/context/ProfileContext';
import {
  useThemedStyles,
  useTheme,
  type Colors,
  borderWidth,
  iconSize,
  profileLayout,
  radius,
  space,
} from '@/theme';

interface ProfileScreenProps {
  children: ReactNode;
  onEdit?: () => void;
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
}

export function ProfileScreen({
  children,
  onEdit,
  onBack,
  backLabel = 'Back',
  footer,
}: ProfileScreenProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const insetStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, space['400']) }),
    [insets.bottom],
  );
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, !footer && insetStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.toolbar}>
              <Pressable
                accessibilityLabel={backLabel}
                accessibilityRole="button"
                onPress={goBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <Ionicons
                  name="chevron-back"
                  size={iconSize.md}
                  color={colors.content.onBase.primary}
                />
              </Pressable>
              {onEdit && (
                <Pressable
                  accessibilityLabel="Edit profile"
                  accessibilityRole="button"
                  onPress={onEdit}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                >
                  <Image
                    source={require('@/assets/icons/profile/pencil.svg')}
                    style={styles.pencil}
                    tintColor={colors.content.onBase.brand}
                    contentFit="contain"
                    accessible={false}
                  />
                </Pressable>
              )}
            </View>
            {children}
          </View>
        </ScrollView>
        {footer && <View style={[styles.footer, insetStyle]}>{footer}</View>}
      </KeyboardAvoidingView>
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
            <ProfileButton title="Try again" onPress={reload} />
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
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: space['200'] },
    footer: {
      width: '100%',
      maxWidth: profileLayout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: space['500'],
      paddingTop: space['200'],
      backgroundColor: colors.surface.base.primary,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: profileLayout.contentMaxWidth,
      paddingHorizontal: space['500'],
    },
    toolbar: {
      height: profileLayout.touchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: profileLayout.touchTarget,
      height: profileLayout.touchTarget,
      borderRadius: radius.full,
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButton: {
      width: profileLayout.touchTarget,
      height: profileLayout.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pencil: { width: profileLayout.pencilSize, height: profileLayout.pencilSize },
    pressed: { opacity: profileLayout.pressedOpacity },
    status: {
      flex: 1,
      justifyContent: 'center',
      gap: space['400'],
      paddingVertical: space['1200'],
    },
  });

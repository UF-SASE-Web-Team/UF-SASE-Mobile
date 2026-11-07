import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space } from '@/theme';
import { SaseFlask, SaseLogo } from '@/components/icons';

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.centerContainer}>
        <View
          style={styles.logoContainer}
          accessible
          accessibilityRole="image"
          accessibilityLabel="UF SASE Logo"
        >
          <SaseFlask
            width={100}
            height={137}
            fill={colors.content.onBase.primary}
            color={colors.content.onBase.primary}
          />
          <SaseLogo
            width={242}
            height={55}
            fill={colors.content.onBase.primary}
            color={colors.content.onBase.primary}
          />
        </View>
        <Text variant="title" style={styles.title}>
          University of Florida
        </Text>
        <Text variant="body" style={styles.tagline}>
          {'Empowering Asian heritage in\nSTEM since 2009.'}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          variant="secondary"
          onPress={() => router.push('/(auth)/signup')}
          accessibilityLabel="Create an account"
        >
          Create an account
        </Button>

        <Button
          variant="primary"
          onPress={() => router.push('/(auth)/login')}
          accessibilityLabel="Login"
        >
          Login
        </Button>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
      justifyContent: 'space-between',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: space['600'],
    },
    logoContainer: {
      alignItems: 'center',
      gap: space['600'],
      marginBottom: space['1000'],
    },
    title: {
      alignSelf: 'stretch',
      textAlign: 'center',
      marginBottom: space['200'],
    },
    tagline: {
      alignSelf: 'stretch',
      textAlign: 'center',
    },
    actionsContainer: {
      paddingHorizontal: space['600'],
      paddingBottom: space['300'],
      gap: space['300'],
    },
  });

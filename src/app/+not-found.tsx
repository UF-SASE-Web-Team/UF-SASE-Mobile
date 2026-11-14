import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, type Colors, space } from '@/theme';

export default function NotFoundScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={styles.container}>
        <Text variant="title">This screen does not exist.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text variant="bodyStrong" style={styles.linkText}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space['500'],
      backgroundColor: colors.surface.base.primary,
      gap: space['400'],
    },
    link: {
      marginTop: space['300'],
      paddingVertical: space['300'],
    },
    linkText: {
      color: colors.surface.saseBlue.primary,
    },
  });

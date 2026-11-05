import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { isSupabaseConfigured } from '@/lib/env';
import { iconSize, useTheme } from '@/theme';

export default function HomePage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface.base.primary }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.content.onBase.primary }]}>Home</Text>
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="home-profile-button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [
            styles.profileButton,
            {
              backgroundColor: colors.surface.base.secondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={iconSize.md}
            color={colors.content.onBase.primary}
          />
        </Pressable>
      </View>
      <View style={styles.container}>
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.surface.base.secondary,
              borderColor: colors.border.base.subtle,
              borderWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isSupabaseConfigured ? styles.statusReady : styles.statusWaiting,
            ]}
          />
          <Text style={[styles.statusTitle, { color: colors.content.onBase.primary }]}>
            {isSupabaseConfigured ? 'Supabase variable loaded' : 'Supabase variable not loaded'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  statusCard: {
    alignItems: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statusDot: {
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  statusReady: {
    backgroundColor: '#34A853',
  },
  statusWaiting: {
    backgroundColor: '#FBBC05',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

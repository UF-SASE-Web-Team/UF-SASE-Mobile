import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from '@/lib/env';

export default function HomePage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusDot,
              isSupabaseConfigured ? styles.statusReady : styles.statusWaiting,
            ]}
          />
          <Text style={styles.statusTitle}>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
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
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});

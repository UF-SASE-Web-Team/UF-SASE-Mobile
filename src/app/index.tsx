import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '@/lib/env';

export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>UF SASE</Text>
        <Text style={styles.title}>Mobile development environment</Text>
        <Text style={styles.description}>
          Expo Router and the Supabase client are installed and ready for feature development.
        </Text>

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusDot,
              isSupabaseConfigured ? styles.statusReady : styles.statusWaiting,
            ]}
          />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Supabase configuration</Text>
            <Text style={styles.statusDescription}>
              {isSupabaseConfigured
                ? 'Development environment variables are loaded.'
                : 'Copy .env.example to .env.local and add the development values.'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071A2B',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  eyebrow: {
    color: '#55D6BE',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  description: {
    color: '#B8C8D8',
    fontSize: 17,
    lineHeight: 25,
  },
  statusCard: {
    alignItems: 'flex-start',
    backgroundColor: '#102A40',
    borderColor: '#234861',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 18,
  },
  statusDot: {
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  statusReady: {
    backgroundColor: '#55D6BE',
  },
  statusWaiting: {
    backgroundColor: '#F4B942',
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    color: '#B8C8D8',
    fontSize: 14,
    lineHeight: 20,
  },
});

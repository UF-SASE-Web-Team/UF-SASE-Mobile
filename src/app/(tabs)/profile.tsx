import { StyleSheet, Text, Button, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
          } catch (error: any) {
            Alert.alert('Sign out failed', error.message ?? 'An unknown error occurred.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Signing out...' : 'Sign Out'}
          color="#dc2626"
          onPress={handleSignOut}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});

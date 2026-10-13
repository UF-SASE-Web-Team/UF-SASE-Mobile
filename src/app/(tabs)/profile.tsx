import { StyleSheet, Text, Button, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? All of your profile data will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const { error } = await supabase.rpc('delete_user_account');
              if (error) {
                Alert.alert(
                  'Account deletion failed',
                  error.message ?? 'An unknown error occurred.',
                );
                return;
              }
              await signOut();
            } catch (error: any) {
              Alert.alert('Account deletion failed', error.message ?? 'An unknown error occurred.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Signing out...' : 'Sign Out'}
          onPress={handleSignOut}
          disabled={loading || deleting}
        />
        <Button
          title={deleting ? 'Deleting account...' : 'Delete Account'}
          color="#dc2626"
          onPress={handleDeleteAccount}
          disabled={loading || deleting}
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
    gap: 8,
  },
});

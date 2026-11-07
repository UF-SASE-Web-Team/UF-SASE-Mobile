import { Stack } from 'expo-router';
import { ProfileProvider } from '@/context/ProfileContext';

export default function ProfileLayout() {
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ProfileProvider>
  );
}

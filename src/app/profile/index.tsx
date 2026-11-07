import { useRouter } from 'expo-router';
import { ProfileScreen, ProfileLoadingState } from '@/components/profile/ProfileScreen';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { useProfile } from '@/context/ProfileContext';

export default function ProfilePage() {
  const { profile } = useProfile();
  const router = useRouter();
  if (!profile) return <ProfileLoadingState />;
  return (
    <ProfileScreen
      onEdit={() => router.push('/profile/edit')}
      footer={
        <ProfileButton title="Account Settings" onPress={() => router.push('/profile/settings')} />
      }
    >
      <ProfileHero profile={profile} />
      <ProfileDetails profile={profile} />
    </ProfileScreen>
  );
}

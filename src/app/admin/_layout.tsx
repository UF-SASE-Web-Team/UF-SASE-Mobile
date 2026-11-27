import { Stack } from 'expo-router';

/** Officer tools. Only reachable by officers (see the root layout's guard). */
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Event {id}</Text>
    </View>
  );
}

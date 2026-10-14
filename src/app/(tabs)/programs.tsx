import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgramsPage() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text>Programs</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

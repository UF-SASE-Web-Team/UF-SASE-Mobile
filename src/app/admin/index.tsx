import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AdminEventRow } from '@/components/admin/AdminEventRow';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { type Colors, space } from '@/theme';

export default function OfficerToolsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { upcoming, past, loading, error, refreshing, refresh } = useAdminEvents();

  const sections = [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter((section) => section.data.length > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <BackButton fallbackRoute="/profile/settings" />
        <Text variant="title" style={styles.headerTitle} accessibilityRole="header">
          Officer Tools
        </Text>
        <Button
          size="sm"
          onPress={() => router.push('/admin/events/new')}
          accessibilityLabel="New event"
        >
          New Event
        </Button>
      </View>

      {loading ? (
        <LoadingState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.surface.saseBlue.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.rowGap} />}
          renderSectionHeader={({ section }) => (
            <Text variant="bodyStrong" style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <AdminEventRow
              event={item}
              onPress={() =>
                router.push({ pathname: '/admin/events/[id]', params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'calendar-outline'}
              tone={error ? 'orange' : 'blue'}
              message={error ?? 'No events yet. Create the first one.'}
              actionLabel={error ? 'Try again' : 'New event'}
              onAction={error ? refresh : () => router.push('/admin/events/new')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface.base.primary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['400'],
    },
    headerTitle: { flex: 1, color: colors.content.onBase.primary },
    listContent: { paddingHorizontal: space['400'], paddingBottom: space['1200'] },
    sectionTitle: {
      color: colors.content.onBase.secondary,
      paddingTop: space['300'],
      paddingBottom: space['200'],
    },
    rowGap: { height: space['200'] },
  });

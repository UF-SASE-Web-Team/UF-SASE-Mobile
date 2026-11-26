import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AddAttendeeSheet } from '@/components/admin/AddAttendeeSheet';
import { AttendanceRowItem } from '@/components/admin/AttendanceRowItem';
import { EventEditorForm } from '@/components/admin/EventEditorForm';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useEventAttendance } from '@/hooks/useEventAttendance';
import { useEventEditor } from '@/hooks/useEventEditor';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { type Colors, space } from '@/theme';

type Tab = 'details' | 'attendance';

const TABS = [
  { value: 'details', label: 'Details' },
  { value: 'attendance', label: 'Attendance' },
] as const;

/** Create (`/admin/events/new`) or manage an event: details and attendance. */
export default function AdminEventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id && id !== 'new' ? id : undefined;
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState<Tab>('details');
  const [adding, setAdding] = useState(false);

  const editor = useEventEditor(eventId);
  const attendance = useEventAttendance(eventId, tab === 'attendance');
  const checkedInIds = useMemo(
    () => new Set(attendance.rows.map((row) => row.user_id).filter((id): id is string => !!id)),
    [attendance.rows],
  );

  const save = async () => {
    const savedId = await editor.save();
    if (!savedId) return;
    if (editor.isNew) {
      router.replace({ pathname: '/admin/events/[id]', params: { id: savedId } });
    } else {
      Alert.alert('Event saved', 'Members will see the changes right away.');
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete event?', 'This removes the event for everyone. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (await editor.remove()) router.back();
        },
      },
    ]);

  const resend = async (checkInId: string) => {
    try {
      const queued = await attendance.resend(checkInId);
      if (!queued) {
        Alert.alert('Form sync is off', 'Turn on the Google Form sync to send check-ins.');
      }
    } catch (cause) {
      Alert.alert('Could not resend', getFriendlyErrorMessage(cause));
    }
  };

  const header = (
    <View style={styles.header}>
      <BackButton fallbackRoute="/admin" />
      <Text variant="title" style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
        {editor.isNew ? 'New Event' : 'Manage Event'}
      </Text>
      {tab === 'details' && editor.draft ? (
        <Button
          size="sm"
          onPress={save}
          loading={editor.busy === 'save'}
          disabled={!!editor.busy}
          accessibilityLabel="Save event"
        >
          Save
        </Button>
      ) : null}
    </View>
  );

  if (editor.loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {header}
        <ErrorState
          error={editor.loadError}
          title="Couldn't load event"
          message={editor.loadError}
        />
      </SafeAreaView>
    );
  }

  if (!editor.draft) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {header}
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {header}
      {!editor.isNew && (
        <View style={styles.tabs}>
          <SegmentedControl
            options={TABS}
            value={tab}
            onChange={setTab}
            testID="admin-event-tabs"
          />
        </View>
      )}

      {tab === 'details' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <EventEditorForm
              draft={editor.draft}
              errors={editor.errors}
              change={editor.change}
              pendingFlyerUri={editor.pendingFlyerUri}
              onPickFlyer={editor.pickFlyer}
              onRemoveFlyer={editor.removeFlyer}
              disabled={!!editor.busy}
            />
            {editor.saveError ? (
              <Text
                variant="bodySm"
                accessibilityRole="alert"
                color={colors.border.danger.primary}
                style={styles.saveError}
              >
                {editor.saveError}
              </Text>
            ) : null}
            {!editor.isNew && (
              <Button
                variant="danger"
                onPress={confirmDelete}
                loading={editor.busy === 'delete'}
                disabled={!!editor.busy}
                style={styles.delete}
              >
                Delete Event
              </Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={attendance.rows}
          keyExtractor={(row) => row.check_in_id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.rowGap} />}
          refreshControl={
            <RefreshControl
              refreshing={attendance.refreshing}
              onRefresh={attendance.refresh}
              tintColor={colors.surface.saseBlue.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.attendanceHeader}>
              <Text variant="bodyStrong" style={styles.flex}>
                {attendance.rows.length} checked in
              </Text>
              <Button size="sm" variant="secondary" onPress={() => setAdding(true)}>
                Add Attendee
              </Button>
            </View>
          }
          ListEmptyComponent={
            attendance.loading ? (
              <LoadingState />
            ) : (
              <EmptyState
                icon={attendance.error ? 'cloud-offline-outline' : 'people-outline'}
                tone={attendance.error ? 'orange' : 'blue'}
                message={attendance.error ?? 'No one has checked in yet.'}
              />
            )
          }
          renderItem={({ item }) => (
            <AttendanceRowItem
              row={item}
              resending={attendance.resending === item.check_in_id}
              onResend={() => resend(item.check_in_id)}
            />
          )}
        />
      )}

      {adding && (
        <AddAttendeeSheet
          visible
          onClose={() => setAdding(false)}
          checkedInIds={checkedInIds}
          onAdd={(member) => attendance.addAttendee(member.id)}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface.base.primary },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['300'],
    },
    headerTitle: { flex: 1, color: colors.content.onBase.primary },
    tabs: { paddingHorizontal: space['400'], paddingBottom: space['300'] },
    content: { paddingHorizontal: space['400'], paddingBottom: space['1200'] },
    saveError: { marginTop: space['300'] },
    delete: { marginTop: space['600'] },
    attendanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingBottom: space['300'],
    },
    rowGap: { height: space['200'] },
  });

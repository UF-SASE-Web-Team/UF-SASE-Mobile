import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { DateTimeField } from '@/components/admin/DateTimeField';
import { EventLinksEditor } from '@/components/admin/EventLinksEditor';
import { EventTypePicker } from '@/components/admin/EventTypePicker';
import { FlyerPicker } from '@/components/admin/FlyerPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { CHECKIN_CODE_LENGTH, MAX_EVENT_POINTS, randomCheckinCode } from '@/lib/eventDraft';
import { space } from '@/theme';
import type { EventDraft } from '@/types/admin';

interface EventEditorFormProps {
  draft: EventDraft;
  errors: Partial<Record<string, string>>;
  change: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  pendingFlyerUri: string | null;
  onPickFlyer: () => void;
  onRemoveFlyer: () => void;
  disabled: boolean;
}

/** A field with a visible label, an "Optional" marker and a short hint under it. */
function Field({
  label,
  optional,
  hint,
  children,
  style,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text variant="bodyStrong">
        {label}
        {optional ? (
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            {'  '}Optional
          </Text>
        ) : null}
      </Text>
      {children}
      {hint ? (
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function EventEditorForm({
  draft,
  errors,
  change,
  pendingFlyerUri,
  onPickFlyer,
  onRemoveFlyer,
  disabled,
}: EventEditorFormProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.form}>
      <Field label="Title" hint="The event name members see in the app.">
        <Input
          accessibilityLabel="Title"
          placeholder="e.g. GBM 5: SASE Olympics"
          value={draft.title}
          onChangeText={(text) => change('title', text)}
          editable={!disabled}
          maxLength={100}
          error={errors.title}
        />
      </Field>

      <EventTypePicker
        value={draft.type}
        onChange={(type) => change('type', type)}
        disabled={disabled}
      />

      <DateTimeField
        label="Starts"
        value={draft.startsAt}
        onChange={(value) => change('startsAt', value)}
        disabled={disabled}
      />
      <DateTimeField
        label="Ends"
        value={draft.endsAt}
        onChange={(value) => change('endsAt', value)}
        error={errors.endsAt}
        disabled={disabled}
      />
      <Text variant="bodySm" color={colors.content.onBase.secondary}>
        Check-in opens 30 minutes before the start and closes 30 minutes after the end.
      </Text>

      <Field label="Location" hint="Shown on the event card, so keep it short.">
        <Input
          accessibilityLabel="Location"
          placeholder="e.g. Reitz Union 2365"
          value={draft.locationName}
          onChangeText={(text) => change('locationName', text)}
          editable={!disabled}
          maxLength={100}
          error={errors.locationName}
        />
      </Field>

      <Field
        label="Address"
        optional
        hint="The full street address. Tapping the location opens it in Maps."
      >
        <Input
          accessibilityLabel="Address"
          placeholder="e.g. 655 Reitz Union Dr, Gainesville, FL 32611"
          value={draft.address}
          onChangeText={(text) => change('address', text)}
          editable={!disabled}
          maxLength={200}
        />
      </Field>

      <Field label="Description" optional hint="What the event is about and what to bring.">
        <Input
          accessibilityLabel="Description"
          placeholder="Tell members what to expect"
          value={draft.description}
          onChangeText={(text) => change('description', text)}
          editable={!disabled}
          multiline
          maxLength={2000}
        />
      </Field>

      <View style={styles.row}>
        <Field
          label="Points"
          hint={`Earned for checking in (0–${MAX_EVENT_POINTS}).`}
          style={styles.half}
        >
          <Input
            accessibilityLabel="Points"
            value={draft.pointsValue}
            onChangeText={(text) => change('pointsValue', text.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            editable={!disabled}
            error={errors.pointsValue}
          />
        </Field>
        <Field
          label="Check-in code"
          hint={`The ${CHECKIN_CODE_LENGTH} digits members type at the event.`}
          style={styles.half}
        >
          <Input
            accessibilityLabel="Check-in code"
            value={draft.checkinCode}
            onChangeText={(text) =>
              change('checkinCode', text.replace(/\D/g, '').slice(0, CHECKIN_CODE_LENGTH))
            }
            keyboardType="number-pad"
            editable={!disabled}
            error={errors.checkinCode}
          />
        </Field>
      </View>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onPress={() => change('checkinCode', randomCheckinCode())}
      >
        New Random Code
      </Button>

      <FlyerPicker
        flyerUrl={draft.flyerUrl}
        pendingUri={pendingFlyerUri}
        onPick={onPickFlyer}
        onRemove={onRemoveFlyer}
        disabled={disabled}
      />
      <EventLinksEditor
        links={draft.links}
        onChange={(links) => change('links', links)}
        errors={errors}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space['500'] },
  field: { gap: space['150'] },
  row: { flexDirection: 'row', gap: space['300'] },
  half: { flex: 1 },
});

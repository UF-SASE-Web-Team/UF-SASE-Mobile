import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { resolveAssetUrl } from '@/lib/assets';
import { type Colors, borderWidth, radius, space } from '@/theme';

interface FlyerPickerProps {
  /** The saved flyer, if any. */
  flyerUrl: string | null;
  /** A newly picked photo that uploads when the event is saved. */
  pendingUri: string | null;
  onPick: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function FlyerPicker({
  flyerUrl,
  pendingUri,
  onPick,
  onRemove,
  disabled,
}: FlyerPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const preview = pendingUri ?? resolveAssetUrl(flyerUrl);

  return (
    <View style={styles.field}>
      <Text variant="bodyStrong">Flyer</Text>
      {preview ? (
        <Image
          source={{ uri: preview }}
          style={styles.preview}
          contentFit="cover"
          accessibilityLabel="Event flyer preview"
        />
      ) : (
        <View style={[styles.preview, styles.empty]}>
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            No flyer
          </Text>
        </View>
      )}
      <View style={styles.actions}>
        <Button size="sm" variant="secondary" onPress={onPick} disabled={disabled}>
          {preview ? 'Change Flyer' : 'Choose Flyer'}
        </Button>
        {preview ? (
          <Button size="sm" variant="ghost" onPress={onRemove} disabled={disabled}>
            Remove
          </Button>
        ) : null}
      </View>
      {pendingUri ? (
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          Uploads when you save.
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    field: { gap: space['150'] },
    preview: {
      width: '100%',
      aspectRatio: 4 / 5,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.secondary,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    actions: { flexDirection: 'row', gap: space['200'] },
  });

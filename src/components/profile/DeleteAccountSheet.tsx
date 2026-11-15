import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ProfileModalSlot } from '@/components/profile/ProfileScreen';
import { useAuth } from '@/context/AuthContext';
import { getProfileError } from '@/context/ProfileContext';
import { deleteAccount } from '@/services/profiles';
import { type Colors, space, useThemedStyles } from '@/theme';

export interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const { signOut } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmation.trim().toLowerCase() === 'confirm';

  const handleClose = () => {
    if (busy) return;
    setConfirmation('');
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      await signOut();
      onClose();
    } catch (cause) {
      setError(getProfileError(cause, 'Account deletion failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileModalSlot>
      <ModalSheet
        visible={visible}
        onClose={handleClose}
        title="Delete Account"
        busy={busy}
        testID="delete-account-sheet"
      >
        <View style={styles.container}>
          <Text variant="body" style={styles.description}>
            This will permanently delete your account, event attendance, and profile data. You will
            be immediately signed out and this data cannot be recovered.
          </Text>

          <View style={styles.inputSection}>
            <Text variant="body" style={styles.instruction}>
              To confirm deletion, please type <Text variant="bodyStrong">confirm</Text> below:
            </Text>
            <Input
              accessibilityLabel="Type confirm to delete account"
              placeholder="confirm"
              value={confirmation}
              onChangeText={(text) => {
                setConfirmation(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          </View>

          {error && (
            <Text variant="bodySm" accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              variant="danger"
              size="md"
              onPress={handleDelete}
              loading={busy}
              disabled={!isConfirmed || busy}
              accessibilityLabel="Delete Account"
              testID="delete-account-confirm-button"
            >
              Delete Account
            </Button>
            <Button
              variant="ghost"
              size="md"
              onPress={handleClose}
              disabled={busy}
              accessibilityLabel="Cancel"
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </ModalSheet>
    </ProfileModalSlot>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      gap: space['400'],
      paddingTop: space['200'],
    },
    description: {
      color: colors.content.onBase.secondary,
    },
    inputSection: {
      gap: space['200'],
    },
    instruction: {
      color: colors.content.onBase.primary,
    },
    errorText: {
      color: colors.border.danger.primary,
      textAlign: 'center',
    },
    actions: {
      gap: space['150'],
    },
    cancelButton: {
      paddingVertical: space['150'],
    },
  });

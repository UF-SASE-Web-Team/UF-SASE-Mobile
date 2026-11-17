import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { submitAppFeedback, type FeedbackCategory } from '@/services/feedback';
import { useTheme, useThemedStyles, type Colors, fonts, iconSize, space } from '@/theme';

const categories: SegmentedControlOption<FeedbackCategory>[] = [
  { value: 'bug', label: 'Bug', icon: 'bug-outline' },
  { value: 'feature', label: 'Feature', icon: 'bulb-outline' },
  { value: 'general', label: 'General', icon: 'chatbox-ellipses-outline' },
];

const maxMessageLength = 300;

interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function FeedbackSheet({ visible, onClose, userId }: FeedbackSheetProps) {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const resetState = () => {
    setMessage('');
    setCategory('bug');
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim() || busy) return;
    setBusy(true);
    setError(null);

    try {
      await submitAppFeedback({
        userId,
        category,
        message,
      });
      setSubmitted(true);
    } catch (cause) {
      setError(getFriendlyErrorMessage(cause, 'Could not send feedback. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalSheet
      title={submitted ? 'Feedback Sent' : 'Send Feedback'}
      visible={visible}
      onClose={handleClose}
      busy={busy}
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {submitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Ionicons
                  name="checkmark-circle"
                  size={iconSize.lg}
                  color={colors.content.onBase.brand}
                />
              </View>
              <Text variant="title" style={styles.successTitle}>
                Thank you!
              </Text>
              <Text
                variant="body"
                color={colors.content.onBase.secondary}
                style={styles.successSubtitle}
              >
                Your feedback has been sent directly to the UF SASE dev team. We appreciate your
                help improving the app!
              </Text>
              <Button onPress={handleClose} variant="primary" size="md" style={styles.actionButton}>
                Done
              </Button>
            </View>
          ) : (
            <>
              {/* Category Segmented Control */}
              <SegmentedControl
                options={categories}
                value={category}
                onChange={setCategory}
                disabled={busy}
                accessibilityRole="tab"
              />

              {/* Message Input */}
              <View style={styles.inputWrapper}>
                <Input
                  accessibilityLabel="Feedback message"
                  placeholder=""
                  value={message}
                  onChangeText={setMessage}
                  maxLength={maxMessageLength}
                  editable={!busy}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                />
                <Text
                  variant="bodySm"
                  color={colors.content.onBase.secondary}
                  style={styles.charCount}
                >
                  {message.length}/{maxMessageLength}
                </Text>
              </View>

              {error && (
                <Text variant="bodySm" color={colors.surface.danger.primary}>
                  {error}
                </Text>
              )}

              <Button
                onPress={handleSubmit}
                variant="primary"
                size="md"
                loading={busy}
                disabled={!message.trim() || busy}
                style={styles.actionButton}
              >
                {busy ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      gap: space['250'],
      paddingBottom: 0,
    },
    inputWrapper: {
      gap: space['050'],
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      alignSelf: 'flex-end',
      fontFamily: fonts.sans.regular,
    },
    actionButton: {
      marginTop: 0,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: space['600'],
      gap: space['300'],
    },
    successIconWrapper: {
      marginBottom: space['200'],
    },
    successTitle: {
      textAlign: 'center',
    },
    successSubtitle: {
      textAlign: 'center',
      paddingHorizontal: space['400'],
    },
  });

import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { recordCheckInAndMaybeRequestReview } from '@/lib/storeReview';
import { ufEmailFromLogin } from '@/lib/ufEmail';
import { checkInToEvent, hasCheckedInThisSchoolYear } from '@/services/events';

export interface UseEventCheckInOptions {
  eventId: string;
  pointsValue: number;
  initialMode?: 'code' | 'qr';
  /** Whether the check-in UI is showing. Opening it rechecks the attendance question. */
  visible?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Whether to ask "attended a SASE event this school year?" before check-in.
 * The answer is sent to the SASE Google check-in form; members who already
 * checked in this school year are never asked.
 */
type AttendanceQuestion = 'checking' | 'ask' | 'skip';

export function useEventCheckIn({
  eventId,
  pointsValue,
  initialMode = 'qr',
  visible = true,
  onSuccess,
  onClose,
}: UseEventCheckInOptions) {
  const { user } = useAuth();
  const { ufEmail } = useProfile();
  const router = useRouter();
  const userId = user?.id;

  const [mode, setMode] = useState<'code' | 'qr'>(initialMode);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [attendanceQuestion, setAttendanceQuestion] = useState<AttendanceQuestion>('checking');
  const [attendedThisYear, setAttendedThisYear] = useState<boolean | null>(null);

  // Each time check-in opens, ask only if the member has no check-in this school year.
  // Closing and succeeding reset the question (see resetAttendance), so this only
  // records the lookup result.
  useEffect(() => {
    if (!visible || !userId) return;
    let active = true;
    // Wrapped so a synchronous throw is handled like a failed lookup.
    Promise.resolve()
      .then(() => hasCheckedInThisSchoolYear())
      .then((checkedIn) => {
        if (active) setAttendanceQuestion(checkedIn === false ? 'ask' : 'skip');
      })
      .catch(() => {
        // Never block check-in on this lookup; the server treats no answer as "No".
        if (active) setAttendanceQuestion('skip');
      });
    return () => {
      active = false;
    };
  }, [visible, userId]);

  const resetAttendance = () => {
    setAttendedThisYear(null);
    setAttendanceQuestion('checking');
  };

  const needsAttendanceAnswer = attendanceQuestion === 'ask' && attendedThisYear === null;
  const answerAttendance = (answer: boolean) => setAttendedThisYear(answer);
  const attendedAnswer = attendedThisYear ?? undefined;

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  // The review prompt waits for the alert to be dismissed so the two never stack.
  const showCheckInSuccess = () => {
    const pointsMessage = `You've gained +${pointsValue} points.`;
    const afterDismiss = () => void recordCheckInAndMaybeRequestReview();
    // First-time attendees sign up through the SASE form, which needs a UF email.
    const needsUfEmail = attendedThisYear === false && !ufEmail && !ufEmailFromLogin(user?.email);
    if (needsUfEmail) {
      Alert.alert(
        'Check-in successful!',
        `${pointsMessage}\n\nAdd your UF email to your profile so this check-in also counts on the SASE sign-in form.`,
        [
          { text: 'Later', style: 'cancel', onPress: afterDismiss },
          { text: 'Add UF email', onPress: () => router.push('/profile/edit') },
        ],
      );
      return;
    }
    Alert.alert('Check-in successful!', pointsMessage, [{ text: 'OK', onPress: afterDismiss }]);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    setCheckInCode('');
    setCheckInError(null);
    hasScannedRef.current = false;
    setMode(initialMode);
    resetAttendance();
    onClose?.();
  };

  const handleModeChange = (newMode: 'code' | 'qr') => {
    if (isSubmitting || mode === newMode) return;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    setCheckInError(null);
    hasScannedRef.current = false;
    setMode(newMode);
  };

  const handleCheckInSubmit = async (codeToSubmit: string) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }
    if (!eventId || codeToSubmit.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setCheckInError(null);

    try {
      await checkInToEvent(eventId, codeToSubmit, 'code', attendedAnswer);
      setCheckInCode('');
      onSuccess?.();
      onClose?.();
      showCheckInSuccess();
      resetAttendance();
    } catch (err: any) {
      setCheckInError(err.message || 'Invalid check-in code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isSubmitting || hasScannedRef.current) return;
    if (!data || typeof data !== 'string') return;

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }

    hasScannedRef.current = true;
    setIsSubmitting(true);
    setCheckInError(null);

    const trimmed = data.trim();
    let method: 'code' | 'qr' = 'qr';
    let payload = trimmed;

    if (/^\d{6}$/.test(trimmed)) {
      method = 'code';
      payload = trimmed;
    } else {
      try {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get('code');
        if (codeParam && /^\d{6}$/.test(codeParam.trim())) {
          method = 'code';
          payload = codeParam.trim();
        }
      } catch {
        // Not a URL with query params; treat as direct QR payload
      }
    }

    try {
      await checkInToEvent(eventId, payload, method, attendedAnswer);
      onSuccess?.();
      onClose?.();
      showCheckInSuccess();
      resetAttendance();
    } catch (err: any) {
      setCheckInError(err.message || 'Invalid QR code. Please try again.');
      // Cooldown for 2.5 seconds before allowing another scan attempt
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
      cooldownTimeoutRef.current = setTimeout(() => {
        hasScannedRef.current = false;
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode,
    setMode: handleModeChange,
    handleModeChange,
    checkInCode,
    setCheckInCode,
    checkInError,
    setCheckInError,
    isSubmitting,
    permission,
    requestPermission,
    handleCheckInSubmit,
    handleBarcodeScanned,
    handleClose,
    isCheckingAttendance: visible && !!userId && attendanceQuestion === 'checking',
    needsAttendanceAnswer,
    answerAttendance,
  };
}

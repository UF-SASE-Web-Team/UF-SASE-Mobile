import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/context/AuthContext';
import { recordCheckInAndMaybeRequestReview } from '@/lib/storeReview';
import { checkInToEvent } from '@/services/events';

export interface UseEventCheckInOptions {
  eventId: string;
  pointsValue: number;
  initialMode?: 'code' | 'qr';
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useEventCheckIn({
  eventId,
  pointsValue,
  initialMode = 'qr',
  onSuccess,
  onClose,
}: UseEventCheckInOptions) {
  const { user } = useAuth();

  const [mode, setMode] = useState<'code' | 'qr'>(initialMode);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    Alert.alert('Check-in successful!', `You've gained +${pointsValue} points.`, [
      { text: 'OK', onPress: () => void recordCheckInAndMaybeRequestReview() },
    ]);
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
      await checkInToEvent(eventId, codeToSubmit);
      setCheckInCode('');
      onSuccess?.();
      onClose?.();
      showCheckInSuccess();
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
      await checkInToEvent(eventId, payload, method);
      onSuccess?.();
      onClose?.();
      showCheckInSuccess();
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
  };
}

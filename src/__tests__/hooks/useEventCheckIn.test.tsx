import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { useEventCheckIn, type UseEventCheckInOptions } from '@/hooks/useEventCheckIn';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';
import { useCameraPermissions } from 'expo-camera';

jest.mock('@/services/events');
jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
}));

function TestConsumer({ options }: { options: UseEventCheckInOptions }) {
  const hook = useEventCheckIn(options);

  return (
    <View>
      <Text testID="mode">{hook.mode}</Text>
      <Text testID="code">{hook.checkInCode}</Text>
      <Text testID="error">{hook.checkInError ?? 'no-error'}</Text>
      <Text testID="submitting">{String(hook.isSubmitting)}</Text>
      <TouchableOpacity testID="switch-to-code" onPress={() => hook.handleModeChange('code')} />
      <TouchableOpacity testID="set-code" onPress={() => hook.setCheckInCode('123456')} />
      <TouchableOpacity testID="set-error" onPress={() => hook.setCheckInError('Manual error')} />
      <TouchableOpacity testID="close" onPress={hook.handleClose} />
      <TouchableOpacity testID="submit-valid" onPress={() => hook.handleCheckInSubmit('123456')} />
      <TouchableOpacity
        testID="scan-url"
        onPress={() =>
          hook.handleBarcodeScanned({ data: 'https://ufsase.com/checkin?code=654321' })
        }
      />
    </View>
  );
}

describe('useEventCheckIn', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });
  const defaultOptions: UseEventCheckInOptions = {
    eventId: 'event-123',
    pointsValue: 2,
    initialMode: 'qr',
    onSuccess: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true, canAskAgain: true, status: 'granted' },
      mockRequestPermission,
    ]);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(async () => {
    await cleanup();
  });

  it('initializes with default options and supports mode switching', async () => {
    const user = userEvent.setup();
    await render(<TestConsumer options={defaultOptions} />);

    expect(screen.getByTestId('mode').props.children).toBe('qr');
    expect(screen.getByTestId('code').props.children).toBe('');
    expect(screen.getByTestId('error').props.children).toBe('no-error');
    expect(screen.getByTestId('submitting').props.children).toBe('false');

    await user.press(screen.getByTestId('switch-to-code'));
    expect(screen.getByTestId('mode').props.children).toBe('code');
  });

  it('clears error and resets state on handleClose', async () => {
    const user = userEvent.setup();
    await render(<TestConsumer options={defaultOptions} />);

    await user.press(screen.getByTestId('set-code'));
    expect(screen.getByTestId('code').props.children).toBe('123456');

    await user.press(screen.getByTestId('set-error'));
    expect(screen.getByTestId('error').props.children).toBe('Manual error');

    await user.press(screen.getByTestId('close'));
    expect(screen.getByTestId('code').props.children).toBe('');
    expect(screen.getByTestId('error').props.children).toBe('no-error');
    expect(defaultOptions.onClose).toHaveBeenCalledTimes(1);
  });

  it('submits valid code successfully', async () => {
    (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
    const user = userEvent.setup();
    await render(<TestConsumer options={defaultOptions} />);

    await user.press(screen.getByTestId('submit-valid'));

    expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '123456');
    expect(defaultOptions.onSuccess).toHaveBeenCalledTimes(1);
    expect(defaultOptions.onClose).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Check-in successful!', "You've gained +2 points.");
  });

  it('parses URL with code param and submits as code method', async () => {
    (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
    const user = userEvent.setup();
    await render(<TestConsumer options={defaultOptions} />);

    await user.press(screen.getByTestId('scan-url'));

    expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '654321', 'code');
    expect(defaultOptions.onSuccess).toHaveBeenCalledTimes(1);
    expect(defaultOptions.onClose).toHaveBeenCalledTimes(1);
  });
});

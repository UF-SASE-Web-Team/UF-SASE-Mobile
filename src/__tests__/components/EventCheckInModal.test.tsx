import React from 'react';
import { Alert } from 'react-native';
import { render, screen, userEvent, cleanup, waitFor, act } from '@testing-library/react-native';
import { EventCheckInModal } from '@/components/events/EventCheckInModal';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';
import { CameraView, useCameraPermissions } from 'expo-camera';

jest.mock('@/services/events');

async function renderModal(props: Partial<React.ComponentProps<typeof EventCheckInModal>> = {}) {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    eventId: 'event-123',
    eventTitle: 'GBM 2',
    pointsValue: 1,
    onSuccess: jest.fn(),
    ...props,
  };

  const result = await render(
    <ThemeProvider>
      <EventCheckInModal {...defaultProps} />
    </ThemeProvider>,
  );

  return {
    ...result,
    props: defaultProps,
  };
}

describe('EventCheckInModal', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });

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

  describe('Code Mode', () => {
    it('switches to Code mode and renders input when Code tab is selected', async () => {
      const user = userEvent.setup();
      await renderModal();

      const codeTab = screen.getByRole('tab', { name: '6-Digit Code' });
      await user.press(codeTab);

      expect(codeTab.props.accessibilityState.selected).toBe(true);
      expect(screen.getByLabelText('6-digit verification code')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Submit code' })).toBeTruthy();
    }, 15000);

    it('calls onClose when Cancel button is pressed', async () => {
      const user = userEvent.setup();
      const { props } = await renderModal();

      const cancelBtn = screen.getByText('Cancel');
      await user.press(cancelBtn);

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is pressed', async () => {
      const user = userEvent.setup();
      const { props } = await renderModal();

      const backdrop = screen.getByLabelText('Close modal');
      await user.press(backdrop);

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('submits 6-digit code, calls checkInToEvent, calls onSuccess, and closes', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();
      const { props } = await renderModal();

      await user.press(screen.getByText('Code'));

      const input = screen.getByDisplayValue('');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '123456');
      });

      expect(props.onSuccess).toHaveBeenCalledTimes(1);
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Check-in successful!', "You've gained +1 points.");
    });

    it('shows error message when checkInToEvent fails', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockRejectedValue(
        new Error('Invalid check-in code.'),
      );
      const user = userEvent.setup();
      await renderModal();

      await user.press(screen.getByText('Code'));

      const input = screen.getByDisplayValue('');
      await user.type(input, '000000');

      expect(await screen.findByText('Invalid check-in code.')).toBeTruthy();
    });

    it('prompts sign in when user is not logged in', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const user = userEvent.setup();
      await renderModal();

      await user.press(screen.getByText('Code'));

      const input = screen.getByDisplayValue('');
      await user.type(input, '123456');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign in required',
        'Please sign in to check in to events.',
      );
      expect(eventsService.checkInToEvent).not.toHaveBeenCalled();
    });
  });

  describe('QR Mode', () => {
    it('renders camera view by default when permission granted', async () => {
      await renderModal();

      expect(screen.getByText(/Scan the QR code/i)).toBeTruthy();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
      // In QR mode, submit button is hidden
      expect(screen.queryByText('Submit')).toBeNull();
    });

    it('displays permission prompt when camera permission is not granted', async () => {
      (useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: false, canAskAgain: true, status: 'denied' },
        mockRequestPermission,
      ]);
      const user = userEvent.setup();
      await renderModal();

      expect(screen.getByText('Camera permission is required to scan QR codes.')).toBeTruthy();

      const enableBtn = screen.getByText('Enable Camera');
      await user.press(enableBtn);
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('handles QR scan with arbitrary URL payload using qr method', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();
      const { props } = await renderModal();

      await user.press(screen.getByText('Scan QR'));

      const cameraProps = (CameraView as unknown as jest.Mock).mock.calls.at(-1)?.[0];
      expect(cameraProps).toBeDefined();

      await act(async () => {
        cameraProps.onBarcodeScanned({ data: 'https://ufsase.com/checkin-secret' });
      });

      expect(eventsService.checkInToEvent).toHaveBeenCalledWith(
        'event-123',
        'https://ufsase.com/checkin-secret',
        'qr',
      );
      expect(props.onSuccess).toHaveBeenCalledTimes(1);
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Check-in successful!', "You've gained +1 points.");
    });

    it('handles QR scan with 6-digit code payload using code method', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();
      const { props } = await renderModal();

      await user.press(screen.getByText('Scan QR'));

      const cameraProps = (CameraView as unknown as jest.Mock).mock.calls.at(-1)?.[0];

      await act(async () => {
        cameraProps.onBarcodeScanned({ data: '654321' });
      });

      expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '654321', 'code');
      expect(props.onSuccess).toHaveBeenCalledTimes(1);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles QR scan with URL containing code param using code method', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();
      const { props } = await renderModal();

      await user.press(screen.getByText('Scan QR'));

      const cameraProps = (CameraView as unknown as jest.Mock).mock.calls.at(-1)?.[0];

      await act(async () => {
        cameraProps.onBarcodeScanned({ data: 'https://ufsase.com/checkin?code=987654' });
      });

      expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '987654', 'code');
      expect(props.onSuccess).toHaveBeenCalledTimes(1);
    });

    it('throttles rapid duplicate scans when check-in fails', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockRejectedValue(new Error('Invalid QR code.'));
      const user = userEvent.setup();
      await renderModal();

      await user.press(screen.getByText('Scan QR'));

      const cameraProps = (CameraView as unknown as jest.Mock).mock.calls.at(-1)?.[0];

      await act(async () => {
        cameraProps.onBarcodeScanned({ data: 'https://invalid-qr' });
      });

      expect(eventsService.checkInToEvent).toHaveBeenCalledTimes(1);

      // Attempt immediate second scan during cooldown
      await act(async () => {
        cameraProps.onBarcodeScanned({ data: 'https://invalid-qr' });
      });

      // Should not call checkInToEvent again immediately
      expect(eventsService.checkInToEvent).toHaveBeenCalledTimes(1);
    });

    it('shows error message when QR check-in fails', async () => {
      (eventsService.checkInToEvent as jest.Mock).mockRejectedValue(new Error('Invalid QR code.'));
      const user = userEvent.setup();
      await renderModal();

      await user.press(screen.getByText('Scan QR'));

      const cameraProps = (CameraView as unknown as jest.Mock).mock.calls.at(-1)?.[0];

      await act(async () => {
        cameraProps.onBarcodeScanned({ data: 'https://invalid-qr' });
      });

      expect(await screen.findByText('Invalid QR code.')).toBeTruthy();
    });
  });
});

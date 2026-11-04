import React from 'react';
import { Alert } from 'react-native';
import { render, screen, userEvent, cleanup, waitFor } from '@testing-library/react-native';
import { EventCheckInModal } from '@/components/EventCheckInModal';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';

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

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders modal with title, subtitle, and input when visible', async () => {
    await renderModal();

    expect(screen.getByText('Event Check-in')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code provided at the event.')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Submit')).toBeTruthy();
  });

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

    const input = screen.getByDisplayValue('');
    await user.type(input, '123456');

    await waitFor(() => {
      expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-123', '123456');
    });

    expect(props.onSuccess).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Checked In!',
      'You have successfully checked in to GBM 2! +1 points earned.',
    );
  });

  it('shows error message when checkInToEvent fails', async () => {
    (eventsService.checkInToEvent as jest.Mock).mockRejectedValue(
      new Error('Invalid check-in code.'),
    );
    const user = userEvent.setup();
    await renderModal();

    const input = screen.getByDisplayValue('');
    await user.type(input, '000000');

    expect(await screen.findByText('Invalid check-in code.')).toBeTruthy();
  });

  it('prompts sign in when user is not logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    const user = userEvent.setup();
    await renderModal();

    const input = screen.getByDisplayValue('');
    await user.type(input, '123456');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign in required',
      'Please sign in to check in to events.',
    );
    expect(eventsService.checkInToEvent).not.toHaveBeenCalled();
  });
});

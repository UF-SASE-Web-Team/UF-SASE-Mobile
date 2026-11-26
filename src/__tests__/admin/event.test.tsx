import { Alert } from 'react-native';
import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AdminEventPage from '@/app/admin/events/[id]';
import { ThemeProvider } from '@/context/ThemeContext';
import * as adminService from '@/services/admin';
import { getEvent, getEventCheckinCode } from '@/services/events';
import type { AttendanceRow } from '@/types/admin';

jest.mock('@/services/admin');
jest.mock('@/services/events');
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const existingEvent = {
  id: 'event-1',
  title: 'GBM 4',
  type: 'gbm',
  starts_at: '2026-11-18T23:00:00Z',
  ends_at: '2026-11-19T01:00:00Z',
  location_name: 'Reitz Union',
  address: null,
  description: null,
  points_value: 1,
  flyer_url: null,
  rsvp: null,
  links: [],
};

const attendance: AttendanceRow[] = [
  {
    check_in_id: 'ci-1',
    user_id: 'bob',
    full_name: 'Bob Gator',
    username: 'bob',
    avatar_url: 'sase-cat',
    method: 'code',
    checked_in_at: '2026-11-18T23:10:00Z',
    form_status: 'failed',
    form_submit_error: 'missing_uf_email',
  },
];

describe('Officer event management', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  const renderPage = () =>
    render(
      <ThemeProvider initialMode="light">
        <AdminEventPage />
      </ThemeProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(async () => {
    await cleanup();
  });

  describe('a new event', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'new' });
    });

    it('does not save until the required fields are filled', async () => {
      const user = userEvent.setup();
      await renderPage();
      await user.press(screen.getByRole('button', { name: 'Save event' }));
      expect(adminService.saveEvent).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Title')).toHaveProp('aria-invalid', true);
      expect(screen.getByLabelText('Location')).toHaveProp('aria-invalid', true);
    });

    it('creates the event and opens it for managing', async () => {
      (adminService.saveEvent as jest.Mock).mockResolvedValue('event-9');
      const user = userEvent.setup();
      await renderPage();
      await user.type(screen.getByLabelText('Title'), 'GBM 5');
      await user.type(screen.getByLabelText('Location'), 'Reitz Union');
      await user.press(screen.getByRole('radio', { name: 'Social' }));
      await user.press(screen.getByRole('button', { name: 'Add Link' }));
      await user.type(screen.getByLabelText('Link 1 title'), 'RSVP');
      await user.type(screen.getByLabelText('Link 1 URL'), 'forms.gle/abc');
      await user.press(screen.getByRole('checkbox', { name: 'Use link 1 for RSVP' }));
      await user.press(screen.getByRole('button', { name: 'Save event' }));

      await waitFor(() =>
        expect(adminService.saveEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'GBM 5',
            locationName: 'Reitz Union',
            type: 'social',
            links: [{ title: 'RSVP', url: 'forms.gle/abc', isRsvp: true }],
          }),
          undefined,
        ),
      );
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/admin/events/[id]',
        params: { id: 'event-9' },
      });
      // A new event has no attendance yet.
      expect(screen.queryByRole('tab', { name: 'Attendance' })).toBeNull();
    });
  });

  describe('an existing event', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'event-1' });
      (getEvent as jest.Mock).mockResolvedValue(existingEvent);
      (getEventCheckinCode as jest.Mock).mockResolvedValue('424242');
      (adminService.getEventAttendance as jest.Mock).mockResolvedValue(attendance);
    });

    it('saves edits to the same event', async () => {
      (adminService.saveEvent as jest.Mock).mockResolvedValue('event-1');
      const user = userEvent.setup();
      await renderPage();
      const title = await screen.findByLabelText('Title');
      await user.clear(title);
      await user.type(title, 'GBM 4: SASECraft');
      await user.press(screen.getByRole('button', { name: 'Save event' }));
      await waitFor(() =>
        expect(adminService.saveEvent).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'GBM 4: SASECraft', checkinCode: '424242' }),
          'event-1',
        ),
      );
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('shows why a delete was refused', async () => {
      (adminService.deleteEvent as jest.Mock).mockRejectedValue(
        new Error("Members have already checked in to this event, so it can't be deleted."),
      );
      const user = userEvent.setup();
      await renderPage();
      await user.press(await screen.findByRole('button', { name: 'Delete Event' }));
      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
      await act(async () => {
        await buttons.find((b: { text: string }) => b.text === 'Delete').onPress();
      });
      expect(adminService.deleteEvent).toHaveBeenCalledWith('event-1');
      expect(await screen.findByRole('alert')).toHaveTextContent(/already checked in/);
      expect(router.back).not.toHaveBeenCalled();
    });

    it('lists attendance and resends a skipped form', async () => {
      (adminService.resendCheckInForm as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();
      await renderPage();
      await user.press(await screen.findByRole('tab', { name: 'Attendance' }));
      await user.press(await screen.findByRole('button', { name: 'Resend form for Bob Gator' }));
      expect(adminService.resendCheckInForm).toHaveBeenCalledWith('ci-1');
      await waitFor(() => expect(adminService.getEventAttendance).toHaveBeenCalledTimes(2));
    });

    it('checks a member in by hand', async () => {
      (adminService.searchMembers as jest.Mock).mockResolvedValue([
        { id: 'bob', fullName: 'Bob Gator', username: 'bob', avatarUrl: null },
        { id: 'alice', fullName: 'Alice Gator', username: 'alice', avatarUrl: null },
      ]);
      (adminService.officerCheckIn as jest.Mock).mockResolvedValue(undefined);
      const user = userEvent.setup();
      await renderPage();
      await user.press(await screen.findByRole('tab', { name: 'Attendance' }));
      await user.press(await screen.findByRole('button', { name: 'Add Attendee' }));
      await user.type(screen.getByLabelText('Search members'), 'gator');

      // Bob is already checked in, so only Alice can be added.
      expect(
        await screen.findByRole('button', { name: 'Bob Gator, already checked in' }),
      ).toBeDisabled();
      await user.press(screen.getByRole('button', { name: 'Check in Alice Gator' }));
      expect(adminService.officerCheckIn).toHaveBeenCalledWith('event-1', 'alice');
    });
  });
});

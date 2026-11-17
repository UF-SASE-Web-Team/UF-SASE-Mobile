import React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { ErrorState } from '@/components/ui/ErrorState';
import { ThemeProvider } from '@/context/ThemeContext';

async function renderError(props?: React.ComponentProps<typeof ErrorState>) {
  return await render(
    <ThemeProvider>
      <ErrorState {...props} />
    </ThemeProvider>,
  );
}

describe('ErrorState', () => {
  it('renders default title and fallback message', async () => {
    await renderError();

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(
      screen.getByText('We encountered an error loading this information. Please try again.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('sanitizes technical error messages to user-friendly copy', async () => {
    const rawError =
      'fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)';

    await renderError({ error: rawError, title: 'Could not load data' });

    expect(screen.getByText('Could not load data')).toBeTruthy();
    expect(
      screen.getByText(
        'Unable to connect to SASE servers. Please check your internet connection and try again.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(rawError)).toBeNull();
  });

  it('renders custom title, message, and executes retry action on press', async () => {
    const onRetryMock = jest.fn();
    const user = userEvent.setup();

    await renderError({
      title: "Couldn't load events",
      message: 'Please try again later.',
      onRetry: onRetryMock,
      actionLabel: 'Reload events',
    });

    expect(screen.getByText("Couldn't load events")).toBeTruthy();
    expect(screen.getByText('Please try again later.')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: 'Reload events' });
    await user.press(retryBtn);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('renders children elements and supports scrollable=false', async () => {
    await renderError({
      title: 'Profile unavailable',
      scrollable: false,
      children: <Text testID="custom-child">Back to Safety</Text>,
    });

    expect(screen.getByText('Profile unavailable')).toBeTruthy();
    expect(screen.getByTestId('custom-child')).toBeTruthy();
  });

  it('renders loading state on retry button when isRetrying is true without top refresh control', async () => {
    await renderError({
      title: 'Failed to load',
      onRetry: jest.fn(),
      isRetrying: true,
    });

    const retryBtn = screen.getByRole('button', { name: 'Try again' });
    expect(retryBtn.props.accessibilityState).toEqual({ busy: true, disabled: true });
  });
});

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThemeProvider } from '@/context/ThemeContext';

describe('EmptyState', () => {
  it('calls onAction when the action button is pressed', async () => {
    const onAction = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <EmptyState
          icon="calendar-outline"
          message="Nothing here"
          actionLabel="Browse events"
          onAction={onAction}
        />
      </ThemeProvider>,
    );

    await user.press(screen.getByRole('button', { name: 'Browse events' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders no button when no action is provided', async () => {
    await render(
      <ThemeProvider>
        <EmptyState icon="calendar-outline" message="Nothing here" />
      </ThemeProvider>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { CheckedInBadge } from '@/components/events/CheckedInBadge';
import { ThemeProvider } from '@/context/ThemeContext';

function renderBadge(props: React.ComponentProps<typeof CheckedInBadge> = {}) {
  return render(
    <ThemeProvider>
      <CheckedInBadge {...props} />
    </ThemeProvider>,
  );
}

describe('CheckedInBadge', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders Checked in text and accessibility label with subtle variant by default', async () => {
    await renderBadge();

    expect(screen.getByText('Checked in')).toBeTruthy();
    expect(screen.getByLabelText('Checked in')).toBeTruthy();
    expect(screen.getByTestId('checked-in-badge')).toBeTruthy();
  });

  it('renders with onMedia variant and custom testID', async () => {
    await renderBadge({ variant: 'onMedia', testID: 'happening-now-checked-in-badge' });

    expect(screen.getByText('Checked in')).toBeTruthy();
    expect(screen.getByTestId('happening-now-checked-in-badge')).toBeTruthy();
  });
});

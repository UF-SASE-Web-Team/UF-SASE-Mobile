import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { ThemeProvider } from '@/context/ThemeContext';

async function renderLoading(props?: React.ComponentProps<typeof LoadingState>) {
  return await render(
    <ThemeProvider>
      <LoadingState {...props} />
    </ThemeProvider>,
  );
}

describe('LoadingState', () => {
  it('renders with default accessibility label and testID', async () => {
    await renderLoading();

    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders with custom accessibility label', async () => {
    await renderLoading({ accessibilityLabel: 'Loading profile' });

    expect(screen.getByLabelText('Loading profile')).toBeTruthy();
  });
});

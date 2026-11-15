import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { Pill } from '@/components/ui/Pill';
import { ThemeProvider } from '@/context/ThemeContext';

function renderPill(props: React.ComponentProps<typeof Pill>) {
  return render(
    <ThemeProvider>
      <Pill {...props} />
    </ThemeProvider>,
  );
}

describe('Pill', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders label and accessible element', async () => {
    await renderPill({ label: 'Test Label' });

    expect(screen.getByText('Test Label')).toBeTruthy();
    expect(screen.getByLabelText('Test Label')).toBeTruthy();
  });

  it('renders custom accessibility label when provided', async () => {
    await renderPill({ label: 'GBM', accessibilityLabel: 'Category: GBM' });

    expect(screen.getByLabelText('Category: GBM')).toBeTruthy();
  });

  it('renders with subtle variant and tone', async () => {
    await renderPill({
      label: 'Checked in',
      icon: 'checkmark-circle',
      tone: 'green',
      variant: 'subtle',
      testID: 'subtle-pill',
    });

    expect(screen.getByTestId('subtle-pill')).toBeTruthy();
    expect(screen.getByText('Checked in')).toBeTruthy();
  });

  it('renders with onMedia variant', async () => {
    await renderPill({
      label: 'On Media',
      variant: 'onMedia',
      testID: 'on-media-pill',
    });

    expect(screen.getByTestId('on-media-pill')).toBeTruthy();
    expect(screen.getByText('On Media')).toBeTruthy();
  });
});

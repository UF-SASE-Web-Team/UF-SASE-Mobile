import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ThemeProvider } from '@/context/ThemeContext';

const OPTIONS = [
  { label: 'First', value: 'first' },
  { label: 'Second', value: 'second' },
] as const;

function renderControl(onChange = jest.fn()) {
  return render(
    <ThemeProvider>
      <SegmentedControl options={OPTIONS} value="first" onChange={onChange} />
    </ThemeProvider>,
  );
}

describe('SegmentedControl', () => {
  it('marks only the active option as selected', async () => {
    await renderControl();

    expect(screen.getByRole('tab', { name: 'First' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByRole('tab', { name: 'Second' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('reports the newly chosen option', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderControl(onChange);

    await user.press(screen.getByRole('tab', { name: 'Second' }));

    expect(onChange).toHaveBeenCalledWith('second');
  });

  it('ignores presses on the option that is already selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderControl(onChange);

    await user.press(screen.getByRole('tab', { name: 'First' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

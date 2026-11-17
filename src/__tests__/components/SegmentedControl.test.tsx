import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl';
import { ThemeProvider } from '@/context/ThemeContext';

describe('SegmentedControl', () => {
  const options: SegmentedControlOption<'opt1' | 'opt2' | 'opt3'>[] = [
    { value: 'opt1', label: 'Option 1', icon: 'star' },
    { value: 'opt2', label: 'Option 2', icon: 'heart' },
    { value: 'opt3', label: 'Option 3' },
  ];

  it('renders all options with appropriate labels and roles', async () => {
    const onChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl options={options} value="opt1" onChange={onChange} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Option 1' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Option 2' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Option 3' })).toBeTruthy();
  });

  it('calls onChange when an option is pressed', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl options={options} value="opt1" onChange={onChange} />
      </ThemeProvider>,
    );

    await user.press(screen.getByRole('tab', { name: 'Option 2' }));
    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl options={options} value="opt1" onChange={onChange} disabled />
      </ThemeProvider>,
    );

    await user.press(screen.getByRole('tab', { name: 'Option 2' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports radio accessibility role', async () => {
    const onChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl
          options={options}
          value="opt1"
          onChange={onChange}
          accessibilityRole="radio"
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('radio', { name: 'Option 1' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Option 2' })).toBeTruthy();
  });
  it('ignores presses on the option that is already selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl options={options} value="opt1" onChange={onChange} />
      </ThemeProvider>,
    );

    await user.press(screen.getByRole('tab', { name: 'Option 1' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks only the active option as selected', async () => {
    await render(
      <ThemeProvider initialMode="light">
        <SegmentedControl options={options} value="opt2" onChange={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Option 2' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByRole('tab', { name: 'Option 1' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });
});

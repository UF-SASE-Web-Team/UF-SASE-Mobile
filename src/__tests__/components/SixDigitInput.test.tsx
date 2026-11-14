import React, { useState } from 'react';
import { render, screen, userEvent, cleanup, fireEvent } from '@testing-library/react-native';
import { SixDigitInput, SixDigitInputProps } from '@/components/ui/SixDigitInput';
import { ThemeProvider } from '@/context/ThemeContext';

function ControlledInput(props: Partial<SixDigitInputProps>) {
  const [val, setVal] = useState(props.value || '');
  return (
    <ThemeProvider>
      <SixDigitInput
        value={val}
        onChangeText={(next) => {
          setVal(next);
          props.onChangeText?.(next);
        }}
        onComplete={props.onComplete}
        disabled={props.disabled}
      />
    </ThemeProvider>
  );
}

describe('SixDigitInput', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders 6 digit slots', async () => {
    await render(<ControlledInput />);

    expect(screen.getByLabelText('6-digit verification code')).toBeTruthy();
    expect(screen.getByDisplayValue('')).toBeTruthy();
  });

  it('filters non-numeric characters and calls onChangeText', async () => {
    const handleChangeText = jest.fn();
    const user = userEvent.setup();

    await render(<ControlledInput onChangeText={handleChangeText} />);

    const input = screen.getByDisplayValue('');
    await user.type(input, '1a2b3');

    expect(handleChangeText).toHaveBeenLastCalledWith('123');
  });

  it('triggers onComplete when 6 digits are entered', async () => {
    const handleComplete = jest.fn();
    const user = userEvent.setup();

    await render(<ControlledInput onComplete={handleComplete} />);

    const input = screen.getByDisplayValue('');
    await user.type(input, '123456');

    expect(handleComplete).toHaveBeenCalledWith('123456');
  });

  it('respects the disabled prop on the underlying TextInput', async () => {
    await render(<ControlledInput value="123" disabled={true} />);

    const input = screen.getByDisplayValue('123');
    expect(input.props.editable).toBe(false);
  });

  it('allows backspacing when 6 digits are entered', async () => {
    const handleChangeText = jest.fn();

    await render(<ControlledInput value="123456" onChangeText={handleChangeText} />);

    const input = screen.getByDisplayValue('123456');
    fireEvent(input, 'keyPress', { nativeEvent: { key: 'Backspace' } });

    expect(handleChangeText).toHaveBeenCalledWith('12345');
  });

  it('keeps cursor selection pinned to the end of value', async () => {
    await render(<ControlledInput value="1234" />);

    const input = screen.getByDisplayValue('1234');
    expect(input.props.selection).toEqual({ start: 4, end: 4 });
  });
});

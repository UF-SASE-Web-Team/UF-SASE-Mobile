import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { Input } from '@/components/ui/Input';
import { ThemeProvider } from '@/context/ThemeContext';

describe('Input', () => {
  it('renders input with placeholder using body styling', async () => {
    await render(
      <ThemeProvider>
        <Input placeholder="Password" icon="key-outline" testID="password-input" />
      </ThemeProvider>,
    );

    const input = screen.getByPlaceholderText('Password');
    expect(input).toBeTruthy();
    expect(screen.getByTestId('password-input-container')).toBeTruthy();
  });

  it('renders error text and sets aria-invalid when provided', async () => {
    await render(
      <ThemeProvider>
        <Input placeholder="Password" error="Invalid password" testID="password-input" />
      </ThemeProvider>,
    );

    expect(screen.getByText('Invalid password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toHaveProp('aria-invalid', true);
  });

  it('supports boolean error without rendering error text', async () => {
    await render(
      <ThemeProvider>
        <Input placeholder="Password" error={true} testID="password-input" />
      </ThemeProvider>,
    );

    expect(screen.getByPlaceholderText('Password')).toHaveProp('aria-invalid', true);
    expect(screen.queryByText('Invalid password')).toBeNull();
  });

  it('allows typing and triggers onChangeText', async () => {
    const handleChangeText = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <Input placeholder="Password" onChangeText={handleChangeText} testID="password-input" />
      </ThemeProvider>,
    );

    const input = screen.getByPlaceholderText('Password');
    await user.type(input, 'Secret123');

    expect(handleChangeText).toHaveBeenCalled();
  });

  it('forwards ref correctly to the underlying TextInput', async () => {
    const inputRef = React.createRef<TextInput>();

    await render(
      <ThemeProvider>
        <Input ref={inputRef} placeholder="Password" testID="password-input" />
      </ThemeProvider>,
    );

    expect(inputRef.current).toBeTruthy();
    expect(typeof inputRef.current?.focus).toBe('function');
  });
});

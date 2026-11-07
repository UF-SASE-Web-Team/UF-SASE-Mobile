import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';
import { ThemeProvider } from '@/context/ThemeContext';

describe('Button', () => {
  it('renders button with children and hardcoded bodyStrong typography', async () => {
    await render(
      <ThemeProvider>
        <Button>Click me</Button>
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeTruthy();
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('handles onPress callback', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <Button onPress={handlePress}>Action</Button>
      </ThemeProvider>,
    );

    await user.press(screen.getByRole('button', { name: 'Action' }));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <Button onPress={handlePress} disabled>
          Disabled Button
        </Button>
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button.props.accessibilityState.disabled).toBe(true);

    await user.press(button);
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('shows loading indicator and disables button when loading', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <Button onPress={handlePress} loading>
          Signing in...
        </Button>
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: 'Signing in...' });
    expect(button.props.accessibilityState.busy).toBe(true);
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Signing in...')).toBeTruthy();

    await user.press(button);
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('supports primary and secondary variants', async () => {
    await render(
      <ThemeProvider>
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
      </ThemeProvider>,
    );

    expect(screen.getByText('Primary Action')).toBeTruthy();
    expect(screen.getByText('Secondary Action')).toBeTruthy();
  });
});

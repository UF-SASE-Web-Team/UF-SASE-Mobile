import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
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

  it('supports primary, secondary, danger, ghost, and outline variants', async () => {
    await render(
      <ThemeProvider>
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="danger">Danger Action</Button>
        <Button variant="ghost">Ghost Action</Button>
        <Button variant="outline">Outline Action</Button>
      </ThemeProvider>,
    );

    expect(screen.getByText('Primary Action')).toBeTruthy();
    expect(screen.getByText('Secondary Action')).toBeTruthy();
    expect(screen.getByText('Danger Action')).toBeTruthy();
    expect(screen.getByText('Ghost Action')).toBeTruthy();
    expect(screen.getByText('Outline Action')).toBeTruthy();
  });

  it('supports title prop as an alternative to children', async () => {
    await render(
      <ThemeProvider>
        <Button title="Title Button" />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Title Button' })).toBeTruthy();
    expect(screen.getByText('Title Button')).toBeTruthy();
  });

  it('renders left and right icons when provided', async () => {
    await render(
      <ThemeProvider>
        <Button
          leftIcon={<Button testID="left-icon">L</Button>}
          rightIcon={<Button testID="right-icon">R</Button>}
        >
          Icon Button
        </Button>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('left-icon')).toBeTruthy();
    expect(screen.getByTestId('right-icon')).toBeTruthy();
  });

  it('supports sm, md, and lg sizes', async () => {
    await render(
      <ThemeProvider>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </ThemeProvider>,
    );

    expect(screen.getByText('Small')).toBeTruthy();
    expect(screen.getByText('Medium')).toBeTruthy();
    expect(screen.getByText('Large')).toBeTruthy();
  });
});

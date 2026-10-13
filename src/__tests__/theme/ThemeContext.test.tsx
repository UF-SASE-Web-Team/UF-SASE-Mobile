import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { Text, View, useColorScheme } from 'react-native';
import {
  ThemeProvider,
  useTheme,
  useThemedStyles,
  spacing,
  borderRadius,
  typography,
  lightColors,
  darkColors,
} from '@/theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}));

function ConsumerComponent() {
  const { theme, mode, isDark, setMode, toggleTheme } = useTheme();
  const styles = useThemedStyles((t) => ({
    box: {
      backgroundColor: t.colors.background,
      padding: t.spacing.md,
      borderRadius: t.borderRadius.md,
    },
    text: {
      color: t.colors.text,
      fontSize: t.typography.fontSize.md,
    },
  }));

  return (
    <View style={styles.box}>
      <Text testID="mode-text">{mode}</Text>
      <Text testID="isDark-text">{isDark ? 'dark' : 'light'}</Text>
      <Text testID="bg-color">{theme.colors.background}</Text>
      <Text testID="text-color">{styles.text.color}</Text>
      <Text testID="set-dark" onPress={() => setMode('dark')}>
        Set Dark
      </Text>
      <Text testID="set-light" onPress={() => setMode('light')}>
        Set Light
      </Text>
      <Text testID="toggle" onPress={toggleTheme}>
        Toggle Theme
      </Text>
    </View>
  );
}

describe('Theme System', () => {
  afterEach(async () => {
    await cleanup();
  });

  describe('Static Constants', () => {
    it('provides valid spacing, borderRadius, and typography tokens', () => {
      expect(spacing.none).toBe(0);
      expect(spacing.md).toBe(16);
      expect(borderRadius.md).toBe(8);
      expect(typography.fontSize.md).toBe(16);
      expect(lightColors.background).toBe('#FFFFFF');
      expect(darkColors.background).toBe('#121212');
    });
  });

  describe('ThemeProvider & useTheme', () => {
    it('defaults to system light mode when system color scheme is light', async () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');

      await render(
        <ThemeProvider>
          <ConsumerComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('mode-text').props.children).toBe('system');
      expect(screen.getByTestId('isDark-text').props.children).toBe('light');
      expect(screen.getByTestId('bg-color').props.children).toBe(lightColors.background);
      expect(screen.getByTestId('text-color').props.children).toBe(lightColors.text);
    });

    it('defaults to dark theme when initialMode is set to dark', async () => {
      await render(
        <ThemeProvider initialMode="dark">
          <ConsumerComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('mode-text').props.children).toBe('dark');
      expect(screen.getByTestId('isDark-text').props.children).toBe('dark');
      expect(screen.getByTestId('bg-color').props.children).toBe(darkColors.background);
      expect(screen.getByTestId('text-color').props.children).toBe(darkColors.text);
    });

    it('allows changing mode via setMode', async () => {
      const user = userEvent.setup();

      await render(
        <ThemeProvider initialMode="light">
          <ConsumerComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('isDark-text').props.children).toBe('light');

      await user.press(screen.getByTestId('set-dark'));

      expect(screen.getByTestId('mode-text').props.children).toBe('dark');
      expect(screen.getByTestId('isDark-text').props.children).toBe('dark');
      expect(screen.getByTestId('bg-color').props.children).toBe(darkColors.background);

      await user.press(screen.getByTestId('set-light'));

      expect(screen.getByTestId('mode-text').props.children).toBe('light');
      expect(screen.getByTestId('isDark-text').props.children).toBe('light');
      expect(screen.getByTestId('bg-color').props.children).toBe(lightColors.background);
    });

    it('toggles theme between light and dark', async () => {
      const user = userEvent.setup();

      await render(
        <ThemeProvider initialMode="light">
          <ConsumerComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('isDark-text').props.children).toBe('light');

      await user.press(screen.getByTestId('toggle'));
      expect(screen.getByTestId('isDark-text').props.children).toBe('dark');

      await user.press(screen.getByTestId('toggle'));
      expect(screen.getByTestId('isDark-text').props.children).toBe('light');
    });

    it('throws error when useTheme is called outside of ThemeProvider', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      function BrokenComponent() {
        useTheme();
        return null;
      }

      await expect(render(<BrokenComponent />)).rejects.toThrow(
        'useTheme must be used within a ThemeProvider',
      );

      spy.mockRestore();
    });
  });
});

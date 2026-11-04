import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { Tabs } from 'expo-router';
import TabsLayout from '@/app/(tabs)/_layout';
import { ThemeProvider } from '@/context/ThemeContext';

describe('TabsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders theme-aware tab bar with correct default styles and 4 core tabs', async () => {
    await render(
      <ThemeProvider>
        <TabsLayout />
      </ThemeProvider>,
    );

    expect(Tabs).toHaveBeenCalledWith(
      expect.objectContaining({
        screenOptions: expect.objectContaining({
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }),
      }),
      undefined,
    );

    const screenCalls = (Tabs.Screen as unknown as jest.Mock).mock.calls;
    const tabNames = screenCalls.map((call) => call[0]?.name);

    expect(tabNames).toContain('index');
    expect(tabNames).toContain('events');
    expect(tabNames).toContain('programs');
    expect(tabNames).toContain('resources');
    expect(tabNames).not.toContain('profile');

    // Test icons render without error
    const indexScreen = screenCalls.find((call) => call[0]?.name === 'index');
    const indexIcon = indexScreen[0]?.options?.tabBarIcon({ color: '#FFFFFF', size: 24 });
    expect(indexIcon.props.name).toBe('flask-outline');

    const eventsScreen = screenCalls.find((call) => call[0]?.name === 'events');
    const eventsIcon = eventsScreen[0]?.options?.tabBarIcon({ color: '#FFFFFF', size: 24 });
    expect(eventsIcon.props.name).toBe('calendar-month-outline');

    const programsScreen = screenCalls.find((call) => call[0]?.name === 'programs');
    const programsIcon = programsScreen[0]?.options?.tabBarIcon({ color: '#FFFFFF', size: 24 });
    expect(programsIcon.props.name).toBe('account-group-outline');

    const resourcesScreen = screenCalls.find((call) => call[0]?.name === 'resources');
    const resourcesIcon = resourcesScreen[0]?.options?.tabBarIcon({ color: '#FFFFFF', size: 24 });
    expect(resourcesIcon.props.name).toBe('folder-outline');
  });
});

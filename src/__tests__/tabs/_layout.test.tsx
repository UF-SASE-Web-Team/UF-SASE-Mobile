import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { Tabs } from 'expo-router';
import TabsLayout from '@/app/(tabs)/_layout';

describe('TabsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders tab bar with correct default styles', async () => {
    await render(<TabsLayout />);

    expect(Tabs).toHaveBeenCalledWith(
      expect.objectContaining({
        screenOptions: expect.objectContaining({
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopWidth: 0,
          },
        }),
      }),
      undefined,
    );
  });
});

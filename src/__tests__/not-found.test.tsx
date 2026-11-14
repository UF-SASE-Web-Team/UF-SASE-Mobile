import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';
import NotFoundScreen from '@/app/+not-found';
import { ThemeProvider } from '@/context/ThemeContext';

describe('NotFoundScreen', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders "This screen does not exist." and link to home', async () => {
    await render(
      <ThemeProvider>
        <NotFoundScreen />
      </ThemeProvider>,
    );

    expect(screen.getByText('This screen does not exist.')).toBeTruthy();
    expect(screen.getByText('Go to home screen!')).toBeTruthy();
  });
});

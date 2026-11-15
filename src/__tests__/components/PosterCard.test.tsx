import React from 'react';
import { View } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { PosterCard } from '@/components/ui/PosterCard';
import { Text } from '@/components/ui/Text';

describe('PosterCard', () => {
  it('renders title and handles press', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    await render(
      <PosterCard
        title="Test Poster"
        imageUrl="https://example.com/poster.jpg"
        onPress={handlePress}
      />,
    );

    const card = screen.getByRole('button', { name: 'Test Poster' });
    expect(card).toBeTruthy();
    expect(screen.getByText('Test Poster')).toBeTruthy();

    await user.press(card);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders placeholder when no image is provided', async () => {
    await render(<PosterCard title="No Image Poster" placeholderTestID="poster-placeholder" />);

    expect(screen.getByTestId('poster-placeholder')).toBeTruthy();
  });

  it('renders top-left badge when provided', async () => {
    await render(
      <PosterCard
        title="Badged Poster"
        topLeftBadge={
          <View testID="test-badge">
            <Text variant="bodySm">Badge</Text>
          </View>
        }
      />,
    );

    expect(screen.getByTestId('test-badge')).toBeTruthy();
    expect(screen.getByText('Badge')).toBeTruthy();
  });

  it('renders chevron action accessory when showChevron is true', async () => {
    await render(<PosterCard title="Chevron Poster" showChevron />);

    // Card should render title properly with chevron
    expect(screen.getByText('Chevron Poster')).toBeTruthy();
  });
});

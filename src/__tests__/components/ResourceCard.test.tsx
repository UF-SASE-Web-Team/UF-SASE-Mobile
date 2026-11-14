import React from 'react';
import { Linking } from 'react-native';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { ResourceCard, ResourceCardProps } from '@/components/resources/ResourceCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { ResourceRow } from '@/types/resources';

function renderResourceCard(props: ResourceCardProps) {
  return render(
    <ThemeProvider>
      <ResourceCard {...props} />
    </ThemeProvider>,
  );
}

describe('ResourceCard', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  const baseResource: ResourceRow = {
    id: 'res-1',
    name: 'Linktree',
    category: 'general',
    url: 'https://linktr.ee/ufsase',
    is_top: true,
    image_url: 'https://example.com/linktree.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders title and image for an external resource without chevron', async () => {
    await renderResourceCard({ resource: baseResource });

    expect(screen.getByRole('button', { name: 'Linktree' })).toBeTruthy();
    expect(screen.getByLabelText('Linktree icon')).toBeTruthy();
  });

  it('renders chevron and routes via deeplink URL when isInternal is true or url is deeplink', async () => {
    const user = userEvent.setup();
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    const internalResource: ResourceRow = {
      ...baseResource,
      id: 'res-faq',
      name: 'Freshmen FAQs',
      url: 'ufsasemobile://resources/freshman-faqs',
    };

    await renderResourceCard({
      resource: internalResource,
    });

    const button = screen.getByRole('button', { name: 'Freshmen FAQs' });
    expect(button.props.accessibilityHint).toBe('Navigates to in-app screen');

    await user.press(button);
    expect(mockPush).toHaveBeenCalledWith('/resources/freshman-faqs');
  });

  it('calls custom onPress handler when pressed', async () => {
    const user = userEvent.setup();
    const mockOnPress = jest.fn();

    await renderResourceCard({
      resource: baseResource,
      onPress: mockOnPress,
    });

    const cardButton = screen.getByRole('button', { name: 'Linktree' });
    await user.press(cardButton);

    expect(mockOnPress).toHaveBeenCalledWith(baseResource);
  });

  it('calls Linking.openURL when pressed and no custom onPress provided', async () => {
    const user = userEvent.setup();
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(null as any);

    await renderResourceCard({
      resource: baseResource,
    });

    const cardButton = screen.getByRole('button', { name: 'Linktree' });
    await user.press(cardButton);

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://linktr.ee/ufsase');
    expect(openURLSpy).toHaveBeenCalledWith('https://linktr.ee/ufsase');
  });
});

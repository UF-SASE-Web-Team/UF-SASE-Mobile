import React from 'react';
import { Linking } from 'react-native';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { ResourceCard, ResourceCardProps } from '@/components/ResourceCard';
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
    display_order: 10,
    image_url: 'https://example.com/linktree.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders title and image for an external resource without chevron', async () => {
    await renderResourceCard({ resource: baseResource });

    expect(screen.getByRole('button', { name: 'Linktree' })).toBeTruthy();
    expect(screen.getByLabelText('Linktree icon')).toBeTruthy();
  });

  it('uses displayName when provided', async () => {
    await renderResourceCard({
      resource: baseResource,
      displayName: 'Custom Linktree Name',
    });

    expect(screen.getByRole('button', { name: 'Custom Linktree Name' })).toBeTruthy();
  });

  it('renders chevron when isInternal is true', async () => {
    const internalResource: ResourceRow = {
      ...baseResource,
      id: 'res-faq',
      name: 'Freshmen FAQs',
    };

    await renderResourceCard({
      resource: internalResource,
      isInternal: true,
    });

    const button = screen.getByRole('button', { name: 'Freshmen FAQs' });
    expect(button.props.accessibilityHint).toBe('Navigates to in-app screen');
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

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { EventTag, TAG_LABELS, getTagColor } from '@/components/EventTag';
import { ThemeProvider } from '@/context/ThemeContext';
import { lightColors } from '@/theme/colors';
import { EventType } from '@/types/events';

function renderTag(type: EventType) {
  return render(
    <ThemeProvider>
      <EventTag type={type} />
    </ThemeProvider>,
  );
}

describe('EventTag', () => {
  afterEach(async () => {
    await cleanup();
  });

  const allTypes: Exclude<EventType, 'other'>[] = ['gbm', 'career', 'social', 'team'];

  it.each(allTypes)('renders correct label for %s', async (type) => {
    await renderTag(type);

    expect(screen.getByText(TAG_LABELS[type])).toBeTruthy();
    expect(screen.getByLabelText(`Category: ${TAG_LABELS[type]}`)).toBeTruthy();
  });

  it('returns null when type is falsy', async () => {
    const { toJSON } = await render(
      <ThemeProvider>
        <EventTag type={null as any} />
      </ThemeProvider>,
    );

    expect(toJSON()).toBeNull();
  });

  it('returns null when type is other', async () => {
    const { toJSON } = await render(
      <ThemeProvider>
        <EventTag type="other" />
      </ThemeProvider>,
    );

    expect(toJSON()).toBeNull();
  });

  it('computes correct tag colors via getTagColor helper', () => {
    expect(getTagColor('gbm', lightColors)).toEqual({
      background: lightColors.surface.accentSubtle.tertiary,
      text: lightColors.content.onAccentSubtle.tertiary,
    });
    expect(getTagColor('career', lightColors)).toEqual({
      background: lightColors.surface.accentSubtle.primary,
      text: lightColors.content.onAccentSubtle.primary,
    });
    expect(getTagColor('social', lightColors)).toEqual({
      background: lightColors.surface.accentSubtle.quaternary,
      text: lightColors.content.onAccentSubtle.quaternary,
    });
    expect(getTagColor('team', lightColors)).toEqual({
      background: lightColors.surface.accentSubtle.secondary,
      text: lightColors.content.onAccentSubtle.secondary,
    });
    expect(getTagColor('other', lightColors)).toBeNull();
  });
});

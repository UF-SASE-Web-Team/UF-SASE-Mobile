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

  it('computes tag colors for valid event types and null for other', () => {
    allTypes.forEach((type) => {
      const colors = getTagColor(type, lightColors);
      expect(colors).not.toBeNull();
      expect(typeof colors?.background).toBe('string');
      expect(typeof colors?.text).toBe('string');
    });
    expect(getTagColor('other', lightColors)).toBeNull();
  });
});

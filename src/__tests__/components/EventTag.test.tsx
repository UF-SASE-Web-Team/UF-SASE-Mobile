import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { EventTag, TAG_LABELS } from '@/components/events/EventTag';
import { ThemeProvider } from '@/context/ThemeContext';
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

  const allTypes: Exclude<EventType, 'other'>[] = [
    'gbm',
    'career',
    'social',
    'service',
    'sports',
    'team',
  ];

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
});

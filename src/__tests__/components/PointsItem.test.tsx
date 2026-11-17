import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { PointsItem } from '@/components/points/PointsItem';
import { ThemeProvider } from '@/context/ThemeContext';

type PointsItemProps = React.ComponentProps<typeof PointsItem>;

function renderPointsItem(props: PointsItemProps) {
  return render(
    <ThemeProvider>
      <PointsItem {...props} />
    </ThemeProvider>,
  );
}

describe('PointsItem', () => {
  afterEach(async () => {
    await cleanup();
  });

  const baseProps: PointsItemProps = {
    title: 'SASE App Meeting',
    date: '2026-10-05T18:00:00Z',
    eventType: 'gbm',
    points: 2,
  };

  it('describes the event, category, date and points earned', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByLabelText('SASE App Meeting, GBM, Oct 5, 2 points')).toBeTruthy();
  });

  it('uses the singular for a one-point event', async () => {
    await renderPointsItem({ ...baseProps, points: 1 });

    expect(screen.getByLabelText(/, 1 point$/)).toBeTruthy();
  });

  it('renders the event category tag', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByTestId('event-tag-gbm')).toBeTruthy();
  });

  it('omits the category for uncategorized events', async () => {
    await renderPointsItem({ ...baseProps, eventType: 'other' });

    expect(screen.queryByTestId('event-tag-other')).toBeNull();
    expect(screen.getByLabelText('SASE App Meeting, Oct 5, 2 points')).toBeTruthy();
  });
});

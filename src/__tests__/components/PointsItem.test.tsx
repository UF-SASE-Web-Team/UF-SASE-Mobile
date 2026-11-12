import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { PointsItem } from '@/components/PointsItem';
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
    category: 'GBM',
  };

  it('shows the event title and category', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByText('SASE App Meeting')).toBeTruthy();
    expect(screen.getByText('GBM')).toBeTruthy();
  });

  it('shows the month and day of the event', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByText('Oct')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('shows "attendance confirmed" by default', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByText('attendance confirmed')).toBeTruthy();
  });

  it('shows a custom status when provided', async () => {
    await renderPointsItem({ ...baseProps, status: 'pending review' });

    expect(screen.getByText('pending review')).toBeTruthy();
    expect(screen.queryByText('attendance confirmed')).toBeNull();
  });

  it('has an accessibility label describing the whole card', async () => {
    await renderPointsItem(baseProps);

    expect(
      screen.getByLabelText('SASE App Meeting, GBM, Oct 5, attendance confirmed'),
    ).toBeTruthy();
  });
});

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
    category: 'Attendance',
  };

  it('shows the event title, formatted date, and point type', async () => {
    await renderPointsItem(baseProps);

    expect(screen.getByText('SASE App Meeting')).toBeTruthy();
    expect(screen.getByText('Oct 05')).toBeTruthy();
    expect(screen.getByText('Attendance')).toBeTruthy();
  });

  it('shows custom point type when specified (e.g. Digital Engagement)', async () => {
    await renderPointsItem({
      ...baseProps,
      category: 'Digital Engagement',
    });

    expect(screen.getByText('Digital Engagement')).toBeTruthy();
  });

  it('resolves database point_category enum values properly', async () => {
    await renderPointsItem({
      ...baseProps,
      category: 'digital_engagement',
    });

    expect(screen.getByText('Digital Engagement')).toBeTruthy();
  });

  it('resolves marketplace category to Marketplace', async () => {
    await renderPointsItem({
      ...baseProps,
      category: 'marketplace',
    });

    expect(screen.getByText('Marketplace')).toBeTruthy();
  });

  it('resolves commitment category to Commitment', async () => {
    await renderPointsItem({
      ...baseProps,
      category: 'commitment',
    });

    expect(screen.getByText('Commitment')).toBeTruthy();
  });

  it('renders points value inline with star icon', async () => {
    await renderPointsItem({ ...baseProps, pointsValue: 2 });

    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders 0 in muted text when pointsValue is 0', async () => {
    await renderPointsItem({ ...baseProps, pointsValue: 0 });

    expect(screen.getByText('0')).toBeTruthy();
  });

  it('has an accessibility label describing the row', async () => {
    await renderPointsItem(baseProps);

    expect(
      screen.getByLabelText('SASE App Meeting, Oct 05, Attendance, plus 1 points'),
    ).toBeTruthy();
  });
});

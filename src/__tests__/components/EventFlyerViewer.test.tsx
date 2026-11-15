import React from 'react';
import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { PanResponder } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventFlyerViewer } from '@/components/events/EventFlyerViewer';
import { ThemeProvider } from '@/context/ThemeContext';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderViewer(props: Partial<React.ComponentProps<typeof EventFlyerViewer>> = {}) {
  const defaultProps = {
    flyerUrl: 'https://example.com/flyer.jpg',
    onClose: jest.fn(),
    originHeight: 300,
    originScale: 1,
    ...props,
  };
  const view = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <EventFlyerViewer {...defaultProps} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return {
    ...view,
    onClose: defaultProps.onClose,
  };
}

describe('EventFlyerViewer', () => {
  let capturedConfig: any = null;
  const originalCreate = PanResponder.create;

  beforeEach(() => {
    capturedConfig = null;
    jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
      capturedConfig = config;
      return originalCreate(config);
    });
  });

  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  it('renders flyer image and close button', async () => {
    await renderViewer();

    expect(screen.getByLabelText('Event flyer')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close flyer' })).toBeTruthy();
  });

  it('calls onClose when close button is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = await renderViewer();

    const closeButton = screen.getByRole('button', { name: 'Close flyer' });
    await user.press(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when swiped down past the threshold', async () => {
    const { onClose } = await renderViewer();
    expect(capturedConfig).toBeTruthy();

    await act(async () => {
      capturedConfig.onPanResponderRelease?.(
        {},
        { dy: 150, dx: 0, vy: 0.6, vx: 0, numberActiveTouches: 1 },
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when swiped up past the threshold', async () => {
    const { onClose } = await renderViewer();
    expect(capturedConfig).toBeTruthy();

    await act(async () => {
      capturedConfig.onPanResponderRelease?.(
        {},
        { dy: -150, dx: 0, vy: -0.6, vx: 0, numberActiveTouches: 1 },
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onClose when swipe is released below threshold', async () => {
    const { onClose } = await renderViewer();
    expect(capturedConfig).toBeTruthy();

    await act(async () => {
      capturedConfig.onPanResponderRelease?.(
        {},
        { dy: 30, dx: 0, vy: 0.1, vx: 0, numberActiveTouches: 1 },
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('captures vertical swipes but ignores horizontal drags or multi-touch gestures', async () => {
    await renderViewer();
    expect(capturedConfig).toBeTruthy();

    // Multi-touch (e.g. pinch to zoom)
    const multiTouch = capturedConfig.onMoveShouldSetPanResponderCapture(
      {},
      { dy: 50, dx: 0, numberActiveTouches: 2 },
    );
    expect(multiTouch).toBe(false);

    // Horizontal drag
    const horizontalDrag = capturedConfig.onMoveShouldSetPanResponderCapture(
      {},
      { dy: 5, dx: 40, numberActiveTouches: 1 },
    );
    expect(horizontalDrag).toBe(false);

    // Intentional vertical swipe
    const verticalSwipe = capturedConfig.onMoveShouldSetPanResponderCapture(
      {},
      { dy: 50, dx: 5, numberActiveTouches: 1 },
    );
    expect(verticalSwipe).toBe(true);
  });
});

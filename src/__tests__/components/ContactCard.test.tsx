import React from 'react';
import { render, screen, cleanup, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { ContactCard } from '@/components/ContactCard';
import { ThemeProvider } from '@/context/ThemeContext';

function renderCard(props: React.ComponentProps<typeof ContactCard>) {
  return render(
    <ThemeProvider>
      <ContactCard {...props} />
    </ThemeProvider>,
  );
}

describe('ContactCard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders the contact name', async () => {
    await renderCard({ name: 'Alice' });

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByLabelText('Contact: Alice')).toBeTruthy();
  });

  it('renders avatar placeholder with first letter when avatarUrl is missing', async () => {
    await renderCard({ name: 'Shuncheng' });

    expect(screen.getByText('S')).toBeTruthy();
  });

  it('renders avatar image when avatarUrl is provided', async () => {
    await renderCard({ name: 'Ro', avatarUrl: 'https://example.com/avatar.png' });

    expect(screen.getByText('Ro')).toBeTruthy();
    expect(screen.getByLabelText("Ro's avatar")).toBeTruthy();
  });

  it('renders as a clickable button when onPress is provided', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    await renderCard({ name: 'Alice', userId: 'u1', onPress });

    const button = screen.getByRole('button', { name: 'View profile: Alice' });
    expect(button).toBeTruthy();

    await user.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('automatically navigates to /profile/[userId] when userId is provided and onPress is omitted', async () => {
    const user = userEvent.setup();

    await renderCard({ name: 'Bob', userId: 'user-123' });

    const button = screen.getByRole('button', { name: 'View profile: Bob' });
    expect(button).toBeTruthy();

    await user.press(button);
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
  });

  it('renders as non-clickable text when userId and onPress are omitted', async () => {
    await renderCard({ name: 'External Guest' });

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByLabelText('Contact: External Guest')).toBeTruthy();
  });
});

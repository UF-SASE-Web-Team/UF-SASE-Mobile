import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
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
});

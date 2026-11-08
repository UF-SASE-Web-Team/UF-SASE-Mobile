import React from 'react';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ContactList } from '@/components/ContactList';
import { ThemeProvider } from '@/context/ThemeContext';

async function renderContactList(props: React.ComponentProps<typeof ContactList>) {
  return render(
    <ThemeProvider>
      <ContactList {...props} />
    </ThemeProvider>,
  );
}

describe('ContactList', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders null when contacts is empty and no emptyComponent', async () => {
    const { toJSON } = await renderContactList({ contacts: [] });
    expect(toJSON()).toBeNull();
  });

  it('renders emptyComponent when contacts is empty', async () => {
    await renderContactList({
      contacts: [],
      emptyComponent: <Text>No contacts available</Text>,
    });

    expect(screen.getByText('Contacts')).toBeTruthy();
    expect(screen.getByText('No contacts available')).toBeTruthy();
  });

  it('renders contact cards for provided contacts', async () => {
    await renderContactList({
      contacts: [
        { id: 'c1', name: 'Alice Johnson', avatarUrl: 'https://example.com/alice.png' },
        { id: 'c2', name: 'Bob Smith', avatarUrl: null },
      ],
    });

    expect(screen.getByText('Contacts')).toBeTruthy();
    expect(screen.getByText('Alice Johnson')).toBeTruthy();
    expect(screen.getByText('Bob Smith')).toBeTruthy();
  });

  it('supports custom title and omitting title', async () => {
    await renderContactList({
      title: 'Program Officers',
      contacts: [{ id: 'c1', name: 'Officer One' }],
    });

    expect(screen.getByText('Program Officers')).toBeTruthy();
    expect(screen.queryByText('Contacts')).toBeNull();

    await cleanup();

    await renderContactList({
      title: null,
      contacts: [{ id: 'c1', name: 'Officer One' }],
    });

    expect(screen.queryByText('Program Officers')).toBeNull();
    expect(screen.queryByText('Contacts')).toBeNull();
    expect(screen.getByText('Officer One')).toBeTruthy();
  });

  it('triggers onContactPress only for contacts with userId', async () => {
    const onContactPress = jest.fn();
    const user = userEvent.setup();

    await renderContactList({
      contacts: [
        { id: 'c1', name: 'User Contact', userId: 'u1' },
        { id: 'c2', name: 'Display Only Contact', userId: null },
      ],
      onContactPress,
    });

    const userButton = screen.getByRole('button', { name: 'View profile: User Contact' });
    expect(userButton).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View profile: Display Only Contact' })).toBeNull();

    await user.press(userButton);
    expect(onContactPress).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', name: 'User Contact', userId: 'u1' }),
    );
  });
});

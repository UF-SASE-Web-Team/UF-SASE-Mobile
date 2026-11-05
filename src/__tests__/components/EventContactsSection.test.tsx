import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { EventContactsSection } from '@/components/EventContactsSection';
import { ThemeProvider } from '@/context/ThemeContext';

async function renderSection(props: React.ComponentProps<typeof EventContactsSection>) {
  return render(
    <ThemeProvider>
      <EventContactsSection {...props} />
    </ThemeProvider>,
  );
}

describe('EventContactsSection', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders null when contacts and program are empty', async () => {
    const { toJSON } = await renderSection({ contacts: [] });
    expect(toJSON()).toBeNull();

    const { toJSON: toJSONProgram } = await renderSection({
      program: {
        id: 'p1',
        name: 'Mentorship',
        program_members: [],
      },
    });
    expect(toJSONProgram()).toBeNull();
  });

  it('renders contacts passed directly', async () => {
    await renderSection({
      contacts: [
        { id: 'c1', name: 'Alice Smith', avatarUrl: 'https://example.com/alice.png' },
        { id: 'c2', name: 'Bob Jones' },
      ],
    });

    expect(screen.getByText('Contacts')).toBeTruthy();
    expect(screen.getByText('Alice Smith')).toBeTruthy();
    expect(screen.getByText('Bob Jones')).toBeTruthy();
  });

  it('extracts and renders only POCs from program object', async () => {
    await renderSection({
      program: {
        id: 'p1',
        name: 'Web Dev',
        program_members: [
          {
            id: 'm1',
            user_id: 'u1',
            display_name: 'Lead Alice',
            is_poc: true,
            profile: {
              id: 'u1',
              full_name: 'Alice Johnson',
              avatar_url: 'https://example.com/alice.png',
            },
          },
          {
            id: 'm2',
            user_id: 'u2',
            display_name: '',
            is_poc: true,
            profile: {
              id: 'u2',
              full_name: 'Bob Lee',
              avatar_url: null,
            },
          },
          {
            id: 'm3',
            user_id: 'u3',
            display_name: 'Charlie Member',
            is_poc: false,
            profile: null,
          },
        ],
      },
    });

    expect(screen.getByText('Contacts')).toBeTruthy();
    expect(screen.getByText('Lead Alice')).toBeTruthy();
    expect(screen.getByText('Bob Lee')).toBeTruthy();
    expect(screen.queryByText('Charlie Member')).toBeNull();
  });

  it('supports custom title', async () => {
    await renderSection({
      title: 'Event Leads',
      contacts: [{ id: 'c1', name: 'Alice' }],
    });

    expect(screen.getByText('Event Leads')).toBeTruthy();
    expect(screen.queryByText('Contacts')).toBeNull();
  });
});

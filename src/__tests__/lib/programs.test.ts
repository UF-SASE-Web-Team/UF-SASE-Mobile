import { getOpenApplicationPrograms } from '@/lib/programs';
import { ProgramWithPoCs } from '@/types/programs';

const NOW = new Date('2026-09-15T12:00:00Z');

function makeProgram(overrides: Partial<ProgramWithPoCs>): ProgramWithPoCs {
  return {
    id: 'prog',
    name: 'Program',
    slug: 'program',
    category: 'community',
    display_order: 1,
    short_description: null,
    description: null,
    image_url: null,
    is_active: true,
    application_url: null,
    opens_at: null,
    closes_at: null,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    parent_id: null,
    pocs: [],
    ...overrides,
  };
}

describe('getOpenApplicationPrograms', () => {
  it('excludes programs without any application info', () => {
    const result = getOpenApplicationPrograms([makeProgram({ id: 'no-app' })], NOW);

    expect(result).toEqual([]);
  });

  it('excludes programs whose application deadline has passed', () => {
    const result = getOpenApplicationPrograms(
      [
        makeProgram({
          id: 'closed',
          application_url: 'https://example.com/apply',
          closes_at: '2026-09-01T00:00:00Z',
        }),
      ],
      NOW,
    );

    expect(result).toEqual([]);
  });

  it('includes open programs, programs opening later, and programs with no deadline', () => {
    const result = getOpenApplicationPrograms(
      [
        makeProgram({ id: 'open', closes_at: '2026-09-30T00:00:00Z' }),
        makeProgram({ id: 'opening-later', opens_at: '2026-10-01T00:00:00Z' }),
        makeProgram({ id: 'no-deadline', application_url: 'https://example.com/apply' }),
      ],
      NOW,
    );

    expect(result.map((p) => p.id).sort()).toEqual(['no-deadline', 'open', 'opening-later']);
  });

  it('orders by nearest deadline first, with no-deadline programs last', () => {
    const result = getOpenApplicationPrograms(
      [
        makeProgram({ id: 'no-deadline', application_url: 'https://example.com/apply' }),
        makeProgram({ id: 'later', closes_at: '2026-10-20T00:00:00Z' }),
        makeProgram({ id: 'sooner', closes_at: '2026-09-20T00:00:00Z' }),
      ],
      NOW,
    );

    expect(result.map((p) => p.id)).toEqual(['sooner', 'later', 'no-deadline']);
  });

  it('breaks deadline ties by the earliest opening date', () => {
    const result = getOpenApplicationPrograms(
      [
        makeProgram({ id: 'opens-second', opens_at: '2026-11-01T00:00:00Z' }),
        makeProgram({ id: 'opens-first', opens_at: '2026-10-01T00:00:00Z' }),
      ],
      NOW,
    );

    expect(result.map((p) => p.id)).toEqual(['opens-first', 'opens-second']);
  });
});

import {
  ACADEMIC_TERMS_SEED,
  APP_SETTINGS_SEED,
  PARENT_PROGRAMS_SEED,
  RESOURCES_SEED,
  REVIEWER_ACCOUNT_SEED,
  SUB_PROGRAMS_SEED,
  SEEDERS,
  loadEventsFromSql,
  runAllSeeds,
  seedAcademicTerms,
  seedAppSettings,
  seedEvents,
  seedPrograms,
  seedResources,
  seedReviewerAccounts,
  type SupabaseAdminClient,
} from '../../../supabase/seeds/index.ts';

describe('Production Seeds Data Integrity', () => {
  describe('academic_terms', () => {
    it('has unique IDs and valid dates', () => {
      const ids = ACADEMIC_TERMS_SEED.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);

      for (const term of ACADEMIC_TERMS_SEED) {
        expect(term.id).toBeTruthy();
        expect(term.name).toBeTruthy();
        expect(/^\d{4}-\d{2}-\d{2}$/.test(term.start_date)).toBe(true);
      }
    });

    it('has exactly one active semester (is_current = true)', () => {
      const currentTerms = ACADEMIC_TERMS_SEED.filter((t) => t.is_current);
      expect(currentTerms).toHaveLength(1);
    });
  });

  describe('app_settings', () => {
    it('has unique keys with non-null values', () => {
      const keys = APP_SETTINGS_SEED.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);

      for (const setting of APP_SETTINGS_SEED) {
        expect(setting.key).toBeTruthy();
        expect(typeof setting.value).toBe('string');
      }
    });
  });

  describe('programs', () => {
    const validCategories = new Set([
      'events_and_committees',
      'technical_and_research',
      'community',
      null,
    ]);

    it('parent programs have unique slugs, valid categories, and display orders', () => {
      const slugs = PARENT_PROGRAMS_SEED.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);

      for (const prog of PARENT_PROGRAMS_SEED) {
        expect(prog.slug).toBeTruthy();
        expect(prog.name).toBeTruthy();
        expect(validCategories.has(prog.category as any)).toBe(true);
        expect(typeof prog.display_order).toBe('number');
      }
    });

    it('subprograms link to existing parent programs and have category=null', () => {
      const parentSlugs = new Set(PARENT_PROGRAMS_SEED.map((p) => p.slug));
      const allSlugs = new Set(PARENT_PROGRAMS_SEED.map((p) => p.slug));

      for (const sub of SUB_PROGRAMS_SEED) {
        expect(parentSlugs.has(sub.parentSlug)).toBe(true);
        expect(sub.category).toBeNull();
        expect(allSlugs.has(sub.slug)).toBe(false);
        allSlugs.add(sub.slug);
      }
    });
  });

  describe('resources', () => {
    const validCategories = new Set(['general', 'sase', 'academic', 'professional']);

    it('has unique names and valid categories and URLs', () => {
      const names = RESOURCES_SEED.map((r) => r.name);
      expect(new Set(names).size).toBe(names.length);

      for (const resource of RESOURCES_SEED) {
        expect(resource.name).toBeTruthy();
        expect(validCategories.has(resource.category as any)).toBe(true);
        expect(resource.url).toBeTruthy();
        expect(typeof resource.is_top).toBe('boolean');
      }
    });
  });

  describe('reviewer_accounts', () => {
    it('configures Alice reviewer account matching staging spec', () => {
      expect(REVIEWER_ACCOUNT_SEED.email).toBe('alice@gmail.com');
      expect(REVIEWER_ACCOUNT_SEED.username).toBe('alice');
      expect(REVIEWER_ACCOUNT_SEED.password).toBe('password123');
      expect(REVIEWER_ACCOUNT_SEED.fullName).toBe('Alice Gator');
      expect(REVIEWER_ACCOUNT_SEED.ufid).toBe('12345678');
      expect(REVIEWER_ACCOUNT_SEED.majors).toContain('Computer Science');
    });
  });

  describe('events.sql parser', () => {
    it('loads and parses events and links from supabase/seeds/events.sql', () => {
      const { events, links } = loadEventsFromSql();
      expect(events.length).toBeGreaterThan(0);
      expect(links.length).toBeGreaterThan(0);

      // Verify structure
      const firstEvent = events[0];
      expect(firstEvent.id).toBeTruthy();
      expect(firstEvent.title).toBeTruthy();
      expect(firstEvent.starts_at).toBeTruthy();
      expect(firstEvent.ends_at).toBeTruthy();
      expect(firstEvent.location_name).toBeTruthy();

      const firstLink = links[0];
      expect(firstLink.event_id).toBeTruthy();
      expect(firstLink.title).toBeTruthy();
      expect(firstLink.url).toBeTruthy();
    });
  });

  describe('registry', () => {
    it('registers all 6 production entity seeders', () => {
      const names = SEEDERS.map((s) => s.name);
      expect(names).toEqual([
        'academic_terms',
        'app_settings',
        'programs',
        'resources',
        'reviewer_accounts',
        'events',
      ]);
    });
  });
});

describe('Seeder Functions Logic (with mock client)', () => {
  function createMockSupabase(overrides: Record<string, any> = {}) {
    const mockAuthUsers: any[] = overrides.authUsers ?? [];
    const mockTables: Record<string, any[]> = {
      academic_terms: [],
      app_settings: [],
      programs: [],
      resources: [],
      profiles: [],
      profile_private: [],
      events: [],
      event_links: [],
      ...overrides,
    };

    const client = {
      auth: {
        admin: {
          listUsers: jest.fn().mockImplementation(async () => ({
            data: { users: [...mockAuthUsers] },
            error: null,
          })),
          createUser: jest.fn().mockImplementation(async (params: any) => {
            const user = {
              id: `auth-${Math.random().toString(36).slice(2)}`,
              email: params.email,
              user_metadata: params.user_metadata,
            };
            mockAuthUsers.push(user);
            return { data: { user }, error: null };
          }),
          updateUserById: jest.fn().mockImplementation(async (id: string, updates: any) => {
            const user = mockAuthUsers.find((u) => u.id === id);
            if (user) {
              Object.assign(user, updates);
            }
            return { data: { user }, error: null };
          }),
        },
      },
      from: jest.fn().mockImplementation((table: string) => {
        let currentData = mockTables[table] ?? [];

        return {
          select: jest.fn().mockImplementation(() => ({
            data: [...currentData],
            error: null,
            eq: jest.fn().mockImplementation((field: string, val: any) => ({
              data: currentData.filter((r) => r[field] === val),
              error: null,
              maybeSingle: jest.fn().mockImplementation(() => ({
                data: currentData.find((r) => r[field] === val) || null,
                error: null,
              })),
            })),
          })),
          insert: jest.fn().mockImplementation((itemOrItems: any) => {
            const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
            const insertedRows = items.map((it) => {
              const row = { id: it.id || `mock-${Math.random().toString(36).slice(2)}`, ...it };
              currentData.push(row);
              return row;
            });
            const selectObj = Object.assign(Promise.resolve({ data: insertedRows, error: null }), {
              data: insertedRows,
              error: null,
              single: jest.fn().mockReturnValue({ data: insertedRows[0], error: null }),
            });
            return {
              select: jest.fn().mockReturnValue(selectObj),
              data: insertedRows,
              error: null,
            };
          }),
          upsert: jest.fn().mockImplementation((itemOrItems: any) => {
            const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
            for (const it of items) {
              const existingIdx = currentData.findIndex(
                (r) => (it.id && r.id === it.id) || (it.user_id && r.user_id === it.user_id),
              );
              if (existingIdx >= 0) {
                currentData[existingIdx] = { ...currentData[existingIdx], ...it };
              } else {
                currentData.push({ ...it });
              }
            }
            return { error: null };
          }),
          delete: jest.fn().mockImplementation(() => ({
            in: jest.fn().mockImplementation((field: string, values: any[]) => {
              const valSet = new Set(values);
              mockTables[table] = currentData.filter((r) => !valSet.has(r[field]));
              currentData = mockTables[table];
              return { error: null };
            }),
            eq: jest.fn().mockImplementation((field: string, val: any) => {
              mockTables[table] = currentData.filter((r) => r[field] !== val);
              currentData = mockTables[table];
              return { error: null };
            }),
          })),
          update: jest.fn().mockImplementation((updates: any) => {
            const matcher = {
              eq: jest.fn().mockImplementation((field: string, val: any) => {
                for (const row of currentData) {
                  if (row[field] === val) {
                    Object.assign(row, updates);
                  }
                }
                return matcher;
              }),
              is: jest.fn().mockImplementation((_field: string, _val: any) => {
                return matcher;
              }),
              error: null,
            };
            return matcher;
          }),
        };
      }),
    };

    return { client: client as unknown as SupabaseAdminClient, mockTables, mockAuthUsers };
  }

  describe('seedAcademicTerms', () => {
    it('inserts missing terms in live mode', async () => {
      const { client, mockTables } = createMockSupabase();
      const result = await seedAcademicTerms(client);

      expect(result.inserted).toBe(ACADEMIC_TERMS_SEED.length);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(mockTables.academic_terms.length).toBe(ACADEMIC_TERMS_SEED.length);
    });

    it('skips existing matching terms and performs no writes on dry-run', async () => {
      const { client, mockTables } = createMockSupabase({
        academic_terms: ACADEMIC_TERMS_SEED.map((t) => ({ ...t })),
      });

      const dryRunRes = await seedAcademicTerms(client, { dryRun: true });
      expect(dryRunRes.skipped).toBe(ACADEMIC_TERMS_SEED.length);
      expect(dryRunRes.inserted).toBe(0);
      expect(dryRunRes.updated).toBe(0);
      expect(mockTables.academic_terms.length).toBe(ACADEMIC_TERMS_SEED.length);
    });
  });

  describe('seedAppSettings', () => {
    it('inserts missing settings and skips existing', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedAppSettings(client);

      expect(res.inserted).toBe(APP_SETTINGS_SEED.length);
      expect(mockTables.app_settings.length).toBe(APP_SETTINGS_SEED.length);

      const secondRun = await seedAppSettings(client);
      expect(secondRun.inserted).toBe(0);
      expect(secondRun.skipped).toBe(APP_SETTINGS_SEED.length);
    });

    it('updates existing settings when values differ', async () => {
      const { client, mockTables } = createMockSupabase({
        app_settings: [{ key: 'checkin_qr_url', value: 'https://old-form.com' }],
      });

      const res = await seedAppSettings(client);
      expect(res.updated).toBe(1);
      expect(res.inserted).toBe(0);
      expect(mockTables.app_settings[0].value).toBe('https://forms.gle/CBEEdo8zP8hjqHdc6');
    });
  });

  describe('seedPrograms', () => {
    it('inserts parents and resolves subprograms with parent_id', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedPrograms(client);

      expect(res.inserted).toBe(PARENT_PROGRAMS_SEED.length + SUB_PROGRAMS_SEED.length);

      const sweetParent = mockTables.programs.find((p) => p.slug === 'sweet');
      expect(sweetParent).toBeDefined();

      const beginnerTeam = mockTables.programs.find((p) => p.slug === 'sweet-beginner-team');
      expect(beginnerTeam).toBeDefined();
      expect(beginnerTeam.parent_id).toBe(sweetParent.id);
    });

    it('supports dry-run without writing to database', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedPrograms(client, { dryRun: true });

      expect(res.inserted).toBe(PARENT_PROGRAMS_SEED.length + SUB_PROGRAMS_SEED.length);
      expect(mockTables.programs).toHaveLength(0);
    });
  });

  describe('seedResources', () => {
    it('inserts all resources and updates on difference', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedResources(client);

      expect(res.inserted).toBe(RESOURCES_SEED.length);
      expect(mockTables.resources.length).toBe(RESOURCES_SEED.length);

      // Modify one and re-run
      mockTables.resources[0].url = 'https://old-url.com';
      const secondRun = await seedResources(client);
      expect(secondRun.updated).toBe(1);
      expect(secondRun.skipped).toBe(RESOURCES_SEED.length - 1);
    });
  });

  describe('seedReviewerAccounts', () => {
    it('creates Alice auth user, updates profile, and sets UFID for onboarding bypass', async () => {
      const { client, mockTables, mockAuthUsers } = createMockSupabase();
      const res = await seedReviewerAccounts(client);

      expect(res.inserted).toBe(1);
      expect(mockAuthUsers).toHaveLength(1);
      expect(mockAuthUsers[0].email).toBe('alice@gmail.com');

      expect(mockTables.profile_private).toHaveLength(1);
      expect(mockTables.profile_private[0].ufid).toBe('12345678');
    });

    it('updates credentials and profile when Alice already exists', async () => {
      const { client, mockTables, mockAuthUsers } = createMockSupabase({
        authUsers: [{ id: 'existing-alice-id', email: 'alice@gmail.com' }],
        profiles: [{ id: 'existing-alice-id', username: 'alice' }],
      });

      const res = await seedReviewerAccounts(client);
      expect(res.updated).toBe(1);
      expect(mockAuthUsers[0].password).toBe('password123');
      expect(mockTables.profile_private[0].user_id).toBe('existing-alice-id');
    });

    it('supports dryRun mode without making auth or DB changes', async () => {
      const { client, mockTables, mockAuthUsers } = createMockSupabase();
      const res = await seedReviewerAccounts(client, { dryRun: true });

      expect(res.inserted).toBe(1);
      expect(mockAuthUsers).toHaveLength(0);
      expect(mockTables.profile_private).toHaveLength(0);
    });
  });

  describe('seedEvents', () => {
    it('upserts parsed events and synchronizes child links', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedEvents(client);

      expect(res.inserted).toBeGreaterThan(0);
      expect(mockTables.events.length).toBe(res.total);
      expect(mockTables.event_links.length).toBeGreaterThan(0);
    });

    it('supports dryRun mode without writing events', async () => {
      const { client, mockTables } = createMockSupabase();
      const res = await seedEvents(client, { dryRun: true });

      expect(res.total).toBeGreaterThan(0);
      expect(mockTables.events).toHaveLength(0);
      expect(mockTables.event_links).toHaveLength(0);
    });
  });

  describe('runAllSeeds', () => {
    it('runs all registered seeders and aggregates results', async () => {
      const { client } = createMockSupabase();
      const results = await runAllSeeds(client);

      expect(results).toHaveLength(6);
      expect(results.map((r) => r.entity)).toEqual([
        'academic_terms',
        'app_settings',
        'programs',
        'resources',
        'reviewer_accounts',
        'events',
      ]);
    });
  });
});

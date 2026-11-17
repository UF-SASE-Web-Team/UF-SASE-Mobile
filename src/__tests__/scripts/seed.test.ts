import fs from 'node:fs';
import {
  PROD_PROJECT_REF,
  STAGING_PROJECT_REF,
  SEED_TARGETS,
  getSelectedTargets,
  parseCliArgs,
  resolveTargetRemote,
} from '../../../scripts/seed.ts';

describe('SQL Seed Files Integrity', () => {
  it('registers all 6 modular SQL seed targets in expected dependency order', () => {
    expect(SEED_TARGETS.map((t) => t.name)).toEqual([
      'academic_terms',
      'app_settings',
      'programs',
      'resources',
      'reviewer_accounts',
      'events',
    ]);
  });

  it('all 6 SQL seed files exist on disk and are non-empty', () => {
    for (const target of SEED_TARGETS) {
      expect(fs.existsSync(target.filePath)).toBe(true);
      const content = fs.readFileSync(target.filePath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    }
  });

  describe('01_academic_terms.sql', () => {
    it('contains academic_terms table and idempotent ON CONFLICT clause', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'academic_terms')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('insert into public.academic_terms');
      expect(sql).toContain('fall-2026');
      expect(sql).toContain('spring-2027');
      expect(sql).toContain('summer-2027');
      expect(sql).toContain('on conflict (id) do update');
      expect(sql).toContain('update public.academic_terms');
    });
  });

  describe('02_app_settings.sql', () => {
    it('contains app_settings table and checkin_qr_url key', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'app_settings')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('insert into public.app_settings');
      expect(sql).toContain('checkin_qr_url');
      expect(sql).toContain('on conflict (key) do update');
    });
  });

  describe('03_programs.sql', () => {
    it('contains parent programs, subprograms, full CDN WebP image URLs, and DO NOTHING', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'programs')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('insert into public.programs');
      expect(sql).toContain("'interns'");
      expect(sql).toContain("'banquet'");
      expect(sql).toContain("'sasehacks'");
      expect(sql).toContain("'sweet'");
      expect(sql).toContain(
        'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/interns.webp',
      );
      expect(sql).toContain(
        'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/programs/banquet.webp',
      );
      expect(sql).toContain('SWEET Beginner Team');
      expect(sql).toContain('SASE Mobile Team');
      expect(sql).toContain('on conflict (slug) do update set');
      expect(sql).toContain('image_url = excluded.image_url');
    });
  });

  describe('04_resources.sql', () => {
    it('contains curated resources with full CDN WebP assets and updates image_url on conflict', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'resources')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('insert into public.resources');
      expect(sql).toContain("'Linktree'");
      expect(sql).toContain("'Freshmen FAQs'");
      expect(sql).toContain("'Pre-health resources'");
      expect(sql).toContain("'Marston Study Room Booking'");
      expect(sql).toContain("'Internship Guide'");
      expect(sql).toContain("'F26 Class Connector Form'");
      expect(sql).toContain("'F26 Class Connector Sheet'");
      expect(sql).toContain("'Experiences Tracker'");
      expect(sql).toContain("'Board Office Hours'");
      expect(sql).toContain("'26-27 Google Calendar'");
      expect(sql).toContain("'Resume Template'");
      expect(sql).toContain(
        'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/linktree.webp',
      );
      expect(sql).toContain(
        'https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/resources/freshman-faq.webp',
      );
      expect(sql).toContain('on conflict (name) do update set');
      expect(sql).toContain('image_url = excluded.image_url');
    });
  });

  describe('05_reviewer_accounts.sql', () => {
    it('configures Alice reviewer account, Bob, and profile data', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'reviewer_accounts')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('alice@gmail.com');
      expect(sql).toContain('bob@gmail.com');
      expect(sql).toContain('password123');
      expect(sql).toContain('Alice Gator');
      expect(sql).toContain('12345678');
      expect(sql).not.toContain('Test Event');
    });
  });

  describe('06_events.sql', () => {
    it('contains real calendar events and child event_links with ON CONFLICT', () => {
      const target = SEED_TARGETS.find((t) => t.name === 'events')!;
      const sql = fs.readFileSync(target.filePath, 'utf-8');

      expect(sql).toContain('INSERT INTO public.events');
      expect(sql).toContain('ON CONFLICT (id) DO UPDATE');
      expect(sql).toContain('INSERT INTO public.event_links');
      expect(sql).toContain('COMMIT;');
    });
  });
});

describe('Seeder CLI & Filter Logic', () => {
  describe('parseCliArgs', () => {
    it('parses flags correctly', () => {
      const options = parseCliArgs([
        '--dry-run',
        '--verbose',
        '--remote=staging',
        '--only=events,programs',
      ]);

      expect(options.dryRun).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.remote).toBe(STAGING_PROJECT_REF);
      expect(options.only).toEqual(['events', 'programs']);
      expect(options.isLocal).toBe(false);
    });

    it('parses shortcut flags --prod, --staging, --local, --all', () => {
      expect(parseCliArgs(['--prod']).remote).toBe(PROD_PROJECT_REF);
      expect(parseCliArgs(['--staging']).remote).toBe(STAGING_PROJECT_REF);
      expect(parseCliArgs(['--local']).isLocal).toBe(true);
      expect(parseCliArgs(['--all']).all).toBe(true);
      expect(parseCliArgs(['-a']).all).toBe(true);
    });
  });

  describe('resolveTargetRemote', () => {
    it('resolves explicit prod target', () => {
      const res = resolveTargetRemote({ remote: PROD_PROJECT_REF });
      expect(res.isLocal).toBe(false);
      expect(res.remoteRef).toBe(PROD_PROJECT_REF);
      expect(res.remoteName).toContain('production');
    });

    it('resolves explicit staging target', () => {
      const res = resolveTargetRemote({ remote: STAGING_PROJECT_REF });
      expect(res.isLocal).toBe(false);
      expect(res.remoteRef).toBe(STAGING_PROJECT_REF);
      expect(res.remoteName).toContain('staging');
    });

    it('resolves local target', () => {
      const res = resolveTargetRemote({ isLocal: true });
      expect(res.isLocal).toBe(true);
      expect(res.remoteName).toContain('local');
    });
  });

  describe('getSelectedTargets', () => {
    it('returns all targets when no filter is provided', () => {
      const targets = getSelectedTargets();
      expect(targets).toHaveLength(6);
    });

    it('filters by exact name', () => {
      const targets = getSelectedTargets(['events']);
      expect(targets).toHaveLength(1);
      expect(targets[0].name).toBe('events');
    });

    it('filters by alias', () => {
      const targets1 = getSelectedTargets(['calendar']);
      expect(targets1).toHaveLength(1);
      expect(targets1[0].name).toBe('events');

      const targets2 = getSelectedTargets(['terms']);
      expect(targets2).toHaveLength(1);
      expect(targets2[0].name).toBe('academic_terms');

      const targets3 = getSelectedTargets(['settings']);
      expect(targets3).toHaveLength(1);
      expect(targets3[0].name).toBe('app_settings');
    });

    it('throws error for unknown entity', () => {
      expect(() => getSelectedTargets(['unknown_entity'])).toThrow(
        /Unknown seed entity "unknown_entity"/,
      );
    });
  });
});

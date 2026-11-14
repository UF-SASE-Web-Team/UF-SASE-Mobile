/// <reference types="node" />

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const PROD_PROJECT_REF = 'lbauzxflhubvbnrkbprp';
export const STAGING_PROJECT_REF = 'yoazhfliefswktpszaob';

export interface SeedTarget {
  name: string;
  aliases: readonly string[];
  description: string;
  filePath: string;
}

export const SEED_TARGETS: readonly SeedTarget[] = [
  {
    name: 'academic_terms',
    aliases: ['terms', 'semesters'],
    description: 'Academic semesters & active term designation',
    filePath: path.resolve('supabase/seeds/01_academic_terms.sql'),
  },
  {
    name: 'app_settings',
    aliases: ['settings', 'config'],
    description: 'Global application settings (e.g. checkin QR code target)',
    filePath: path.resolve('supabase/seeds/02_app_settings.sql'),
  },
  {
    name: 'programs',
    aliases: ['program'],
    description: 'UF SASE official programs and subprogram teams',
    filePath: path.resolve('supabase/seeds/03_programs.sql'),
  },
  {
    name: 'resources',
    aliases: ['resource', 'links'],
    description: 'Curated links, academic guides, and professional tools',
    filePath: path.resolve('supabase/seeds/04_resources.sql'),
  },
  {
    name: 'reviewer_accounts',
    aliases: ['reviewers', 'reviewer', 'alice'],
    description: 'Reviewer test account for app reviews (alice@gmail.com)',
    filePath: path.resolve('supabase/seeds/05_reviewer_accounts.sql'),
  },
  {
    name: 'events',
    aliases: ['event', 'calendar'],
    description: 'UF SASE official calendar events & links (from 06_events.sql)',
    filePath: path.resolve('supabase/seeds/06_events.sql'),
  },
] as const;

export interface SeedOptions {
  remote?: string;
  isLocal?: boolean;
  all?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  only?: string[];
  help?: boolean;
  list?: boolean;
}

export function parseCliArgs(args: string[]): SeedOptions {
  const options: SeedOptions = {
    remote: undefined,
    isLocal: false,
    all: false,
    dryRun: false,
    verbose: false,
    only: undefined,
    help: false,
    list: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg === '--local') {
      options.isLocal = true;
    } else if (arg === '--prod') {
      options.remote = PROD_PROJECT_REF;
    } else if (arg === '--staging') {
      options.remote = STAGING_PROJECT_REF;
    } else if (arg.startsWith('--remote=')) {
      const val = arg.slice('--remote='.length).trim();
      if (val === 'prod') {
        options.remote = PROD_PROJECT_REF;
      } else if (val === 'staging') {
        options.remote = STAGING_PROJECT_REF;
      } else if (val === 'local') {
        options.isLocal = true;
      } else {
        options.remote = val;
      }
    } else if (arg.startsWith('--only=')) {
      const raw = arg.slice('--only='.length);
      options.only = raw
        .split(',')
        .map((s) => s.trim().toLowerCase().replace(/-/g, '_'))
        .filter(Boolean);
    }
  }

  return options;
}

export function resolveTargetRemote(options: SeedOptions): {
  isLocal: boolean;
  remoteRef?: string;
  remoteName: string;
} {
  if (options.isLocal) {
    return { isLocal: true, remoteName: 'local (Docker)' };
  }

  if (options.remote) {
    const name =
      options.remote === PROD_PROJECT_REF
        ? `production (${options.remote})`
        : options.remote === STAGING_PROJECT_REF
          ? `staging (${options.remote})`
          : options.remote;
    return { isLocal: false, remoteRef: options.remote, remoteName: name };
  }

  // Infer from environment
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (url && url.includes(STAGING_PROJECT_REF)) {
    return {
      isLocal: false,
      remoteRef: STAGING_PROJECT_REF,
      remoteName: `staging (${STAGING_PROJECT_REF})`,
    };
  }

  // Default to production
  return {
    isLocal: false,
    remoteRef: PROD_PROJECT_REF,
    remoteName: `production (${PROD_PROJECT_REF})`,
  };
}

export function getSelectedTargets(only?: string[]): SeedTarget[] {
  if (!only || only.length === 0) {
    return [...SEED_TARGETS];
  }

  const selected = new Set<string>();
  for (const filter of only) {
    let matched = false;
    for (const target of SEED_TARGETS) {
      if (target.name === filter || target.aliases.includes(filter)) {
        selected.add(target.name);
        matched = true;
      }
    }
    if (!matched) {
      throw new Error(
        `Unknown seed entity "${filter}". Available entities: ${SEED_TARGETS.map((t) => t.name).join(', ')}`,
      );
    }
  }

  return SEED_TARGETS.filter((t) => selected.has(t.name));
}

export function printHelp(): void {
  console.log(`
🌱 UF SASE SQL Database Seeder

Executes modular SQL seeds against local Docker or remote Supabase databases
using PostgreSQL-native idempotent upserts (ON CONFLICT DO UPDATE).

Usage:
  node scripts/seed.ts [options]

Examples:
  node scripts/seed.ts --prod               # Seed/update all entities on production
  node scripts/seed.ts --prod --only=events # Update only events on production
  node scripts/seed.ts --staging            # Seed/update all entities on staging
  node scripts/seed.ts --local              # Seed/update local Docker database
  node scripts/seed.ts --prod --dry-run     # Preview execution without writing

Target Options:
  --remote=prod, --prod       Target production project (${PROD_PROJECT_REF})
  --remote=staging, --staging Target staging project (${STAGING_PROJECT_REF})
  --remote=<ref>              Target explicit 20-character Supabase project ref
  --local                     Target local Supabase Docker database

Filter & Safety Options:
  --only=<entities>           Comma-separated entities to seed (e.g. --only=events,programs)
  --all, -a                   Required when targeting remote without --only (confirms bulk seed)
  --dry-run, -d               Preview files to run without executing
  --verbose, -v               Show verbose execution details
  --list, -l                  List available seed targets
  --help, -h                  Show this help message

Available Entities:
${SEED_TARGETS.map((t) => `  • ${t.name.padEnd(18)} ${t.description}`).join('\n')}
`);
}

export async function runSeederCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);

  if (options.help) {
    printHelp();
    return;
  }

  if (options.list) {
    console.log('\nAvailable seed targets:');
    for (const target of SEED_TARGETS) {
      console.log(
        `  • ${target.name.padEnd(18)} [${target.aliases.join(', ')}] - ${target.description}`,
      );
    }
    console.log('');
    return;
  }

  const targetRemote = resolveTargetRemote(options);

  // Safety guard: prevent accidental bulk seeding against remote databases without explicit intent
  if (!targetRemote.isLocal && !options.only && !options.all) {
    console.error(
      `\n⚠️  SAFETY GUARD: Targeting remote ${targetRemote.remoteName}.\n` +
        `   To prevent unintended bulk updates, please specify which entity to seed:\n\n` +
        `   • To sync events only (recommended): node scripts/seed.ts ${options.remote ? `--remote=${options.remote}` : '--prod'} --only=events\n` +
        `   • To apply all baseline seeds       : node scripts/seed.ts ${options.remote ? `--remote=${options.remote}` : '--prod'} --all\n` +
        `   • To preview execution without writes: node scripts/seed.ts ${options.remote ? `--remote=${options.remote}` : '--prod'} --dry-run --all\n`,
    );
    process.exit(1);
  }

  const targetsToRun = getSelectedTargets(options.only);

  console.log('='.repeat(64));
  console.log(`🌱 UF SASE DATABASE SEEDER`);
  console.log(`📡 Target      : ${targetRemote.remoteName}`);
  console.log(`⚙️  Execution   : ${options.dryRun ? '🔍 DRY RUN (Preview only)' : '🚀 LIVE SEED'}`);
  console.log(`📦 Seed Files  : ${targetsToRun.map((t) => t.name).join(', ')}`);
  console.log('='.repeat(64));

  const startTime = Date.now();
  const summary: {
    name: string;
    file: string;
    durationMs: number;
    status: 'SUCCESS' | 'DRY_RUN' | 'FAILED';
  }[] = [];

  for (const target of targetsToRun) {
    const relPath = path.relative(process.cwd(), target.filePath);
    process.stdout.write(`\n⏳ Applying [${target.name}] (${relPath})... `);

    if (!fs.existsSync(target.filePath)) {
      console.log('❌ NOT FOUND');
      throw new Error(`Seed file not found: ${target.filePath}`);
    }

    if (options.dryRun) {
      console.log('🔍 OK (Dry Run)');
      summary.push({ name: target.name, file: relPath, durationMs: 0, status: 'DRY_RUN' });
      continue;
    }

    const start = Date.now();
    try {
      let cmd: string;
      if (targetRemote.isLocal) {
        cmd = `npx supabase db query --file ${target.filePath}`;
      } else {
        cmd = `npx supabase db query --remote=${targetRemote.remoteRef} --file ${target.filePath} --yes`;
      }

      if (options.verbose) {
        console.log(`\n   Executing: ${cmd}`);
      }

      execSync(cmd, { stdio: options.verbose ? 'inherit' : 'pipe' });
      const durationMs = Date.now() - start;
      console.log(`✅ Done (${durationMs}ms)`);
      summary.push({ name: target.name, file: relPath, durationMs, status: 'SUCCESS' });
    } catch (err: any) {
      console.log('❌ FAILED');
      const stderr = err?.stderr ? err.stderr.toString() : err?.message || String(err);
      console.error(`\n❌ Error applying seed [${target.name}]:`, stderr);
      process.exit(1);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(64));
  console.log(`📊 SEED SUMMARY (${totalTime}s)`);
  console.log('='.repeat(64));
  console.log(
    `${'Entity'.padEnd(20)} | ${'Status'.padEnd(10)} | ${'Duration'.padStart(10)} | ${'File'}`,
  );
  console.log('-'.repeat(64));

  for (const item of summary) {
    console.log(
      `${item.name.padEnd(20)} | ${item.status.padEnd(10)} | ${(item.durationMs + 'ms').padStart(10)} | ${item.file}`,
    );
  }
  console.log('='.repeat(64));

  if (options.dryRun) {
    console.log(
      '\n🔍 Dry run completed successfully. No changes were committed to the database.\n',
    );
  } else {
    console.log('\n✨ Database seeding completed successfully!\n');
  }
}

const isMain =
  (typeof require !== 'undefined' && require.main === module) ||
  Boolean(process.argv[1] && process.argv[1].includes('seed'));

if (isMain) {
  runSeederCli().catch((err) => {
    console.error('Fatal unhandled error:', err);
    process.exit(1);
  });
}

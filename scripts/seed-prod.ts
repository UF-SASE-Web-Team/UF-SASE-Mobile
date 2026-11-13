/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase.ts';
import {
  SEEDERS,
  type EntitySeeder,
  type SeedOptions,
  type SeedResult,
  type SupabaseAdminClient,
} from '../supabase/seeds/index.ts';

// Auto-load environment files if present
function loadEnv(customFile?: string): void {
  const envFiles = customFile ? [customFile] : ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      if (typeof (process as any).loadEnvFile === 'function') {
        try {
          (process as any).loadEnvFile(fullPath);
        } catch {
          // ignore duplicate or malformed errors
        }
      } else {
        // Fallback simple line parser for environments without process.loadEnvFile
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed
              .slice(eqIdx + 1)
              .trim()
              .replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } else if (customFile) {
      console.warn(`⚠️ Warning: Specified environment file not found: ${customFile}`);
    }
  }
}

interface CliOptions extends SeedOptions {
  envFile?: string;
  only?: string[];
  help?: boolean;
  list?: boolean;
}

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    verbose: false,
    envFile: undefined,
    only: undefined,
    help: false,
    list: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg.startsWith('--env-file=')) {
      options.envFile = arg.slice('--env-file='.length);
    } else if (arg.startsWith('--env=')) {
      options.envFile = arg.slice('--env='.length);
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

function printHelp(): void {
  console.log(`
🌱 Supabase Production Seeder

Usage:
  npx tsx scripts/seed-prod.ts [options]
  npx tsx --env-file=<path> scripts/seed-prod.ts [options]
  node scripts/seed-prod.ts [options]

Options:
  --env-file=<path>   Path to environment file (e.g. --env-file=.env.production)
  --dry-run, -d       Preview changes without writing to the database
  --only=<entities>   Comma-separated list of entities to seed (e.g. --only=programs,resources)
  --verbose, -v       Show detailed item-by-item logs
  --list, -l          List available seed entities
  --help, -h          Show this help message

Available Entities:
${SEEDERS.map((s) => `  - ${s.name.padEnd(16)} ${s.description}`).join('\n')}

Required Environment Variables:
  SUPABASE_SERVICE_ROLE_KEY   Service role admin key (bypasses RLS)
  SUPABASE_URL                Supabase project URL (or EXPO_PUBLIC_SUPABASE_URL)
`);
}

function printList(): void {
  console.log('\nAvailable seed entities:');
  for (const seeder of SEEDERS) {
    console.log(`  • ${seeder.name.padEnd(18)} - ${seeder.description}`);
  }
  console.log('');
}

function getClient(url: string, serviceKey: string): SupabaseAdminClient {
  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function runSeederCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);
  loadEnv(options.envFile);

  if (options.help) {
    printHelp();
    return;
  }

  if (options.list) {
    printList();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error(
      '\n❌ Error: Missing Supabase URL.\n' +
        'Please set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL in your .env or .env.local file.\n',
    );
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error(
      '\n❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Seeding production baseline data requires admin privileges to bypass RLS and manage system records.\n' +
        'Please set SUPABASE_SERVICE_ROLE_KEY in your .env or .env.local file.\n',
    );
    process.exit(1);
  }

  let seedersToRun: readonly EntitySeeder[] = SEEDERS;
  if (options.only && options.only.length > 0) {
    const ALIASES: Record<string, string> = {
      alice: 'reviewer_accounts',
      reviewer: 'reviewer_accounts',
      reviewers: 'reviewer_accounts',
      terms: 'academic_terms',
      semesters: 'academic_terms',
      settings: 'app_settings',
      event: 'events',
      calendar: 'events',
    };
    const selected = options.only.map((name) => ALIASES[name] || name);
    seedersToRun = SEEDERS.filter((s) => selected.includes(s.name.replace(/-/g, '_')));

    if (seedersToRun.length === 0) {
      console.error(
        `\n❌ Error: No matching seeders found for filter: ${options.only.join(', ')}\n` +
          `Available seeders: ${SEEDERS.map((s) => s.name).join(', ')}\n`,
      );
      process.exit(1);
    }
  }

  let host = supabaseUrl;
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    // keep as is
  }

  console.log('='.repeat(64));
  console.log(`🌱 UF SASE SUPABASE PRODUCTION SEEDER`);
  console.log(`📡 Target Host : ${host}`);
  console.log(`⚙️  Execution   : ${options.dryRun ? '🔍 DRY RUN (No writes)' : '🚀 LIVE SEED'}`);
  console.log(`📦 Seeders     : ${seedersToRun.map((s) => s.name).join(', ')}`);
  console.log('='.repeat(64));

  const supabase = getClient(supabaseUrl, serviceRoleKey);
  const results: SeedResult[] = [];
  const startTime = Date.now();

  for (const seeder of seedersToRun) {
    process.stdout.write(`\n⏳ Seeding [${seeder.name}]... `);
    try {
      const seederStart = Date.now();
      const res = await seeder.seed(supabase, {
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
      const durationMs = Date.now() - seederStart;
      console.log(`✅ Done (${durationMs}ms)`);
      console.log(
        `   ↳ Total: ${res.total} | Inserted: ${res.inserted} | Updated: ${res.updated} | Unchanged: ${res.skipped}`,
      );

      if (options.verbose && res.details && res.details.length > 0) {
        for (const detail of res.details) {
          console.log(`     • ${detail}`);
        }
      }

      results.push(res);
    } catch (err: any) {
      console.log(`❌ FAILED`);
      console.error(`\n❌ Error while seeding [${seeder.name}]:`, err?.message || err);
      process.exit(1);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(64));
  console.log(`📊 SEED SUMMARY (${totalTime}s)`);
  console.log('='.repeat(64));
  console.log(
    `${'Entity'.padEnd(20)} | ${'Inserted'.padStart(9)} | ${'Updated'.padStart(9)} | ${'Unchanged'.padStart(10)} | ${'Total'.padStart(7)}`,
  );
  console.log('-'.repeat(64));

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let grandTotal = 0;

  for (const r of results) {
    totalInserted += r.inserted;
    totalUpdated += r.updated;
    totalSkipped += r.skipped;
    grandTotal += r.total;

    console.log(
      `${r.entity.padEnd(20)} | ${String(r.inserted).padStart(9)} | ${String(r.updated).padStart(9)} | ${String(r.skipped).padStart(10)} | ${String(r.total).padStart(7)}`,
    );
  }

  console.log('-'.repeat(64));
  console.log(
    `${'TOTAL'.padEnd(20)} | ${String(totalInserted).padStart(9)} | ${String(totalUpdated).padStart(9)} | ${String(totalSkipped).padStart(10)} | ${String(grandTotal).padStart(7)}`,
  );
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
  Boolean(process.argv[1] && process.argv[1].includes('seed-prod'));

if (isMain) {
  runSeederCli().catch((err) => {
    console.error('Fatal unhandled error:', err);
    process.exit(1);
  });
}

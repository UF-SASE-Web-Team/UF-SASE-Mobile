# Database Guide

## Overview

### Environments

Backend developers primarily make schema changes locally. Remote commands are for deploying to staging (or prod). Read more about environment separation [here](https://dev.to/chrismbah/dev-staging-and-production-environments-what-they-mean-in-software-development-90a).

| Environment | Where | Used for | Used by |
|---|---|---|---|
| Local | Docker on your machine via `supabase start` | Developing and testing migrations | Anyone changing the schema
| Staging | Supabase project ([sase-app-staging](https://supabase.com/dashboard/project/yoazhfliefswktpszaob)) | Verifying changes in shared, consistent remote project | Everyone. Fronend developers can use this and skip Docker
| Prod | Supabase project | Real user data | Leads only.

## Migrations

A migration is an SQL file that describes an addition to the schema and lives in `supabase/migrations/`.

- Each file starts with a timestamp (e.g., `20261003021032_init_schema`).
- Files run in filename order, each Supabase instance keeps track of migrations its run.
- Migrations are append-only. Never edit one that has been merged, and instead write new ones.
- The migrations folder is the source of truth and chronological history of a database schema.

## Setup

### Local

1. Install and start Docker Desktop.
2. Clone the repo and run `npm install`.
3. Run `npx supabase start`. The first run installs the Supabase stack (Postgres, Auth, Studio, etc.).
4. Access Studio from the URL printed in the terminal.

### Linking Remote

1. Ask lead for Supabase project perms.
2. Run `npx supabase login` and sign in to Supabase account.
3. Run `npx supabase projects list` to find reference id for project.
4. Run `npx supabase link --project-ref <ref-id>`.

## Key Commands

### Local Commands

| Supabase Command | Description |
|---|---|
| `npx supabase start` | Start local Supabase stack |
| `npx supabase stop` | Stop local Supabase stack |
| `npx supabase db reset` | Resets local DB, run all migrations and `seed.sql` |
| `npx supabase db migration new <name>` | Create a named empty migration file |
| `npx supabase db diff -f <name>` | Generate a named migration file from local Studio changes |

### Remote Commands

| Supabase Command | Description |
|---|---|
| `npx supabase migration list` | Compare local and remote migration history |
| `npx supabase db push --dry-run` | Preview what push would apply |
| `npx supabase db push` | Apply pending migrations to the linked remote |

## Creating Migrations

### Method 1: Write SQL (Preferred)

1. Start local Supabase stack: `npx supabase start`
2. Create a named empty migration file: `npx supabase db migration new <descriptive-name>`.
3. Write your SQL in the new file.
4. Update `seed.sql` with mock data if you added a new table or column.
5. Run `npx supabase db reset` to confirm migration applies cleanly.
5. Git commit the migration file when finished.

### Method 2: Studio UI to SQL

1. Start local Supabase stack: `npx supabase start`
2. Make your changes in the local Studio.
3. `npx supabase db diff -f <descriptive-name>`
4. Verify the generated migration.
5. Run `npx supabase db reset` to confirm migration applies cleanly from scratch.
6. Git commit the migration file when finished.

Video: [How to Manage Database Migration Using Supabase CLI - SupabaseTips](https://www.youtube.com/watch?v=Kx5nHBmIxyQ)

## Notes and Best Practices

- Never edit a migration file that has been merged.
- Never change staging or prod schema directly in Studio.
- After pulling new migrations, run `db reset`.
- Always run `db reset` before committing a migration.
- Development data that lives beyond `db reset`'s belongs in `seed.sql`.
- When a migration adds a new table or column update `seed.sql` at the same time.
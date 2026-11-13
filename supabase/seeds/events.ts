import fs from 'node:fs';
import path from 'node:path';
import type { Database } from '../../src/types/supabase.ts';
import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventLinkInsert = Database['public']['Tables']['event_links']['Insert'];

function parseSqlStringLiteral(str: string): string | null {
  if (str === 'NULL') return null;
  if (str.startsWith("'") && str.endsWith("'")) {
    return str.slice(1, -1).replace(/''/g, "'");
  }
  return str;
}

function parseSqlTuples(valuesBlock: string): string[] {
  const tuples: string[] = [];
  let inTuple = false;
  let inString = false;
  let currentTuple = '';

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];
    const nextChar = valuesBlock[i + 1];

    if (inString) {
      currentTuple += char;
      if (char === "'") {
        if (nextChar === "'") {
          currentTuple += nextChar;
          i++;
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'") {
        inString = true;
        currentTuple += char;
      } else if (char === '(' && !inTuple) {
        inTuple = true;
        currentTuple = '';
      } else if (char === ')' && inTuple) {
        inTuple = false;
        tuples.push(currentTuple);
        currentTuple = '';
      } else if (inTuple) {
        currentTuple += char;
      }
    }
  }
  return tuples;
}

function splitTupleFields(tupleContent: string): string[] {
  const fields: string[] = [];
  let inString = false;
  let current = '';

  for (let i = 0; i < tupleContent.length; i++) {
    const char = tupleContent[i];
    const nextChar = tupleContent[i + 1];

    if (inString) {
      current += char;
      if (char === "'") {
        if (nextChar === "'") {
          current += nextChar;
          i++;
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'") {
        inString = true;
        current += char;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) {
    fields.push(current.trim());
  }
  return fields;
}

export function loadEventsFromSql(sqlFilePath?: string): {
  events: EventInsert[];
  links: EventLinkInsert[];
} {
  const resolvedPath = sqlFilePath || path.resolve(process.cwd(), 'supabase/seeds/events.sql');

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Events seed SQL file not found at: ${resolvedPath}.\nRun "npx tsx scripts/seed-events.ts" to generate it from the SASE calendar.`,
    );
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');

  // Extract events block
  const eventsMatch = content.match(
    /INSERT INTO public\.events[\s\S]*?VALUES\s*([\s\S]*?)\s*ON CONFLICT/,
  );
  if (!eventsMatch) {
    throw new Error(`Failed to parse events INSERT block from: ${resolvedPath}`);
  }

  const rawEventTuples = parseSqlTuples(eventsMatch[1]);
  const events: EventInsert[] = rawEventTuples.map((t) => {
    const f = splitTupleFields(t);
    return {
      id: parseSqlStringLiteral(f[0]) || undefined,
      title: parseSqlStringLiteral(f[1]) || '',
      description: parseSqlStringLiteral(f[2]),
      type: parseSqlStringLiteral(f[3]) as any,
      starts_at: parseSqlStringLiteral(f[4].replace('::timestamptz', '')) || '',
      ends_at: parseSqlStringLiteral(f[5].replace('::timestamptz', '')) || '',
      location_name: parseSqlStringLiteral(f[6]) || '',
      address: parseSqlStringLiteral(f[7]),
      lat: f[8] === 'NULL' ? null : parseFloat(f[8]),
      lng: f[9] === 'NULL' ? null : parseFloat(f[9]),
      points_value: parseInt(f[10], 10) || 1,
    };
  });

  // Extract links block
  const links: EventLinkInsert[] = [];
  const linksMatch = content.match(/INSERT INTO public\.event_links[\s\S]*?VALUES\s*([\s\S]*?);/);
  if (linksMatch) {
    const rawLinkTuples = parseSqlTuples(linksMatch[1]);
    for (const t of rawLinkTuples) {
      const f = splitTupleFields(t);
      links.push({
        event_id: parseSqlStringLiteral(f[0]) || '',
        title: parseSqlStringLiteral(f[1]) || '',
        url: parseSqlStringLiteral(f[2]) || '',
        display_order: parseInt(f[3], 10) || 0,
      });
    }
  }

  return { events, links };
}

export async function seedEvents(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const { events, links } = loadEventsFromSql();

  const result: SeedResult = {
    entity: 'events',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: events.length,
    details: [],
  };

  // 1. Fetch existing events
  const { data: existingRows, error: fetchErr } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, location_name, address, type');

  if (fetchErr) {
    throw new Error(`Failed to query existing events: ${fetchErr.message}`);
  }

  const existingById = new Map((existingRows ?? []).map((row) => [row.id, row]));

  const toInsert: EventInsert[] = [];
  const toUpdate: EventInsert[] = [];

  for (const event of events) {
    const existing = event.id ? existingById.get(event.id) : undefined;

    if (!existing) {
      toInsert.push(event);
      result.inserted++;
      if (options.verbose) {
        result.details?.push(
          `${options.dryRun ? '[DRY RUN] Would insert' : 'Inserted'} event: ${event.title}`,
        );
      }
    } else {
      const needsUpdate =
        existing.title !== event.title ||
        new Date(existing.starts_at).getTime() !== new Date(event.starts_at).getTime() ||
        new Date(existing.ends_at).getTime() !== new Date(event.ends_at).getTime() ||
        existing.location_name !== event.location_name ||
        existing.address !== event.address ||
        existing.type !== event.type;

      if (needsUpdate) {
        toUpdate.push(event);
        result.updated++;
        if (options.verbose) {
          result.details?.push(
            `${options.dryRun ? '[DRY RUN] Would update' : 'Updated'} event: ${event.title}`,
          );
        }
      } else {
        result.skipped++;
      }
    }
  }

  if (options.dryRun) {
    result.details?.push(
      `[DRY RUN] ${result.inserted} to insert, ${result.updated} to update, ${result.skipped} unchanged. Links to sync: ${links.length}.`,
    );
    return result;
  }

  // 2. Perform live upsert in batches of 50
  const allUpserts = [...toInsert, ...toUpdate];
  for (let i = 0; i < allUpserts.length; i += 50) {
    const batch = allUpserts.slice(i, i + 50);
    const { error: upsertErr } = await supabase.from('events').upsert(batch);
    if (upsertErr) {
      throw new Error(`Failed to upsert events batch: ${upsertErr.message}`);
    }
  }

  // 3. Synchronize child links
  if (links.length > 0) {
    const seededEventIds = Array.from(new Set(links.map((l) => l.event_id)));

    // Clear old links for seeded events to prevent duplicates
    for (let i = 0; i < seededEventIds.length; i += 50) {
      const idBatch = seededEventIds.slice(i, i + 50);
      const { error: delErr } = await supabase.from('event_links').delete().in('event_id', idBatch);
      if (delErr) {
        throw new Error(`Failed to clear old event links: ${delErr.message}`);
      }
    }

    // Insert new links with generated IDs
    for (let i = 0; i < links.length; i += 50) {
      const linkBatch = links.slice(i, i + 50);
      const { data: insertedLinks, error: insertErr } = await supabase
        .from('event_links')
        .insert(linkBatch)
        .select('id, event_id, title');

      if (insertErr) {
        throw new Error(`Failed to insert event links: ${insertErr.message}`);
      }

      // 4. Update events.rsvp if link is RSVP
      if (insertedLinks) {
        for (const link of insertedLinks) {
          const isRsvp = /rsvp|sign\s*up/i.test(link.title);
          if (isRsvp) {
            await supabase
              .from('events')
              .update({ rsvp: link.id })
              .eq('id', link.event_id)
              .is('rsvp', null);
          }
        }
      }
    }
  }

  return result;
}

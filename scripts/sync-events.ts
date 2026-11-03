/// <reference types="node" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Types
type EventType = 'gbm' | 'career' | 'social' | 'team' | 'other';

interface StandardLocation {
  location_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

interface ParsedEvent {
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  type: EventType;
  checkin_code?: string;
  points_value: number;
}

// Patterns identifying application deadlines, form closures, etc. (to ignore)
const DEADLINE_PATTERNS = [
  /\bapps?\s+close/i,
  /\bapplications?\s+close/i,
  /\bapps?\s+open/i,
  /\bapplications?\s+open/i,
  /\bapps?\s+due\b/i,
  /\bapplications?\s+due\b/i,
  /\bdeadline\b/i,
  /\bdue!\b/i,
  /\bscholarship\s+due/i,
  /\bforms?\s+close/i,
  /\border\s+forms?\b/i,
  /\borders?\s+close/i,
  /\bregistration\s+closes?\b/i,
  /\bsign\s*ups?\s+close\b/i,
  /\brosters?\s+close\b/i,
  /\bcycle\s+\d+\s+closes?\b/i,
];

function isApplicationDeadline(title: string): boolean {
  return DEADLINE_PATTERNS.some((pattern) => pattern.test(title));
}

// Common UF Buildings & Campus Locations Directory
// Formats location_name into short recognizable building codes (e.g. TUR 2319, LIT 0121)
// and address into descriptive full building location + street address.
interface BuildingRule {
  pat: RegExp;
  nameTpl: string;
  addr: string;
  lat: number;
  lng: number;
}

const BUILDING_PATTERNS: BuildingRule[] = [
  {
    pat: /(?:turlington(?:\s+hall)?|turl?)\s*([a-z]?\s*\d+)/i,
    nameTpl: 'TUR $1',
    addr: 'Turlington Hall, 330 Newell Dr, Gainesville, FL 32611',
    lat: 29.6499,
    lng: -82.3439,
  },
  {
    pat: /turlington(?:\s+hall)?/i,
    nameTpl: 'TUR',
    addr: 'Turlington Hall, 330 Newell Dr, Gainesville, FL 32611',
    lat: 29.6499,
    lng: -82.3439,
  },
  {
    pat: /(?:little(?:\s+hall)?|lit)\s*([a-z]?\s*\d+)/i,
    nameTpl: 'LIT $1',
    addr: 'Little Hall, 1400 Stadium Rd, Gainesville, FL 32611',
    lat: 29.6487,
    lng: -82.3406,
  },
  {
    pat: /little(?:\s+hall)?/i,
    nameTpl: 'LIT',
    addr: 'Little Hall, 1400 Stadium Rd, Gainesville, FL 32611',
    lat: 29.6487,
    lng: -82.3406,
  },
  {
    pat: /(?:wei[lm](?:\s+hall)?)\s*([a-z]?\s*\d+)/i,
    nameTpl: 'WEIL $1',
    addr: 'Weil Hall, 1949 Stadium Rd, Gainesville, FL 32611',
    lat: 29.6484,
    lng: -82.3488,
  },
  {
    pat: /wei[lm](?:\s+hall)?/i,
    nameTpl: 'WEIL',
    addr: 'Weil Hall, 1949 Stadium Rd, Gainesville, FL 32611',
    lat: 29.6484,
    lng: -82.3488,
  },
  {
    pat: /npb\s*([a-z]?\s*\d+)/i,
    nameTpl: 'NPB $1',
    addr: 'New Physics Building, 2001 Museum Rd, Gainesville, FL 32611',
    lat: 29.6441,
    lng: -82.3508,
  },
  {
    pat: /mcca\s*([a-z]?\s*\d+)/i,
    nameTpl: 'MCCA $1',
    addr: 'Matherly Hall, 1405 W University Ave, Gainesville, FL 32611',
    lat: 29.6515,
    lng: -82.3424,
  },
  {
    pat: /cse\s*([a-z]?\s*\d+)/i,
    nameTpl: 'CSE $1',
    addr: 'Computer Science & Engineering, 432 Newell Dr, Gainesville, FL 32611',
    lat: 29.6484,
    lng: -82.3441,
  },
  {
    pat: /arrend?ondo\s+cafe/i,
    nameTpl: 'Reitz (Arredondo Cafe)',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /matthew\'?s\s+suite/i,
    nameTpl: 'Reitz (Matthews Suite)',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /reitz\s+(?:union\s+)?auditorium/i,
    nameTpl: 'Reitz Auditorium',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /reitz(?:\s+union)?\s*(?:room\s*)?(\d+)/i,
    nameTpl: 'Reitz $1',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /reitz(?:\s+union)?\s+food\s+court/i,
    nameTpl: 'Reitz (Food Court)',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /reitz(?:\s+union)?/i,
    nameTpl: 'Reitz',
    addr: 'J. Wayne Reitz Union, 655 Reitz Union Drive, Gainesville, FL 32611',
    lat: 29.6465,
    lng: -82.3477,
  },
  {
    pat: /(?:malachowsky(?:\s+hall)?|mala)\s*([a-z]?\s*\d+)/i,
    nameTpl: 'MALA $1',
    addr: 'Malachowsky Hall, 1889 Museum Rd, Gainesville, FL 32611',
    lat: 29.6445,
    lng: -82.3482,
  },
  {
    pat: /malachowsky(?:\s+hall)?|mala/i,
    nameTpl: 'MALA',
    addr: 'Malachowsky Hall, 1889 Museum Rd, Gainesville, FL 32611',
    lat: 29.6445,
    lng: -82.3482,
  },
  {
    pat: /marston(?:\s+science\s+library|\s+library)?/i,
    nameTpl: 'Marston Library',
    addr: 'Marston Science Library, 444 Newell Dr, Gainesville, FL 32611',
    lat: 29.648,
    lng: -82.3438,
  },
  {
    pat: /(?:herbert\s+wertheim(?:\s+college\s+of\s+engineering)?|wertheim(?:\s+hall)?|wert)\s*([a-z]?\s*\d+)/i,
    nameTpl: 'WERT $1',
    addr: 'Herbert Wertheim College of Engineering, Gainesville, FL 32611',
    lat: 29.6484,
    lng: -82.3488,
  },
  {
    pat: /(?:herbert\s+wertheim(?:\s+college\s+of\s+engineering)?|wertheim(?:\s+hall)?|wert)(?:\s+lobby)?/i,
    nameTpl: 'WERT',
    addr: 'Herbert Wertheim College of Engineering, Gainesville, FL 32611',
    lat: 29.6484,
    lng: -82.3488,
  },
  {
    pat: /flavet\s+field/i,
    nameTpl: 'Flavet Field',
    addr: 'Flavet Field, Woodlawn Dr, Gainesville, FL 32603',
    lat: 29.6468,
    lng: -82.3551,
  },
  {
    pat: /lake\s+wauburg/i,
    nameTpl: 'Lake Wauburg',
    addr: 'Lake Wauburg, 133 Wave Rd, Micanopy, FL 32667',
    lat: 29.5297,
    lng: -82.3023,
  },
  {
    pat: /lake\s+alice(?:\s+field)?/i,
    nameTpl: 'Lake Alice Field',
    addr: 'Lake Alice Field, Museum Rd, Gainesville, FL 32611',
    lat: 29.6429,
    lng: -82.3582,
  },
  {
    pat: /plaza\s+of\s+the\s+americas/i,
    nameTpl: 'Plaza of the Americas',
    addr: 'Plaza of the Americas, Gainesville, FL 32611',
    lat: 29.6504,
    lng: -82.3429,
  },
  {
    pat: /depot\s+park/i,
    nameTpl: 'Depot Park',
    addr: 'Depot Park, 874 SE 4th St, Gainesville, FL 32601',
    lat: 29.6436,
    lng: -82.323,
  },
  {
    pat: /vilano\s+beach/i,
    nameTpl: 'Vilano Beach',
    addr: 'Vilano Beach, St. Augustine, FL 32084',
    lat: 29.9175,
    lng: -81.2987,
  },
  {
    pat: /icbr(?:\s+room)?\s*(\d+)?/i,
    nameTpl: 'ICBR $1',
    addr: 'ICBR Room 189, 2033 Mowry Rd, Gainesville, FL 32608',
    lat: 29.6405,
    lng: -82.3533,
  },
  {
    pat: /seattle\s+convention\s+center/i,
    nameTpl: 'Seattle Convention Center',
    addr: '705 Pike St, Seattle, WA 98101',
    lat: 47.6114,
    lng: -122.3327,
  },
  {
    pat: /4501\s+sw\s+20th\s+ave/i,
    nameTpl: 'Adopt-A-Street',
    addr: '4501 SW 20th Ave, Gainesville, FL 32607',
    lat: 29.6268,
    lng: -82.3882,
  },
];

const LOCAL_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const LOCAL_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function unescapeIcs(str: string): string {
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function cleanDescription(html: string | undefined): string | null {
  if (!html) return null;
  let text = unescapeIcs(html);
  // Convert <br> variants to newlines
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  // Convert <a href="url">text</a> to text (url)
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)');
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Clean up excess vertical whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text || null;
}

function parseIcsDate(dateStr: string | undefined, defaultOffsetHours = 0): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // All-day date (YYYYMMDD)
  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    // UF is America/New_York (UTC-4 during daylight savings, UTC-5 during standard time)
    const monthNum = parseInt(m, 10);
    const isEDT = monthNum >= 4 && monthNum <= 10;
    const tzOffset = isEDT ? '-04:00' : '-05:00';
    return new Date(`${y}-${m}-${d}T00:00:00${tzOffset}`).toISOString();
  }

  // UTC timestamp (YYYYMMDDTHHMMSSZ)
  if (clean.endsWith('Z')) {
    const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (match) {
      const [, y, m, d, h, min, s] = match;
      return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s)).toISOString();
    }
  }

  // Fallback to standard Date parsing
  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    if (defaultOffsetHours) {
      return new Date(parsed.getTime() + defaultOffsetHours * 3600000).toISOString();
    }
    return parsed.toISOString();
  }

  return null;
}

function extractLocationFromDescription(desc: string | null): string | null {
  if (!desc) return null;
  // Clean HTML tags and decode entities first to prevent leftover tags
  const text = unescapeIcs(desc)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
  // Look for "Location: <value>" or "📍 Location: <value>"
  const match = text.match(/Location:\s*([^\n\r•;|]+)/i);
  if (match) {
    let loc = match[1].trim();
    // Strip trailing markers like sign-up links, questions, emojis
    loc = loc.replace(
      /(🔗|\bSign-up\b|\bRSVP\b|\bAttire:\b|\bIf you have any questions\b|--|👔|⏰|🗓️).*/i,
      '',
    );
    loc = loc.replace(/[\s\u00A0.,-]+$/, '').trim();
    if (loc.length > 0 && loc.toLowerCase() !== 'tbd') {
      return loc;
    }
  }
  return null;
}

function resolveStandardLocation(
  rawLocation: string | undefined,
  rawDescription: string | undefined,
): StandardLocation {
  const cleanLoc = rawLocation ? unescapeIcs(rawLocation).trim() : '';
  const descLoc =
    extractLocationFromDescription(rawDescription ? unescapeIcs(rawDescription) : null) || '';
  const locationSource = `${cleanLoc} ${descLoc}`.trim();
  const desc = rawDescription ? unescapeIcs(rawDescription) : '';

  // 1. Check physical buildings first in locationSource
  for (const b of BUILDING_PATTERNS) {
    const m = locationSource.match(b.pat);
    if (m) {
      let locName = b.nameTpl;
      if (locName.includes('$1')) {
        const rm = m[1] ? m[1].replace(/\s+/g, '').toUpperCase() : '';
        locName = locName.replace('$1', rm);
      }
      return {
        location_name: locName.trim(),
        address: b.addr,
        lat: b.lat,
        lng: b.lng,
      };
    }
  }

  // 2. Check Discord specifically in locationSource (or if explicitly a Discord event)
  if (/\bdiscord\b/i.test(locationSource)) {
    const linkMatch = desc.match(/https?:\/\/discord\.(?:gg|com\/invite)\/[^\s\)"<]+/i);
    const chanMatch = desc.match(/#([a-zA-Z0-9_-]+)/);
    const address = linkMatch ? linkMatch[0] : chanMatch ? `#${chanMatch[1]}` : 'SASE Discord';
    return {
      location_name: 'Discord',
      address,
      lat: null,
      lng: null,
    };
  }

  // 3. Check Zoom / Virtual in locationSource
  if (/\bzoom\b/i.test(locationSource) || /\bvirtual\b/i.test(locationSource)) {
    const linkMatch = desc.match(/https?:\/\/[a-zA-Z0-9_-]+\.zoom\.us\/[^\s\)"<]+/i);
    const address = linkMatch ? linkMatch[0] : 'Virtual via Zoom';
    return {
      location_name: 'Zoom',
      address,
      lat: null,
      lng: null,
    };
  }

  // 4. Fallback if a location string was specified
  if (descLoc && descLoc.toLowerCase() !== 'tbd') {
    return { location_name: descLoc, address: null, lat: null, lng: null };
  }
  if (cleanLoc && cleanLoc.toLowerCase() !== 'tbd') {
    return { location_name: cleanLoc, address: null, lat: null, lng: null };
  }

  return { location_name: 'TBD', address: null, lat: null, lng: null };
}

function classifyEventType(title: string, desc: string | null = ''): EventType {
  const combined = `${title} ${desc || ''}`.toLowerCase();
  if (combined.includes('gbm') || combined.includes('general body meeting')) {
    return 'gbm';
  }
  if (
    [
      'resume',
      'career',
      'interview',
      'elevator pitch',
      'pitch',
      'networking',
      'sponsor',
      'build night',
      'workshop',
      'tech talk',
      'company info',
      'info session',
      'industry',
    ].some((k) => combined.includes(k))
  ) {
    return 'career';
  }
  if (
    [
      'social',
      'hunt',
      'scavenger',
      'game',
      'games',
      'banquet',
      'volleyball',
      'gimbap',
      'ball run',
      'picnic',
      'retreat',
      'party',
      'dinner',
      'lunch',
      'ice cream',
      'karaoke',
      'potluck',
      'field day',
      'speed friending',
      'pickleball',
      'munch & mingle',
      'ultimate frisbee',
    ].some((k) => combined.includes(k))
  ) {
    return 'social';
  }
  if (
    ['team', 'committee', 'sweet', 'set', 'interns', 'board', 'leads'].some((k) =>
      combined.includes(k),
    )
  ) {
    return 'team';
  }
  return 'other';
}

function parseIcsContent(icsData: string): ParsedEvent[] {
  // 1. Unfold lines according to RFC 5545
  const rawLines = icsData.split(/\r?\n/);
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else {
      unfolded.push(line);
    }
  }

  // 2. Extract VEVENT blocks
  let inEvent = false;
  let cur: Record<string, string> = {};
  const rawEvents: Record<string, string>[] = [];

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      cur = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      rawEvents.push(cur);
    } else if (inEvent) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const fullKey = line.slice(0, idx);
        const val = line.slice(idx + 1);
        const key = fullKey.split(';')[0];
        cur[key] = val;
      }
    }
  }

  // 3. Transform to ParsedEvent
  const parsedEvents: ParsedEvent[] = [];
  let skippedDeadlines = 0;

  for (const raw of rawEvents) {
    const title = unescapeIcs(raw.SUMMARY || 'Untitled Event').trim();

    // Skip application deadlines, form closures, etc.
    if (isApplicationDeadline(title)) {
      skippedDeadlines++;
      continue;
    }

    const rawDesc = raw.DESCRIPTION;
    const description = cleanDescription(rawDesc);

    const startsAt = parseIcsDate(raw.DTSTART);
    if (!startsAt) continue;

    let endsAt = parseIcsDate(raw.DTEND);
    if (!endsAt || endsAt <= startsAt) {
      endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
    }

    // Standardize location: short code for location_name, full address for address
    const standardLoc = resolveStandardLocation(raw.LOCATION, rawDesc);
    const type = classifyEventType(title, description);

    parsedEvents.push({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      location_name: standardLoc.location_name,
      address: standardLoc.address,
      lat: standardLoc.lat,
      lng: standardLoc.lng,
      type,
      points_value: 1,
    });
  }

  console.log(`Filtered out ${skippedDeadlines} application/form deadlines.`);

  // Sort chronologically by starts_at
  parsedEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return parsedEvents;
}

const DEFAULT_CALENDAR_URL =
  process.env.SASE_CALENDAR_URL ||
  'https://calendar.google.com/calendar/ical/e24a44ee200ef77976669ed34b153649852357066a2137c9a9fb6e0888fad00c%40group.calendar.google.com/public/basic.ics';

async function loadIcsContent(sourceArg?: string): Promise<{ data: string; source: string }> {
  // 1. Explicit argument provided (URL or local file)
  if (sourceArg) {
    if (sourceArg.startsWith('http://') || sourceArg.startsWith('https://')) {
      console.log(`Fetching ICS from URL: ${sourceArg}`);
      const res = await fetch(sourceArg);
      if (!res.ok) {
        throw new Error(`Failed to fetch ICS from ${sourceArg}: ${res.status} ${res.statusText}`);
      }
      return { data: await res.text(), source: sourceArg };
    }

    let filePath = sourceArg;
    if (filePath.startsWith('~/')) {
      filePath = path.join(os.homedir(), filePath.slice(2));
    } else {
      filePath = path.resolve(filePath);
    }
    console.log(`Reading ICS from file: ${filePath}`);
    return { data: fs.readFileSync(filePath, 'utf-8'), source: filePath };
  }

  // 2. Default: fetch live from the SASE Google Calendar URL
  console.log(`Fetching live calendar from SASE Google Calendar...`);
  try {
    const res = await fetch(DEFAULT_CALENDAR_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.text();
    return { data, source: DEFAULT_CALENDAR_URL };
  } catch (err: any) {
    console.warn(
      `Could not reach Google Calendar URL (${err?.message}). Checking local fallbacks...`,
    );
    const defaultHomeIcs = path.join(os.homedir(), 'Downloads', 'sase.ics');
    if (fs.existsSync(defaultHomeIcs)) {
      console.log(`Using fallback: ${defaultHomeIcs}`);
      return { data: fs.readFileSync(defaultHomeIcs, 'utf-8'), source: defaultHomeIcs };
    }
    const localIcs = path.resolve('./sase.ics');
    if (fs.existsSync(localIcs)) {
      console.log(`Using fallback: ${localIcs}`);
      return { data: fs.readFileSync(localIcs, 'utf-8'), source: localIcs };
    }
    throw err;
  }
}

function escapeSqlString(val: string | null): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function generateSql(events: ParsedEvent[]): string {
  const lines: string[] = [
    '-- Generated SASE Events Seed',
    'INSERT INTO public.events (',
    '  title,',
    '  description,',
    '  type,',
    '  starts_at,',
    '  ends_at,',
    '  location_name,',
    '  address,',
    '  lat,',
    '  lng,',
    '  points_value',
    ') VALUES',
  ];

  const values = events.map((e, i) => {
    const isLast = i === events.length - 1;
    return (
      `  (` +
      `${escapeSqlString(e.title)}, ` +
      `${escapeSqlString(e.description)}, ` +
      `'${e.type}', ` +
      `'${e.starts_at}'::timestamptz, ` +
      `'${e.ends_at}'::timestamptz, ` +
      `${escapeSqlString(e.location_name)}, ` +
      `${escapeSqlString(e.address)}, ` +
      `${e.lat !== null ? e.lat : 'NULL'}, ` +
      `${e.lng !== null ? e.lng : 'NULL'}, ` +
      `${e.points_value}` +
      `)${isLast ? ';' : ','}`
    );
  });

  return `${lines.join('\n')}\n${values.join('\n')}\n`;
}

async function syncToDatabase(events: ParsedEvent[], dryRun: boolean) {
  const supabaseUrl = process.env.SUPABASE_URL || LOCAL_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      `Missing Supabase URL.\nPlease run with --env-file=.env or set EXPO_PUBLIC_SUPABASE_URL in your environment.`,
    );
  }

  if (!serviceKey) {
    throw new Error(
      `Missing SUPABASE_SERVICE_ROLE_KEY.\n` +
        `Because public.events has RLS enabled, inserting/updating events requires the admin service_role key.\n` +
        `Please ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env file.`,
    );
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (dryRun) {
    console.log(`\n[DRY RUN] Would sync ${events.length} events to ${supabaseUrl}:`);
    for (const e of events.slice(0, 15)) {
      const geoInfo = e.lat && e.lng ? ` [${e.lat}, ${e.lng}]` : '';
      const addrInfo = e.address ? ` -> ${e.address}` : '';
      console.log(
        `  - [${e.type.toUpperCase()}] ${e.title} (${e.starts_at.slice(0, 10)} @ ${e.location_name}${geoInfo}${addrInfo})`,
      );
    }
    if (events.length > 15) {
      console.log(`  ... and ${events.length - 15} more events.`);
    }
    return;
  }

  // 1. Fetch existing events to upsert safely by (title, starts_at)
  const { data: existingEvents, error: fetchErr } = await supabase
    .from('events')
    .select('id, title, starts_at');

  if (fetchErr) {
    throw new Error(`Failed to query existing events: ${fetchErr.message}`);
  }

  const existingMap = new Map<string, string>();
  for (const ex of existingEvents || []) {
    const key = `${ex.title.trim().toLowerCase()}_${new Date(ex.starts_at).toISOString()}`;
    existingMap.set(key, ex.id);
  }

  let inserted = 0;
  let updated = 0;

  for (const event of events) {
    const key = `${event.title.trim().toLowerCase()}_${new Date(event.starts_at).toISOString()}`;
    const existingId = existingMap.get(key);

    if (existingId) {
      // Update existing record
      const { error: updateErr } = await supabase
        .from('events')
        .update({
          description: event.description,
          ends_at: event.ends_at,
          location_name: event.location_name,
          address: event.address,
          lat: event.lat,
          lng: event.lng,
          type: event.type,
        })
        .eq('id', existingId);

      if (updateErr) {
        console.error(`Error updating event "${event.title}":`, updateErr.message);
      } else {
        updated++;
      }
    } else {
      // Insert new record (omit checkin_code so Postgres generates it with default lpad(...))
      const { error: insertErr } = await supabase.from('events').insert({
        title: event.title,
        description: event.description,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        location_name: event.location_name,
        address: event.address,
        lat: event.lat,
        lng: event.lng,
        type: event.type,
        points_value: event.points_value,
      });

      if (insertErr) {
        console.error(`Error inserting event "${event.title}":`, insertErr.message);
      } else {
        inserted++;
      }
    }
  }

  console.log(
    `\nSync complete! Inserted: ${inserted}, Updated: ${updated}, Total: ${events.length}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isSql = args.includes('--sql');
  const isSeed = args.includes('--seed');
  const isDryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => !a.startsWith('--'));

  const { data: rawData, source } = await loadIcsContent(fileArg);
  console.log(`Loaded calendar data from: ${source}`);

  const events = parseIcsContent(rawData);
  console.log(`Parsed ${events.length} valid events from ICS (excluding application deadlines).`);

  const typeCounts = events.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('Event breakdown by type:', typeCounts);

  const locatedCount = events.filter((e) => e.location_name !== 'TBD').length;
  console.log(`Resolved locations for ${locatedCount} of ${events.length} events.`);

  if (isSql) {
    const sql = generateSql(events);
    console.log('\n--- SQL Output ---\n');
    console.log(sql);
  } else if (isSeed) {
    const sql = generateSql(events);
    const seedPath = path.resolve('supabase/events_seed.sql');
    fs.writeFileSync(seedPath, sql, 'utf-8');
    console.log(`Wrote SQL seed file to: ${seedPath}`);
  } else {
    await syncToDatabase(events, isDryRun);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

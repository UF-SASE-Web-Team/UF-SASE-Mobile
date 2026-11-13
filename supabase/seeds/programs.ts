import type { Database } from '../../src/types/supabase.ts';
import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export type ProgramCategory = Database['public']['Enums']['program_category'];
export type ProgramInsert = Database['public']['Tables']['programs']['Insert'];

export interface ParentProgramSeedItem extends Omit<ProgramInsert, 'parent_id'> {
  slug: string;
  name: string;
}

export interface SubProgramSeedItem extends Omit<ProgramInsert, 'parent_id'> {
  slug: string;
  name: string;
  parentSlug: string;
}

export const PARENT_PROGRAMS_SEED: readonly ParentProgramSeedItem[] = [
  {
    name: 'Interns',
    slug: 'interns',
    category: 'events_and_committees',
    display_order: 10,
    short_description: 'Plan SASE events, shadow the board, and build leadership skills',
    description:
      'SASE Interns collaborate directly with board members in committees to plan events for the SASE community. Interns gain a behind-the-scenes look at how SASE operates and, in the process, are given the opportunity to develop their professional and leadership skills',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/interns.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'Banquet',
    slug: 'banquet',
    category: 'events_and_committees',
    display_order: 20,
    short_description: "Join one of four committees at SASE's annual Winter or Spring banquets.",
    description:
      'There are four committees to choose from: Programming, Logistics, Decorations, and Marketing! More details of each committee are listed within the application form.',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/banquet.jpg',
    application_url:
      'https://docs.google.com/forms/d/e/1FAIpQLSf8OD4MnelC-gTpInHFe13yentfdKlLaDrSV5kGSRdY-gnoMA/viewform?usp=header',
    opens_at: null,
    closes_at: '2026-10-19T23:59:00-04:00',
  },
  {
    name: 'SASEHacks',
    slug: 'sasehacks',
    category: 'events_and_committees',
    display_order: 30,
    short_description: "Join the organizing team for SASE's annual hackathon.",
    description:
      'SASEHacks is a 24-hour hackathon where students from any university can learn new skills, network, attend workshops, build innovative projects, and compete for exciting category prizes.',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sasehacks.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'SASE Projects',
    slug: 'projects',
    category: 'technical_and_research',
    display_order: 10,
    short_description:
      'Pitch or join a technical or research project and build hands-on skills in a small team.',
    description:
      'SASE Projects brings together small, multidisciplinary groups of 5–6 students to design and execute approachable technical and research initiatives. Members of all majors and skill levels "learn by doing," building hands-on technical and project management experience to highlight on their resumes.',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/projects.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'Gator Rover',
    slug: 'gator-rover',
    category: 'technical_and_research',
    display_order: 20,
    short_description: 'Build a robot for NASA’s Lunabotics competition',
    description:
      'The SASE Engineering Team works together on a year-long project to explore technical creativity and problem-solving. Members gain hands-on experience, sharpen engineering and collaboration skills, and build impactful projects while growing in a supportive team environment.',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/gator-rover.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'SWEET',
    slug: 'sweet',
    category: 'technical_and_research',
    display_order: 30,
    short_description: "SASE's software engineering experience teams",
    description:
      'Beginner Team: For everyone interested in learning how to build software and gain foundational skills!\nMobile Team: For those that want to create the Live UF SASE mobile app!\nExternship Team: For those who want to get mentorship and connect with a startup/company while building projects!',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sweet.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'SASE PCR',
    slug: 'sase-pcr',
    category: 'technical_and_research',
    display_order: 40,
    short_description: "SASE's program for collaborative research.",
    description:
      'SASE PCR is a semester-long research development program designed to provide new undergraduate students to research with an accessible, structured pathway into the research process.\n\nAccepted participants will be organized into small Research Cohorts according to their broader areas of interest. Within these cohorts, each participant will develop and pursue an individual research project with guidance from program facilitators.',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/pcr.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'Mentor Mentee',
    slug: 'mentor-mentee',
    category: 'community',
    display_order: 10,
    short_description: 'Get paired with a mentor, complete challenges together, and earn points.',
    description:
      "SASE's Mentor-Mentee Program allows underclassmen to build a close-knit community within SASE through their mentor and mentee groups. By participating in M&M challenges, socials, and professional development, mentorship provides underclassmen the chance to find their footing in SASE and college life.",
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/mentor-mentee.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'Community Outreach',
    slug: 'community-outreach',
    category: 'community',
    display_order: 20,
    short_description: 'Volunteer with SASE at local schools and community organizations.',
    description:
      'Join our student-led science volunteering group and help bring hands-on STEM experiences to young students at local schools!\n\nAs a volunteer, you will work with other students to design and prepare fun science demonstrations and share them with kids in a fun way! Our goal is to make science feel creative, approachable, and fun!',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/community-outreach.jpg',
    application_url: 'https://discord.gg/G6bYG6gkd2',
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'Sports',
    slug: 'sports',
    category: 'community',
    display_order: 30,
    short_description: 'Play UF intramurals and casual pick-up games with SASE.',
    description:
      'SASE Intramurals offer sports like Volleyball, Soccer, Basketball, Ultimate Frisbee, and Pickleball year-round. It’s a fun way to meet new people, stay active, and enjoy friendly competition—no experience needed!',
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/programs/sports.jpg',
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'SASE Board',
    slug: 'board',
    category: null,
    display_order: 0,
    short_description: null,
    description: null,
    image_url: null,
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
] as const;

export const SUB_PROGRAMS_SEED: readonly SubProgramSeedItem[] = [
  {
    name: 'SWEET Beginner Team',
    slug: 'sweet-beginner-team',
    parentSlug: 'sweet',
    category: null,
    display_order: 10,
    short_description: 'Introductory team for software development.',
    description:
      'For everyone interested in learning how to build software and gain foundational skills!',
    image_url: null,
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
  {
    name: 'SASE Mobile Team',
    slug: 'sase-mobile-team',
    parentSlug: 'sweet',
    category: null,
    display_order: 20,
    short_description: 'UF SASE official mobile app team.',
    description: 'For those that want to create the Live UF SASE mobile app!',
    image_url: null,
    application_url: null,
    opens_at: null,
    closes_at: null,
  },
] as const;

export async function seedPrograms(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const total = PARENT_PROGRAMS_SEED.length + SUB_PROGRAMS_SEED.length;
  const result: SeedResult = {
    entity: 'programs',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total,
    details: [],
  };

  // 1. Fetch all existing programs
  const { data: existingRows, error: fetchErr } = await supabase
    .from('programs')
    .select(
      'id, slug, name, category, display_order, short_description, description, image_url, application_url, opens_at, closes_at, parent_id',
    );

  if (fetchErr) {
    throw new Error(`Failed to query existing programs: ${fetchErr.message}`);
  }

  const existingBySlug = new Map((existingRows ?? []).map((row) => [row.slug, row]));

  // 2. Upsert parent programs
  for (const prog of PARENT_PROGRAMS_SEED) {
    const existing = existingBySlug.get(prog.slug);

    if (!existing) {
      if (options.dryRun) {
        result.inserted++;
        result.details?.push(`[DRY RUN] Would insert parent program: ${prog.name} (${prog.slug})`);
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('programs')
        .insert({
          ...prog,
          parent_id: null,
        })
        .select('id, slug')
        .single();

      if (insertErr) {
        throw new Error(`Failed to insert program "${prog.slug}": ${insertErr.message}`);
      }

      if (inserted) {
        existingBySlug.set(inserted.slug, inserted as any);
      }
      result.inserted++;
      result.details?.push(`Inserted program: ${prog.name} (${prog.slug})`);
    } else {
      const needsUpdate =
        existing.name !== prog.name ||
        existing.category !== prog.category ||
        existing.display_order !== prog.display_order ||
        existing.short_description !== prog.short_description ||
        existing.description !== prog.description ||
        existing.image_url !== prog.image_url ||
        existing.application_url !== prog.application_url ||
        existing.closes_at !== prog.closes_at;

      if (needsUpdate) {
        if (options.dryRun) {
          result.updated++;
          result.details?.push(`[DRY RUN] Would update program: ${prog.name} (${prog.slug})`);
          continue;
        }

        const { error: updateErr } = await supabase
          .from('programs')
          .update({
            name: prog.name,
            category: prog.category,
            display_order: prog.display_order,
            short_description: prog.short_description,
            description: prog.description,
            image_url: prog.image_url,
            application_url: prog.application_url,
            closes_at: prog.closes_at,
            parent_id: null,
          })
          .eq('slug', prog.slug);

        if (updateErr) {
          throw new Error(`Failed to update program "${prog.slug}": ${updateErr.message}`);
        }
        result.updated++;
        result.details?.push(`Updated program: ${prog.name} (${prog.slug})`);
      } else {
        result.skipped++;
      }
    }
  }

  // If dry-run, we might not have parent ids for newly inserted parents, so check or mock
  for (const sub of SUB_PROGRAMS_SEED) {
    const parent = existingBySlug.get(sub.parentSlug);
    const parentId = parent?.id;

    if (!parentId && !options.dryRun) {
      throw new Error(
        `Cannot seed subprogram "${sub.slug}": parent program "${sub.parentSlug}" not found in database.`,
      );
    }

    const existing = existingBySlug.get(sub.slug);

    if (!existing) {
      if (options.dryRun) {
        result.inserted++;
        result.details?.push(
          `[DRY RUN] Would insert subprogram: ${sub.name} (${sub.slug}) under parent ${sub.parentSlug}`,
        );
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('programs')
        .insert({
          name: sub.name,
          slug: sub.slug,
          category: null,
          display_order: sub.display_order,
          short_description: sub.short_description,
          description: sub.description,
          image_url: sub.image_url,
          application_url: sub.application_url,
          parent_id: parentId,
        })
        .select('id, slug')
        .single();

      if (insertErr) {
        throw new Error(`Failed to insert subprogram "${sub.slug}": ${insertErr.message}`);
      }

      if (inserted) {
        existingBySlug.set(inserted.slug, inserted as any);
      }
      result.inserted++;
      result.details?.push(`Inserted subprogram: ${sub.name} (${sub.slug})`);
    } else {
      const needsUpdate =
        existing.name !== sub.name ||
        existing.parent_id !== parentId ||
        existing.display_order !== sub.display_order ||
        existing.short_description !== sub.short_description ||
        existing.description !== sub.description;

      if (needsUpdate) {
        if (options.dryRun) {
          result.updated++;
          result.details?.push(`[DRY RUN] Would update subprogram: ${sub.name} (${sub.slug})`);
          continue;
        }

        const { error: updateErr } = await supabase
          .from('programs')
          .update({
            name: sub.name,
            parent_id: parentId,
            category: null,
            display_order: sub.display_order,
            short_description: sub.short_description,
            description: sub.description,
          })
          .eq('slug', sub.slug);

        if (updateErr) {
          throw new Error(`Failed to update subprogram "${sub.slug}": ${updateErr.message}`);
        }
        result.updated++;
        result.details?.push(`Updated subprogram: ${sub.name} (${sub.slug})`);
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}

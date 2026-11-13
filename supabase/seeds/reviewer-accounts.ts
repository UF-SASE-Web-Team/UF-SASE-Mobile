import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export interface ReviewerAccountSeed {
  email: string;
  username: string;
  password: string;
  fullName: string;
  majors: string[];
  minors: string[];
  gradTime: string;
  discordHandle: string;
  instagramHandle: string;
  linkedinUrl: string;
  bio: string;
  avatarUrl: string;
  ufid: string;
}

export const REVIEWER_ACCOUNT_SEED: ReviewerAccountSeed = {
  email: 'alice@gmail.com',
  username: 'alice',
  password: 'password123',
  fullName: 'Alice Gator',
  majors: ['Computer Science', 'Mathematics'],
  minors: ['Digital Arts and Sciences'],
  gradTime: '2029',
  discordHandle: 'alice.gator',
  instagramHandle: 'alice.gator',
  linkedinUrl: 'https://www.linkedin.com/in/alice-gator',
  bio: 'Hi! I am a Computer Science major at UF. I love building things and meeting new people through SASE.',
  avatarUrl: 'sase-shark',
  ufid: '12345678',
};

export async function seedReviewerAccounts(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const result: SeedResult = {
    entity: 'reviewer_accounts',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: 1,
    details: [],
  };

  const account = REVIEWER_ACCOUNT_SEED;

  // 1. Locate existing user in Auth if present
  let existingUserId: string | null = null;

  try {
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listErr) {
      throw listErr;
    }

    const found = usersData?.users.find(
      (u) => u.email?.toLowerCase() === account.email.toLowerCase(),
    );
    if (found) {
      existingUserId = found.id;
    }
  } catch {
    // If listUsers is restricted, fallback to checking public.profiles by username
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', account.username)
      .maybeSingle();

    if (profile?.id) {
      existingUserId = profile.id;
    }
  }

  // 2. Insert or update in Auth
  if (!existingUserId) {
    if (options.dryRun) {
      result.inserted++;
      result.details?.push(
        `[DRY RUN] Would create reviewer account: ${account.email} (${account.username})`,
      );
      return result;
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        username: account.username,
        full_name: account.fullName,
      },
    });

    if (createErr || !created.user) {
      throw new Error(`Failed to create auth user for "${account.email}": ${createErr?.message}`);
    }

    existingUserId = created.user.id;
    result.inserted++;
    result.details?.push(`Created reviewer account: ${account.email} (${account.username})`);
  } else {
    if (options.dryRun) {
      result.updated++;
      result.details?.push(
        `[DRY RUN] Would update reviewer account: ${account.email} (${account.username})`,
      );
      return result;
    }

    // Ensure password and confirmed status are up-to-date
    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(existingUserId, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        username: account.username,
        full_name: account.fullName,
      },
    });

    if (updateAuthErr) {
      throw new Error(
        `Failed to update auth credentials for "${account.email}": ${updateAuthErr.message}`,
      );
    }

    result.updated++;
    result.details?.push(`Updated reviewer credentials: ${account.email}`);
  }

  // 3. Update public.profiles
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: account.fullName,
      username: account.username,
      majors: account.majors,
      minors: account.minors,
      grad_time: account.gradTime,
      discord_handle: account.discordHandle,
      instagram_handle: account.instagramHandle,
      linkedin_url: account.linkedinUrl,
      bio: account.bio,
      avatar_url: account.avatarUrl,
    })
    .eq('id', existingUserId);

  if (profileErr) {
    throw new Error(`Failed to update profile for "${account.username}": ${profileErr.message}`);
  }

  // 4. Upsert public.profile_private with UFID so onboarding is marked complete
  const { error: privateErr } = await supabase.from('profile_private').upsert({
    user_id: existingUserId,
    ufid: account.ufid,
  });

  if (privateErr) {
    throw new Error(
      `Failed to set profile_private for "${account.username}": ${privateErr.message}`,
    );
  }

  return result;
}

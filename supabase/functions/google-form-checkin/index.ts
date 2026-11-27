// Submits the SASE Google check-in form for a member who checked in through the app.
//
// Called by the trg_check_in_form_sync trigger (through pg_net) with
// { check_in_id }. Authenticated by a shared secret, not a user JWT. The result
// is recorded on the check-in (form_submitted_at or form_submit_error), so a
// failure here never affects the check-in itself.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  buildFormBody,
  FIELDS,
  MissingFieldError,
  parseFormQuestions,
  pickEventOption,
  resolveUfEmail,
} from './form.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const syncSecret = Deno.env.get('FORM_SYNC_SECRET') ?? '';
// Overridable so local testing can point at a stand-in instead of the live form.
const formsBaseUrl = Deno.env.get('GOOGLE_FORMS_BASE_URL') ?? 'https://docs.google.com/forms/d/e';

const stateless = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Constant-time string comparison, so the secret can't be guessed by timing. */
function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

type CheckInRow = {
  id: string;
  user_id: string | null;
  checked_in_at: string;
  attended_this_year: boolean | null;
  form_submitted_at: string | null;
  events: { title: string } | null;
  profiles: {
    full_name: string;
    grad_time: string | null;
    majors: string[];
    minors: string[];
    discord_handle: string | null;
    instagram_handle: string | null;
  } | null;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!syncSecret || !safeEqual(req.headers.get('x-form-sync-secret') ?? '', syncSecret)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let checkInId: unknown;
  try {
    ({ check_in_id: checkInId } = await req.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (typeof checkInId !== 'string' || !checkInId) return json({ error: 'Invalid request' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, stateless);

  const recordResult = async (error: string | null) => {
    const { error: updateError } = await admin
      .from('check_ins')
      .update(
        error
          ? { form_submit_error: error.slice(0, 500) }
          : { form_submitted_at: new Date().toISOString(), form_submit_error: null },
      )
      .eq('id', checkInId);
    if (updateError) console.error('Recording form result failed:', updateError.message);
  };

  const { data: checkIn, error: checkInError } = await admin
    .from('check_ins')
    .select(
      'id, user_id, checked_in_at, attended_this_year, form_submitted_at, events(title), profiles(full_name, grad_time, majors, minors, discord_handle, instagram_handle)',
    )
    .eq('id', checkInId)
    .maybeSingle<CheckInRow>();

  if (checkInError) {
    console.error('Loading check-in failed:', checkInError.message);
    return json({ error: 'Unavailable' }, 500);
  }
  if (!checkIn || !checkIn.user_id || !checkIn.events || !checkIn.profiles) {
    return json({ status: 'skipped' });
  }
  // Already sent: pg_net may deliver twice, and the form must not get duplicates.
  if (checkIn.form_submitted_at) return json({ status: 'already_submitted' });

  try {
    const [{ data: privateDetails }, { data: authUser }, { data: formId }, { data: yearStart }] =
      await Promise.all([
        admin
          .from('profile_private')
          .select('ufid, uf_email, gender')
          .eq('user_id', checkIn.user_id)
          .maybeSingle(),
        admin.auth.admin.getUserById(checkIn.user_id),
        admin
          .from('app_settings')
          .select('value')
          .eq('key', 'google_form_checkin_form_id')
          .maybeSingle(),
        admin.rpc('school_year_start', { p_at: checkIn.checked_in_at }),
      ]);

    if (!formId?.value) {
      await recordResult('missing_form_id');
      return json({ status: 'failed', error: 'missing_form_id' });
    }

    // Recheck on the server: an earlier check-in this school year means "Yes",
    // whatever was stored (officer-added check-ins never ask the question).
    const { count: earlier } = await admin
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', checkIn.user_id)
      .neq('id', checkIn.id)
      .gte('checked_in_at', yearStart as string)
      .lte('checked_in_at', checkIn.checked_in_at);
    const attendedThisYear = (earlier ?? 0) > 0 || checkIn.attended_this_year === true;

    const formUrl = `${formsBaseUrl}/${encodeURIComponent(formId.value)}`;
    const page = await fetch(`${formUrl}/viewform`);
    if (!page.ok) throw new Error(`viewform_${page.status}`);
    const questions = parseFormQuestions(await page.text());

    const eventOption = pickEventOption(
      checkIn.events.title,
      questions.get(FIELDS.event)?.options ?? [],
    );
    if (!eventOption) {
      await recordResult('no_event_options');
      return json({ status: 'failed', error: 'no_event_options' });
    }

    const body = buildFormBody({
      member: {
        ufid: privateDetails?.ufid ?? '',
        fullName: checkIn.profiles.full_name,
        ufEmail: resolveUfEmail(privateDetails?.uf_email ?? null, authUser?.user?.email ?? null),
        gender: privateDetails?.gender ?? null,
        gradYear: checkIn.profiles.grad_time,
        majors: checkIn.profiles.majors ?? [],
        minors: checkIn.profiles.minors ?? [],
        discordHandle: checkIn.profiles.discord_handle,
        instagramHandle: checkIn.profiles.instagram_handle,
      },
      eventOption,
      attendedThisYear,
      majorOptions: questions.get(FIELDS.majors)?.options ?? [],
      genderOptions: questions.get(FIELDS.gender)?.options,
    });

    const response = await fetch(`${formUrl}/formResponse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) throw new Error(`form_response_${response.status}`);

    await recordResult(null);
    return json({ status: 'submitted' });
  } catch (error) {
    const code =
      error instanceof MissingFieldError
        ? error.code
        : error instanceof Error
          ? error.message
          : 'unknown_error';
    if (!(error instanceof MissingFieldError)) console.error('Form submission failed:', code);
    await recordResult(code);
    return json({ status: 'failed', error: code });
  }
});

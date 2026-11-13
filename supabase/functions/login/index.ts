// Username + password sign-in.
//
// Supabase Auth only signs in by email. This function resolves the username to
// an email with the service role and signs in server-side, so a member's email
// is never handed to a caller who has not proven they know the password.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stateless = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let username: unknown;
  let password: unknown;
  try {
    ({ username, password } = await req.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password ||
    username.length > 64 ||
    password.length > 256
  ) {
    return json({ error: 'Invalid request' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, stateless);
  const { data: email, error: lookupError } = await admin.rpc('get_email_from_username', {
    p_username: username,
  });
  if (lookupError) {
    console.error('Username lookup failed:', lookupError.message);
    return json({ error: 'Login unavailable' }, 500);
  }
  // An unknown username and a wrong password must look identical to the caller.
  if (!email) return json({ status: 'invalid' });

  // A separate client, so the member's session never attaches to the admin client.
  const auth = createClient(supabaseUrl, serviceRoleKey, stateless);
  const { data, error } = await auth.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.status === 429) return json({ error: 'Too many attempts' }, 429);
    if (error.status && error.status >= 500) {
      console.error('Sign-in failed:', error.message);
      return json({ error: 'Login unavailable' }, 500);
    }
    // Auth only reports an unconfirmed email after the password has matched,
    // so the caller has earned the address they need for the verification step.
    if (error.code === 'email_not_confirmed') return json({ status: 'unconfirmed', email });
    return json({ status: 'invalid' });
  }

  return json({
    status: 'ok',
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

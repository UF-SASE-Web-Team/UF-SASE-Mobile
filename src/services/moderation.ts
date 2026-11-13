import { supabase } from '@/lib/supabase';
import type { ReportReason } from '@/types/moderation';

// The database fills in the reporter/blocker from the signed-in session, so
// callers only ever name the other member.

export async function reportMember(
  reportedId: string,
  reason: ReportReason,
  details?: string,
): Promise<void> {
  const { error } = await supabase.from('profile_reports').insert({
    reported_id: reportedId,
    reason,
    details: details?.trim() || null,
  });
  if (error) throw error;
}

export async function isMemberBlocked(memberId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profile_blocks')
    .select('blocked_id')
    .eq('blocked_id', memberId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function blockMember(memberId: string): Promise<void> {
  // Blocking someone twice is a no-op rather than an error.
  const { error } = await supabase
    .from('profile_blocks')
    .upsert(
      { blocked_id: memberId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function unblockMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('profile_blocks').delete().eq('blocked_id', memberId);
  if (error) throw error;
}

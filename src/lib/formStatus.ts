import type { PillTone } from '@/components/ui/Pill';

const ERROR_LABELS: Record<string, string> = {
  missing_ufid: 'Missing UFID',
  missing_uf_email: 'Missing UF email',
  missing_grad_year: 'Missing grad year',
  missing_name: 'Missing name',
  no_event_options: 'No event on the form',
  missing_form_id: 'Form not set up',
};

/** A short label for a check-in's Google Form status. */
export function formStatusLabel(status: string, error: string | null): string {
  if (status === 'submitted') return 'Form sent';
  if (status === 'failed') return error ? (ERROR_LABELS[error] ?? 'Form failed') : 'Form failed';
  if (status === 'off') return 'Form sync off';
  return 'Sending…';
}

export function formStatusTone(status: string): PillTone {
  if (status === 'submitted') return 'green';
  if (status === 'failed') return 'orange';
  return 'neutral';
}

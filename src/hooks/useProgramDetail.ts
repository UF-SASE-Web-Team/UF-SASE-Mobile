import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContactItem } from '@/components/ui/ContactList';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { openExternalLink } from '@/lib/links';
import { getProgramAction, getProgramBySlug } from '@/services/programs';
import { ProgramWithPoCs } from '@/types/programs';

function formatSlugToName(slug?: string) {
  if (!slug) return '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useProgramDetail(slug?: string, paramName?: string) {
  const [program, setProgram] = useState<ProgramWithPoCs | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    getProgramBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setProgram(null);
          setError('Program not found.');
          return;
        }
        setProgram(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn('Error fetching program:', err?.message || err);
        setError(getFriendlyErrorMessage(err, "Couldn't load program."));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const reloadProgram = useCallback(async () => {
    if (!slug) return;
    setIsRetrying(true);
    try {
      const data = await getProgramBySlug(slug);
      if (!data) {
        setProgram(null);
        setError('Program not found.');
        return;
      }
      setProgram(data);
      setError(null);
    } catch (err: any) {
      console.warn('Error fetching program:', err?.message || err);
      setError(getFriendlyErrorMessage(err, "Couldn't load program."));
    } finally {
      setIsRetrying(false);
    }
  }, [slug]);

  const programName = paramName || program?.name || formatSlugToName(slug);
  const description = program?.description || program?.short_description;
  const action = program ? getProgramAction(program) : null;

  const openAction = async () => {
    if (action) {
      await openExternalLink(action.url, `${programName} ${action.label}`);
    }
  };

  const pocContacts = useMemo<ContactItem[]>(() => {
    if (!program?.pocs) return [];
    return program.pocs.map((poc) => ({
      id: poc.id,
      name: poc.display_name || poc.profile?.full_name || 'Contact',
      avatarUrl: poc.profile?.avatar_url,
      userId: poc.user_id || poc.profile?.id || null,
    }));
  }, [program]);

  return {
    program,
    programName,
    description,
    action,
    pocContacts,
    loading,
    error,
    isRetrying,
    reloadProgram,
    openAction,
  };
}

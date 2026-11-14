import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { getOpenApplicationPrograms, getPrograms } from '@/services/programs';
import { ProgramCategory, ProgramWithPoCs } from '@/types/programs';

export interface ProgramCategorySection {
  key: ProgramCategory;
  title: string;
  icon: 'ribbon-outline' | 'briefcase-outline' | 'heart-outline';
  tone: 'orange' | 'green' | 'pink';
  programs: ProgramWithPoCs[];
}

const CATEGORY_CONFIGS: {
  key: ProgramCategory;
  title: string;
  icon: 'ribbon-outline' | 'briefcase-outline' | 'heart-outline';
  tone: 'orange' | 'green' | 'pink';
}[] = [
  { key: 'events_and_committees', title: 'Leadership', icon: 'ribbon-outline', tone: 'orange' },
  {
    key: 'technical_and_research',
    title: 'Professional Development',
    icon: 'briefcase-outline',
    tone: 'green',
  },
  { key: 'community', title: 'Community', icon: 'heart-outline', tone: 'pink' },
];

export function useProgramsFeed() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramWithPoCs[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPrograms()
      .then((formattedPrograms) => {
        if (!isMounted) return;
        setPrograms(formattedPrograms);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching programs:', err.message);
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const formattedPrograms = await getPrograms();
      setPrograms(formattedPrograms);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching programs:', err.message);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const openApplicationPrograms = useMemo(() => getOpenApplicationPrograms(programs), [programs]);

  const categorySections: ProgramCategorySection[] = useMemo(() => {
    return CATEGORY_CONFIGS.map((config) => ({
      ...config,
      programs: programs.filter((p) => p.category === config.key),
    })).filter((section) => section.programs.length > 0);
  }, [programs]);

  const handleCardPress = (program: ProgramWithPoCs) => {
    router.push({
      pathname: `/programs/${program.slug}`,
      params: { name: program.name },
    } as any);
  };

  return {
    programs,
    openApplicationPrograms,
    categorySections,
    loading,
    refreshing,
    error,
    handleRefresh,
    handleCardPress,
  };
}

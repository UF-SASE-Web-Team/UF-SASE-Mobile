import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { getResourceSections } from '@/services/resources';
import {
  ResourceRow,
  ResourceSection,
  isInternalUrl,
  resolveInternalPath,
} from '@/types/resources';

export interface ResourceSectionListItem extends ResourceSection {
  data: ResourceRow[][];
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function useResources() {
  const router = useRouter();
  const [sections, setSections] = useState<ResourceSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Default state: all collapsible sections closed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sase: false,
    academic: false,
    professional: false,
  });

  const loadData = async () => {
    try {
      const data = await getResourceSections();
      setSections(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await getResourceSections();
        if (!isMounted) return;
        setSections(data);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching resources:', err.message);
        setError(err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const sectionListData: ResourceSectionListItem[] = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      data: !section.collapsible || openSections[section.key] ? chunkArray(section.items, 2) : [],
    }));
  }, [sections, openSections]);

  const handleCardPress = async (resource: ResourceRow) => {
    if (!resource.url) return;

    if (isInternalUrl(resource.url)) {
      // In-app navigation for deeplinks (denoted by right chevron)
      const targetRoute = resolveInternalPath(resource.url);
      try {
        router.push(targetRoute as any);
      } catch (err: any) {
        console.warn(`Failed to navigate to route: ${targetRoute}`, err?.message);
      }
      return;
    }

    try {
      const supported = await Linking.canOpenURL(resource.url);
      if (supported) {
        await Linking.openURL(resource.url);
      } else {
        console.warn(`Cannot open URL: ${resource.url}`);
      }
    } catch (err: any) {
      console.error('Failed to open resource URL:', err.message);
    }
  };

  return {
    sections,
    sectionListData,
    loading,
    refreshing,
    error,
    openSections,
    handleRefresh,
    toggleSection,
    handleCardPress,
  };
}

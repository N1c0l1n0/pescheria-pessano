import { useCallback, useEffect, useState } from 'react';
import type { FishItem } from '../types/fishCatalog';
import {
  fetchFishCatalog,
  getLocalFishCatalog,
  FISH_CATALOG_UPDATE_EVENT,
} from '../utils/fishCatalog';
import { FISH_CATALOG_DEFAULTS } from '../data/fishCatalogDefaults';

interface UseFishCatalogOptions {
  includeInactive?: boolean;
}

export function useFishCatalog(options: UseFishCatalogOptions = {}) {
  const { includeInactive = false } = options;
  const [items, setItems] = useState<FishItem[]>(() => {
    const local = getLocalFishCatalog();
    const source = local && local.length > 0 ? local : FISH_CATALOG_DEFAULTS;
    const sorted = [...source].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted.filter((item) => includeInactive || item.isActive !== false);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const catalog = await fetchFishCatalog(includeInactive);
      setItems(catalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento catalogo pesce');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  const replaceItem = useCallback((next: FishItem) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === next.id);
      return exists ? prev.map((item) => (item.id === next.id ? next : item)) : [...prev, next];
    });
  }, []);

  const replaceAll = useCallback((next: FishItem[]) => {
    setItems(next);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleUpdate = () => {
      const local = getLocalFishCatalog();
      if (local && local.length > 0) {
        const sorted = [...local].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setItems(sorted.filter((item) => includeInactive || item.isActive !== false));
      } else {
        void reload({ silent: true });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(FISH_CATALOG_UPDATE_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener(FISH_CATALOG_UPDATE_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, [includeInactive, reload]);

  return { items, loading, error, reload, replaceItem, replaceAll, removeItem };
}

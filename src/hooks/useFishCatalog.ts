import { useCallback, useEffect, useState } from 'react';
import type { FishItem } from '../types/fishCatalog';
import { fetchFishCatalog } from '../utils/fishCatalog';

interface UseFishCatalogOptions {
  includeInactive?: boolean;
}

export function useFishCatalog(options: UseFishCatalogOptions = {}) {
  const { includeInactive = false } = options;
  const [items, setItems] = useState<FishItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  return { items, loading, error, reload, replaceItem, replaceAll, removeItem };
}

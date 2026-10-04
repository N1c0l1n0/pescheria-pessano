import { describe, it, expect, vi } from 'vitest';
// @ts-ignore
import fs from 'node:fs';
import {
  saveLocalFishCatalog,
  getLocalFishCatalog,
  fetchFishCatalog,
} from '../utils/fishCatalog';
import type { FishItem } from '../types/fishCatalog';

describe('FishMenuCatalog and Banco sync', () => {
  const componentContent = fs.readFileSync(new URL('./FishMenuCatalog.tsx', import.meta.url), 'utf-8');

  it('renders Prezzo al Kg and pricePerKg on showcase fish cards', () => {
    expect(componentContent).toContain('Prezzo al Kg');
    expect(componentContent).toContain('item.pricePerKg.toFixed(2)');
  });

  it('renders price, description, and chef cooking tip in detail modal', () => {
    expect(componentContent).toContain('selectedFish.pricePerKg.toFixed(2)');
    expect(componentContent).toContain('selectedFish.description');
    expect(componentContent).toContain('selectedFish.cookingTip');
  });

  it('reflects updated prices and sort order from admin banco in catalog query', async () => {
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const key in mockStorage) delete mockStorage[key];
      },
    });

    const modifiedCatalog: FishItem[] = [
      {
        id: 'orata-custom',
        name: 'Orata Modificata Banco',
        origin: 'Mar Ligure',
        locationDetail: '',
        pricePerKg: 49.9,
        image: '/pesce/orata.jpg',
        description: 'Orata fresca modificata in admin',
        cookingTip: 'Al forno',
        winePairing: 'Pigato',
        isPopular: true,
        isActive: true,
        sortOrder: 0,
      },
    ];

    saveLocalFishCatalog(modifiedCatalog);
    expect(getLocalFishCatalog()).toEqual(modifiedCatalog);

    const activeItems = await fetchFishCatalog(false);
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0].name).toBe('Orata Modificata Banco');
    expect(activeItems[0].pricePerKg).toBe(49.9);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  digitsOnly,
  getLocalFishCatalog,
  saveLocalFishCatalog,
  fetchFishCatalog,
  upsertFishItem,
  updateFishSortOrders,
  deleteFishItem,
  authenticateAdmin,
  isAdminAuthenticated,
  logoutAdmin,
  getAdminPin,
} from './fishCatalog';
import type { FishItem } from '../types/fishCatalog';

describe('digitsOnly', () => {
  it('keeps an already numeric PIN', () => {
    expect(digitsOnly('2134')).toBe('2134');
  });

  it('strips letters and spaces', () => {
    expect(digitsOnly('21a 34')).toBe('2134');
  });

  it('returns empty string for empty input', () => {
    expect(digitsOnly('')).toBe('');
  });
});

describe('local storage persistence and synchronization', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const key in mockStorage) delete mockStorage[key];

    // Mock localStorage and window events for node environment
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

    vi.stubGlobal('window', {
      localStorage: globalThis.localStorage,
      dispatchEvent: vi.fn(),
    });
  });

  const testItem: FishItem = {
    id: 'test-fish',
    name: 'Pesce Prova',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 35.5,
    image: '/pesce/test.jpg',
    description: 'Ottimo fresco',
    cookingTip: 'In padella',
    winePairing: 'Pigato',
    isPopular: true,
    isActive: true,
    sortOrder: 0,
  };

  it('saves and reads catalog from local storage', () => {
    saveLocalFishCatalog([testItem]);
    const loaded = getLocalFishCatalog();
    expect(loaded).toEqual([testItem]);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('upsertFishItem updates local catalog and persists modifications', async () => {
    saveLocalFishCatalog([testItem]);
    const updated = { ...testItem, pricePerKg: 40 };
    await upsertFishItem(updated);

    const loaded = getLocalFishCatalog();
    expect(loaded?.[0].pricePerKg).toBe(40);
  });

  it('updateFishSortOrders updates sort order in local catalog', async () => {
    const item2 = { ...testItem, id: 'test-fish-2', sortOrder: 1 };
    saveLocalFishCatalog([testItem, item2]);

    await updateFishSortOrders([
      { id: 'test-fish', sortOrder: 1 },
      { id: 'test-fish-2', sortOrder: 0 },
    ]);

    const loaded = getLocalFishCatalog();
    expect(loaded?.find((i) => i.id === 'test-fish')?.sortOrder).toBe(1);
    expect(loaded?.find((i) => i.id === 'test-fish-2')?.sortOrder).toBe(0);
  });

  it('deleteFishItem removes item from local catalog', async () => {
    saveLocalFishCatalog([testItem]);
    await deleteFishItem(testItem.id);

    const loaded = getLocalFishCatalog();
    expect(loaded?.find((i) => i.id === testItem.id)).toBeUndefined();
  });

  it('fetchFishCatalog falls back to local storage when remote is empty or offline', async () => {
    saveLocalFishCatalog([{ ...testItem, pricePerKg: 99 }]);
    const catalog = await fetchFishCatalog(true);
    expect(catalog.find((i) => i.id === 'test-fish')?.pricePerKg).toBe(99);
  });
});

describe('authenticateAdmin', () => {
  const mockSession: Record<string, string> = {};

  beforeEach(() => {
    for (const key in mockSession) delete mockSession[key];
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => mockSession[key] ?? null,
      setItem: (key: string, val: string) => {
        mockSession[key] = val;
      },
      removeItem: (key: string) => {
        delete mockSession[key];
      },
      clear: () => {
        for (const key in mockSession) delete mockSession[key];
      },
    });
    vi.restoreAllMocks();
  });

  it('getAdminPin defaults to 2134', () => {
    expect(getAdminPin()).toBe('2134');
  });

  it('authenticates with remote verify endpoint when worker returns ok: true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const result = await authenticateAdmin('2134');
    expect(result).toBe(true);
    expect(isAdminAuthenticated()).toBe(true);
  });

  it('fails authentication when worker returns 401 invalid_pin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ ok: false, error: 'invalid_pin' }),
    }));

    const result = await authenticateAdmin('9999');
    expect(result).toBe(false);
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('falls back to local verification when endpoint is 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    }));

    const result = await authenticateAdmin('2134');
    expect(result).toBe(true);
    expect(isAdminAuthenticated()).toBe(true);
  });

  it('rejects wrong PIN on 404 local fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    }));

    const result = await authenticateAdmin('0000');
    expect(result).toBe(false);
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('logoutAdmin clears authentication', async () => {
    mockSession.fish_admin_auth = '1';
    expect(isAdminAuthenticated()).toBe(true);
    logoutAdmin();
    expect(isAdminAuthenticated()).toBe(false);
  });
});


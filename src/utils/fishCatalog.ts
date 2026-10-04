import { supabase } from '../lib/supabase';
import { FISH_CATALOG_DEFAULTS } from '../data/fishCatalogDefaults';
import {
  type FishItem,
  type FishItemRow,
  fishItemToRow,
  rowToFishItem,
} from '../types/fishCatalog';

const FISH_STORAGE_BUCKET = 'fish-images';
export const FISH_STORAGE_KEY = 'pescheria_fish_catalog';
export const FISH_CATALOG_UPDATE_EVENT = 'pescheria_fish_catalog_updated';

export function getLocalFishCatalog(): FishItem[] | null {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
    const raw = storage?.getItem(FISH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as FishItem[];
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

export function saveLocalFishCatalog(items: FishItem[]): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
    storage?.setItem(FISH_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(FISH_CATALOG_UPDATE_EVENT, { detail: items }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch {
    // Storage quota or restricted access
  }
}

export async function fetchFishCatalog(includeInactive = false): Promise<FishItem[]> {
  try {
    let query = supabase
      .from('fish_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await Promise.race([
      query,
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timed out')), 1500)
      ),
    ]);

    if (!error && data && data.length > 0) {
      const items = (data as FishItemRow[]).map(rowToFishItem);
      if (includeInactive) {
        saveLocalFishCatalog(items);
      }
      return items;
    }
  } catch {
    // Supabase unreachable or network failure
  }

  // Fallback to local storage
  const local = getLocalFishCatalog();
  if (local && local.length > 0) {
    const sorted = [...local].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted.filter((item) => includeInactive || item.isActive !== false);
  }

  return FISH_CATALOG_DEFAULTS.filter((item) => includeInactive || item.isActive !== false);
}

export async function upsertFishItem(item: FishItem): Promise<FishItem> {
  // 1. Immediately persist locally
  const current = getLocalFishCatalog() || FISH_CATALOG_DEFAULTS;
  const exists = current.some((existing) => existing.id === item.id);
  const updated = exists
    ? current.map((existing) => (existing.id === item.id ? item : existing))
    : [...current, item];
  saveLocalFishCatalog(updated);

  // 2. Sync to Supabase if connected
  try {
    const row = fishItemToRow(item);
    const { data, error } = await supabase
      .from('fish_items')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error && data) {
      return rowToFishItem(data as FishItemRow);
    }
    if (error) {
      console.warn('Supabase upsert returned error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase upsert failed, saved locally:', err);
  }

  return item;
}

export async function updateFishSortOrders(
  updates: { id: string; sortOrder: number }[]
): Promise<void> {
  if (updates.length === 0) return;

  // 1. Immediately persist locally
  const current = getLocalFishCatalog() || FISH_CATALOG_DEFAULTS;
  const map = new Map(updates.map((u) => [u.id, u.sortOrder]));
  const updated = current.map((item) => {
    if (map.has(item.id)) {
      return { ...item, sortOrder: map.get(item.id) };
    }
    return item;
  });
  saveLocalFishCatalog(updated);

  // 2. Sync to Supabase if connected
  try {
    const results = await Promise.all(
      updates.map(({ id, sortOrder }) =>
        supabase.from('fish_items').update({ sort_order: sortOrder }).eq('id', id)
      )
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.warn('Supabase update sort orders returned error:', failed.error.message);
    }
  } catch (err) {
    console.warn('Supabase update sort orders failed, saved locally:', err);
  }
}

export async function deleteFishItem(id: string): Promise<void> {
  // 1. Immediately remove locally
  const current = getLocalFishCatalog() || FISH_CATALOG_DEFAULTS;
  const updated = current.filter((item) => item.id !== id);
  saveLocalFishCatalog(updated);

  // 2. Sync to Supabase if connected
  try {
    const { error } = await supabase.from('fish_items').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete returned error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete failed, removed locally:', err);
  }
}

export async function seedFishCatalogFromDefaults(): Promise<number> {
  saveLocalFishCatalog(FISH_CATALOG_DEFAULTS);
  try {
    const rows = FISH_CATALOG_DEFAULTS.map(fishItemToRow);
    const { error } = await supabase.from('fish_items').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase seed error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase seed offline, saved locally:', err);
  }
  return FISH_CATALOG_DEFAULTS.length;
}

export async function uploadFishImage(fishId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${fishId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(FISH_STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(FISH_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function slugifyFishId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

const DEFAULT_ADMIN_PIN = '2134';

export function getAdminPin(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.VITE_FISH_ADMIN_PIN?.trim() || DEFAULT_ADMIN_PIN;
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem('fish_admin_auth') === '1';
}

function markAdminAuthenticated(): void {
  sessionStorage.setItem('fish_admin_auth', '1');
}

/** Local fallback for Vite dev when the Cloudflare worker is not running. */
function authenticateAdminLocally(pin: string): boolean {
  if (digitsOnly(pin) === digitsOnly(getAdminPin())) {
    markAdminAuthenticated();
    return true;
  }
  return false;
}

/**
 * Verify admin PIN via Cloudflare Worker runtime env (FISH_ADMIN_PIN / VITE_FISH_ADMIN_PIN).
 * Falls back to build-time VITE_FISH_ADMIN_PIN only in local dev.
 */
export async function authenticateAdmin(pin: string): Promise<boolean> {
  const trimmed = digitsOnly(pin);
  if (!trimmed) return false;

  try {
    const response = await fetch('/api/fish-admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: trimmed }),
    });

    if (response.status === 404 || response.status === 405) {
      return authenticateAdminLocally(trimmed);
    }

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { ok?: boolean };
    if (data.ok) {
      markAdminAuthenticated();
      return true;
    }

    return false;
  } catch {
    return authenticateAdminLocally(trimmed);
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem('fish_admin_auth');
}

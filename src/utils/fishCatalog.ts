import { supabase } from '../lib/supabase';
import { FISH_CATALOG_DEFAULTS } from '../data/fishCatalogDefaults';
import {
  type FishItem,
  type FishItemRow,
  fishItemToRow,
  rowToFishItem,
} from '../types/fishCatalog';

const FISH_STORAGE_BUCKET = 'fish-images';

export async function fetchFishCatalog(includeInactive = false): Promise<FishItem[]> {
  let query = supabase
    .from('fish_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return FISH_CATALOG_DEFAULTS.filter((item) => includeInactive || item.isActive !== false);
  }

  return (data as FishItemRow[]).map(rowToFishItem);
}

export async function upsertFishItem(item: FishItem): Promise<FishItem> {
  const row = fishItemToRow(item);
  const { data, error } = await supabase
    .from('fish_items')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToFishItem(data as FishItemRow);
}

export async function deleteFishItem(id: string): Promise<void> {
  const { error } = await supabase.from('fish_items').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function seedFishCatalogFromDefaults(): Promise<number> {
  const rows = FISH_CATALOG_DEFAULTS.map(fishItemToRow);
  const { error } = await supabase.from('fish_items').upsert(rows, { onConflict: 'id' });
  if (error) {
    throw new Error(error.message);
  }
  return rows.length;
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

const DEFAULT_ADMIN_PIN = 'pessano2026';

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
  if (pin === getAdminPin()) {
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
  const trimmed = pin.trim();
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

import type { FishItem } from '../types/fishCatalog';

export const FISH_PRICE_STEP = 0.5;

export const FISH_EDITOR_ORIGINS = ['Mar Ligure', 'Medit. Occ.'] as const;

export const EMPTY_FISH_ITEM: FishItem = {
  id: '',
  name: '',
  origin: 'Mar Ligure',
  locationDetail: '',
  pricePerKg: 0,
  image: '/pesce/pescatrice.jpg',
  description: '',
  cookingTip: '',
  winePairing: '',
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

export function roundFishPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

export function stepFishPrice(price: number, direction: 1 | -1): number {
  return Math.max(0, roundFishPrice(price + direction * FISH_PRICE_STEP));
}

export function parseFishPrice(value: string): number {
  const normalized = value.replace(',', '.').trim();
  const next = Number(normalized);
  if (!Number.isFinite(next) || next < 0) return 0;
  return roundFishPrice(next);
}

export function formatFishPrice(price: number): string {
  return roundFishPrice(price).toFixed(2).replace('.', ',');
}

export function patchFishItem(item: FishItem, patch: Partial<FishItem>): FishItem {
  return { ...item, ...patch };
}

export function isFishEditorDirty(draft: FishItem, original: FishItem | null): boolean {
  if (!original) {
    return draft.name.trim().length > 0 || draft.image !== EMPTY_FISH_ITEM.image;
  }

  return (
    draft.name !== original.name ||
    draft.origin !== original.origin ||
    draft.image !== original.image ||
    (draft.sortOrder ?? 0) !== (original.sortOrder ?? 0)
  );
}

export function canSaveFishDraft(draft: FishItem): boolean {
  return draft.name.trim().length > 0;
}

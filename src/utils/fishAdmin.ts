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
    draft.image !== original.image
  );
}

export function reorderFishItems(
  items: FishItem[],
  activeId: string,
  overId: string
): FishItem[] {
  if (activeId === overId) return items;
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1) return items;

  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, index) => (item.sortOrder === index ? item : { ...item, sortOrder: index }));
}

export function changedSortOrders(
  previous: FishItem[],
  next: FishItem[]
): { id: string; sortOrder: number }[] {
  const previousOrder = new Map(previous.map((item) => [item.id, item.sortOrder ?? 0]));
  return next
    .filter((item) => (item.sortOrder ?? 0) !== (previousOrder.get(item.id) ?? 0))
    .map((item) => ({ id: item.id, sortOrder: item.sortOrder ?? 0 }));
}

export function canSaveFishDraft(draft: FishItem): boolean {
  return draft.name.trim().length > 0;
}

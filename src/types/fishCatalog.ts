export type FishOrigin = 'Mar Ligure' | 'Medit. Occ.';

export interface FishItem {
  id: string;
  name: string;
  origin: FishOrigin;
  locationDetail: string;
  pricePerKg: number;
  image: string;
  description: string;
  cookingTip: string;
  winePairing: string;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface FishItemRow {
  id: string;
  name: string;
  origin: FishOrigin;
  location_detail: string;
  price_per_kg: number;
  image_url: string;
  description: string;
  cooking_tip: string;
  wine_pairing: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

export function rowToFishItem(row: FishItemRow): FishItem {
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    locationDetail: row.location_detail,
    pricePerKg: Number(row.price_per_kg),
    image: row.image_url,
    description: row.description,
    cookingTip: row.cooking_tip,
    winePairing: row.wine_pairing,
    isPopular: row.is_popular,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function fishItemToRow(item: FishItem): FishItemRow {
  return {
    id: item.id,
    name: item.name,
    origin: item.origin,
    location_detail: item.locationDetail,
    price_per_kg: item.pricePerKg,
    image_url: item.image,
    description: item.description,
    cooking_tip: item.cookingTip,
    wine_pairing: item.winePairing,
    is_popular: item.isPopular ?? false,
    is_active: item.isActive ?? true,
    sort_order: item.sortOrder ?? 0,
  };
}

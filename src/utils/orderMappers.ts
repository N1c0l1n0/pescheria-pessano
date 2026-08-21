import type { LocalOrder } from './orderStore';

export interface KdsOrderItem {
  id?: string;
  item_name?: string;
  item_type?: 'poke' | 'fritto' | 'pesce' | string;
  size?: string;
  bases?: string[];
  proteins?: string[];
  toppings?: string[];
  sauces?: string[];
  has_sesame?: boolean;
  notes?: string;
  price?: number;
  quantity?: number;
  preparation?: string;
  weight_grams?: number;
}

export interface KdsOrder {
  id: string;
  display_id?: string;
  status: 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO' | string;
  customer_name: string;
  phone?: string;
  order_type: 'Ritiro' | 'Consegna' | string;
  delivery_address?: string;
  total_price: number;
  created_at: string;
  notes?: string;
  order_items: KdsOrderItem[];
}

const resolveKdsItemType = (
  item: Record<string, unknown>,
  dt: Record<string, unknown>,
  itemName: string
): 'poke' | 'fritto' | 'pesce' => {
  const explicit = item.item_type || dt.item_type;
  if (explicit === 'fritto' || explicit === 'pesce' || explicit === 'poke') {
    return explicit;
  }

  const name = itemName.toLowerCase();
  if (name.includes('cono') || name.includes('fritt')) return 'fritto';
  if (itemName.startsWith('🐟') || name.includes('kg')) return 'pesce';
  return 'poke';
};

export const mapKdsOrderItem = (item: Record<string, unknown>): KdsOrderItem => {
  let dt: Record<string, unknown> = {};
  if (typeof item.details === 'string') {
    try {
      dt = JSON.parse(item.details);
    } catch {
      dt = {};
    }
  } else if (typeof item.details === 'object' && item.details !== null) {
    dt = item.details as Record<string, unknown>;
  }

  const itemName = String(item.name || item.item_name || (dt.size ? `Poke ${dt.size}` : 'Poke'));
  const itemType = resolveKdsItemType(item, dt, itemName);

  const bases = Array.isArray(item.bases)
    ? (item.bases as string[])
    : Array.isArray(dt.bases)
      ? (dt.bases as string[])
      : Array.isArray(item.basi)
        ? (item.basi as string[])
        : Array.isArray(dt.basi)
          ? (dt.basi as string[])
          : [];

  const proteins = Array.isArray(item.proteins)
    ? (item.proteins as string[])
    : Array.isArray(dt.proteins)
      ? (dt.proteins as string[])
      : Array.isArray(item.proteine)
        ? (item.proteine as string[])
        : Array.isArray(dt.proteine)
          ? (dt.proteine as string[])
          : [];

  const toppings = Array.isArray(item.toppings)
    ? (item.toppings as string[])
    : Array.isArray(dt.toppings)
      ? (dt.toppings as string[])
      : Array.isArray(item.ingredienti)
        ? (item.ingredienti as string[])
        : Array.isArray(dt.ingredienti)
          ? (dt.ingredienti as string[])
          : [];

  const sauces = Array.isArray(item.sauces)
    ? (item.sauces as string[])
    : Array.isArray(dt.sauces)
      ? (dt.sauces as string[])
      : Array.isArray(item.salse)
        ? (item.salse as string[])
        : Array.isArray(dt.salse)
          ? (dt.salse as string[])
          : [];

  const hasSesame =
    itemType === 'poke'
      ? Boolean(dt.has_sesame ?? item.has_sesame ?? true)
      : undefined;

  return {
    id: String(item.id || Math.random()),
    item_name: itemName,
    item_type: itemType,
    size: String(item.size || dt.size || ''),
    bases,
    proteins,
    toppings,
    sauces,
    has_sesame: hasSesame,
    notes: String(item.notes || dt.notes || ''),
    price: Number(item.unit_price || item.price || 0),
    quantity: Number(item.quantity || 1),
    preparation: itemType === 'pesce' ? String(dt.preparation || '') : undefined,
    weight_grams:
      itemType === 'pesce' && typeof dt.weight_grams === 'number'
        ? dt.weight_grams
        : undefined,
  };
};

export const mapSupabaseOrderToKdsOrder = (o: Record<string, unknown>): KdsOrder => {
  const items: KdsOrderItem[] = Array.isArray(o.order_items)
    ? o.order_items.map((item: Record<string, unknown>) => mapKdsOrderItem(item))
    : [];

  return {
    id: String(o.id),
    display_id: String(o.friendly_id || `#${String(o.id).slice(-4).toUpperCase()}`),
    status: String(o.status || 'RICEVUTO'),
    customer_name: String(o.customer_name || 'Cliente'),
    phone: String(o.customer_phone || o.phone || ''),
    order_type: String(o.order_type || 'Ritiro'),
    delivery_address: o.delivery_address ? String(o.delivery_address) : undefined,
    total_price: Number(o.total_amount || o.total_price || 0),
    created_at: String(o.created_at || new Date().toISOString()),
    notes: o.notes ? String(o.notes) : '',
    order_items: items,
  };
};

export const mapLocalOrderToKdsOrder = (o: LocalOrder): KdsOrder => ({
  id: String(o.id),
  display_id: o.display_id || `#${String(o.id).slice(-4).toUpperCase()}`,
  status: o.status || 'RICEVUTO',
  customer_name: o.customer_name || 'Cliente',
  phone: (o as LocalOrder & { customer_phone?: string }).customer_phone || o.phone || '',
  order_type: o.order_type || 'Ritiro',
  delivery_address: o.delivery_address,
  total_price: Number((o as LocalOrder & { total_amount?: number }).total_amount || o.total_price || 0),
  created_at: o.created_at || new Date().toISOString(),
  notes: o.notes,
  order_items: (o.order_items || []).map((item) =>
    mapKdsOrderItem(item as unknown as Record<string, unknown>)
  ),
});

export type HistoryPeriod = 'today' | '7days' | '30days';

export const HISTORY_PAGE_SIZE = 20;

export const getHistoryDateRange = (period: HistoryPeriod): { start: string; end: string } => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === '7days') {
    start.setDate(start.getDate() - 6);
  } else if (period === '30days') {
    start.setDate(start.getDate() - 29);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const formatOrderDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

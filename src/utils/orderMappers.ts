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

export const resolveKdsItemType = (
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

export const mapKdsOrderItem = (item: object): KdsOrderItem => {
  const rec = item as Record<string, unknown>;
  let dt: Record<string, unknown> = {};
  if (typeof rec.details === 'string') {
    try {
      dt = JSON.parse(rec.details);
    } catch {
      dt = {};
    }
  } else if (typeof rec.details === 'object' && rec.details !== null) {
    dt = rec.details as Record<string, unknown>;
  }

  const itemName = String(rec.name || rec.item_name || (dt.size ? `Poke ${dt.size}` : 'Poke'));
  const itemType = resolveKdsItemType(rec, dt, itemName);

  const bases = Array.isArray(rec.bases)
    ? (rec.bases as string[])
    : Array.isArray(dt.bases)
      ? (dt.bases as string[])
      : Array.isArray(rec.basi)
        ? (rec.basi as string[])
        : Array.isArray(dt.basi)
          ? (dt.basi as string[])
          : [];

  const proteins = Array.isArray(rec.proteins)
    ? (rec.proteins as string[])
    : Array.isArray(dt.proteins)
      ? (dt.proteins as string[])
      : Array.isArray(rec.proteine)
        ? (rec.proteine as string[])
        : Array.isArray(dt.proteine)
          ? (dt.proteine as string[])
          : [];

  const toppings = Array.isArray(rec.toppings)
    ? (rec.toppings as string[])
    : Array.isArray(dt.toppings)
      ? (dt.toppings as string[])
      : Array.isArray(rec.ingredienti)
        ? (rec.ingredienti as string[])
        : Array.isArray(dt.ingredienti)
          ? (dt.ingredienti as string[])
          : [];

  const sauces = Array.isArray(rec.sauces)
    ? (rec.sauces as string[])
    : Array.isArray(dt.sauces)
      ? (dt.sauces as string[])
      : Array.isArray(rec.salse)
        ? (rec.salse as string[])
        : Array.isArray(dt.salse)
          ? (dt.salse as string[])
          : [];

  const hasSesame =
    itemType === 'poke'
      ? Boolean(dt.has_sesame ?? rec.has_sesame ?? true)
      : undefined;

  return {
    id: String(rec.id || Math.random()),
    item_name: itemName,
    item_type: itemType,
    size: String(rec.size || dt.size || ''),
    bases,
    proteins,
    toppings,
    sauces,
    has_sesame: hasSesame,
    notes: String(rec.notes || dt.notes || ''),
    price: Number(rec.unit_price || rec.price || 0),
    quantity: Number(rec.quantity || 1),
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
  order_items: (o.order_items || []).map((item) => mapKdsOrderItem(item)),
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

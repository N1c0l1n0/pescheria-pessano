export interface LocalOrderItem {
  id?: string;
  order_id?: string;
  item_name?: string;
  size?: string;
  bases?: string[];
  proteins?: string[];
  toppings?: string[];
  sauces?: string[];
  has_sesame?: boolean;
  notes?: string;
  price?: number;
  quantity?: number;
}

export interface LocalOrder {
  id: string;
  display_id?: string;
  status: 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO' | string;
  customer_name: string;
  phone?: string;
  order_type: 'Ritiro' | 'Consegna' | string;
  delivery_address?: string;
  total_price: number;
  created_at: string;
  estimated_time?: string;
  notes?: string;
  order_items: LocalOrderItem[];
}

const STORAGE_KEY = 'pescheria_pessano_orders_store';
const EVENT_KEY = 'local-orders-updated';

/**
 * Get all local orders stored in localStorage
 */
export function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading local orders:', e);
    return [];
  }
}

/**
 * Save or update a single local order
 */
export function saveLocalOrder(order: LocalOrder): void {
  try {
    const existing = getLocalOrders();
    const idx = existing.findIndex((o) => o.id === order.id || (o.phone && o.phone === order.phone && o.id === order.id));
    
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...order };
    } else {
      existing.unshift(order);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (e) {
    console.error('Error saving local order:', e);
  }
}

/**
 * Find a local order by ID or phone number
 */
export function getLocalOrderById(id: string): LocalOrder | null {
  const orders = getLocalOrders();
  const match = orders.find((o) => String(o.id) === String(id) || o.phone === id);
  return match || null;
}

/**
 * Update status of an existing local order
 */
export function updateLocalOrderStatus(id: string, newStatus: string): void {
  try {
    const existing = getLocalOrders();
    let updated = false;

    const newList = existing.map((o) => {
      if (String(o.id) === String(id) || o.display_id === id) {
        updated = true;
        return { ...o, status: newStatus };
      }
      return o;
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event(EVENT_KEY));
    }
  } catch (e) {
    console.error('Error updating local order status:', e);
  }
}

/**
 * Subscribe to local order updates
 */
export function subscribeToLocalOrders(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      callback();
    }
  };

  const handleCustomEvent = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(EVENT_KEY, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(EVENT_KEY, handleCustomEvent);
  };
}

import { getQuickTimeOptionsForDate } from './openingHours';

export const MAX_POKE_PER_SLOT = 10;
export const POKE_SLOT_MINUTES = 20;

export type SlotDay = 'oggi' | 'domani';

export interface CapacityOrderItem {
  id?: string;
  item_type?: string;
  quantity?: number;
}

export interface CapacityOrder {
  id: string;
  status: string;
  created_at: string;
  notes?: string;
  order_items: CapacityOrderItem[];
}

export function mergeCapacityOrders(
  remote: CapacityOrder[],
  local: CapacityOrder[]
): CapacityOrder[] {
  const orders = new Map<string, CapacityOrder>();
  remote.forEach((order) => orders.set(order.id, order));
  local.forEach((order) => {
    const remoteOrder = orders.get(order.id);
    if (!remoteOrder) {
      orders.set(order.id, order);
      return;
    }

    orders.set(order.id, {
      ...remoteOrder,
      notes:
        parseClockAndDay(remoteOrder.notes) || !parseClockAndDay(order.notes)
          ? remoteOrder.notes
          : order.notes,
      order_items:
        remoteOrder.order_items?.length > 0
          ? remoteOrder.order_items
          : order.order_items,
    });
  });
  return Array.from(orders.values()).filter((order) => order.status !== 'COMPLETATO');
}

const ASAP_ERROR =
  'Non ci sono più fasce con abbastanza posti per le poke. Scegli un altro orario o riduci il numero di poke.';
const CLOSED_DAY_ERROR =
  'La pescheria è chiusa in questo giorno. Scegli un altro giorno.';

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function occupancyKey(dateKey: string, time: string): string {
  return `${dateKey}|${time}`;
}

export function countPokeInOrder(order: CapacityOrder): number {
  return (order.order_items || []).reduce((sum, item) => {
    if (item.item_type !== 'poke') return sum;
    const qty = Number(item.quantity);
    return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
  }, 0);
}

export function parseClockAndDay(notes?: string): { time: string; day: SlotDay } | null {
  if (!notes) return null;
  const match = notes.match(/Orario:\s*([^—\n]+)/i);
  if (!match || !match[1]) return null;
  const raw = match[1].trim();
  if (/asap|prima possibile/i.test(raw)) return null;
  const timeMatch = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (!timeMatch) return null;
  const time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  const day: SlotDay = /domani/i.test(raw) ? 'domani' : 'oggi';
  return { time, day };
}

export function slotDateKeyForOrder(order: CapacityOrder): string | null {
  const parsed = parseClockAndDay(order.notes);
  if (!parsed) return null;
  const created = new Date(order.created_at);
  if (Number.isNaN(created.getTime())) return null;
  const date = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  if (parsed.day === 'domani') {
    date.setDate(date.getDate() + 1);
  }
  return localDateKey(date);
}

export function containingSlotStart(timeHHMM: string, slotStarts: string[]): string | null {
  const target = timeToMinutes(timeHHMM);
  if (!Number.isFinite(target)) return null;
  let found: string | null = null;
  for (const start of slotStarts) {
    const startMin = timeToMinutes(start);
    if (startMin <= target) {
      found = start;
    }
  }
  if (!found) return null;
  if (target >= timeToMinutes(found) + POKE_SLOT_MINUTES) return null;
  return found;
}

export function occupancyBySlot(orders: CapacityOrder[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const order of orders) {
    if (order.status === 'COMPLETATO') continue;
    const poke = countPokeInOrder(order);
    if (poke <= 0) continue;
    const parsed = parseClockAndDay(order.notes);
    const dateKey = slotDateKeyForOrder(order);
    if (!parsed || !dateKey) continue;
    const [year, month, day] = dateKey.split('-').map(Number);
    const calendarDate = new Date(year, month - 1, day, 12, 0, 0);
    const allStarts = getQuickTimeOptionsForDate(calendarDate, { includePast: true });
    const start = containingSlotStart(parsed.time, allStarts) || parsed.time;
    const key = occupancyKey(dateKey, start);
    map[key] = (map[key] || 0) + poke;
  }
  return map;
}

export function slotAvailability(
  booked: number,
  cartPokeCount: number
): { disabled: boolean; caption: string } {
  if (cartPokeCount <= 0) {
    return { disabled: false, caption: '' };
  }
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
  if (remaining <= 0) {
    return { disabled: true, caption: 'Esaurito (10/10)' };
  }
  const caption = remaining === 1 ? '1 posto' : `${remaining} posti`;
  return {
    disabled: booked + cartPokeCount > MAX_POKE_PER_SLOT,
    caption,
  };
}

export function resolvePokeSubmitSlot(args: {
  pickupTime: string;
  selectedDay: SlotDay;
  slotStarts: string[];
  occupancy: Record<string, number>;
  dateKey: string;
  cartPokeCount: number;
}): { time: string; day: SlotDay } | { error: string } {
  if (args.cartPokeCount <= 0) {
    const parsed = parseClockAndDay(`Orario: ${args.pickupTime}`);
    return { time: parsed?.time || args.pickupTime, day: args.selectedDay };
  }
  if (args.cartPokeCount > MAX_POKE_PER_SLOT) {
    return { error: ASAP_ERROR };
  }
  if (args.slotStarts.length === 0) {
    return { error: CLOSED_DAY_ERROR };
  }

  const raw = args.pickupTime;
  const isAsap = /prima possibile|asap/i.test(raw);
  const parsed = parseClockAndDay(`Orario: ${raw}`);

  const fits = (time: string) => {
    const booked = args.occupancy[occupancyKey(args.dateKey, time)] || 0;
    return !slotAvailability(booked, args.cartPokeCount).disabled;
  };

  const fromIndex = (startIdx: number) => {
    for (let i = startIdx; i < args.slotStarts.length; i++) {
      const time = args.slotStarts[i];
      if (fits(time)) return { time, day: args.selectedDay };
    }
    return { error: ASAP_ERROR };
  };

  if (isAsap || !parsed) {
    return fromIndex(0);
  }

  const start = containingSlotStart(parsed.time, args.slotStarts) || parsed.time;
  const idx = args.slotStarts.indexOf(start);
  return fromIndex(idx >= 0 ? idx : 0);
}

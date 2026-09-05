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

export function countsTowardSlotCapacity(status: string): boolean {
  return status === 'RICEVUTO' || status === 'IN_PREPARAZIONE';
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
    if (!countsTowardSlotCapacity(order.status)) continue;
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

export type SlotSummaryVariant =
  | 'available'
  | 'low'
  | 'full'
  | 'warning'
  | 'unavailable'
  | 'loading';

export type SlotSummary = {
  variant: SlotSummaryVariant;
  headline: string;
  remaining: number;
  inCart: number;
  slotStart?: string;
  slotEnd?: string;
};

export interface BuildSlotSummaryArgs {
  pickupTime: string;
  selectedDay: SlotDay;
  dateKey: string;
  slotStarts: string[];
  slotOccupancy: Record<string, number>;
  cartPokeCount: number;
  occupancyLoaded: boolean;
  isDayClosed?: boolean;
  isCustomTime?: boolean;
  customTimeValid?: boolean;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

export function findFirstAvailableSlot(args: {
  slotStarts: string[];
  occupancy: Record<string, number>;
  dateKey: string;
  minSeats: number;
}): string | null {
  for (const time of args.slotStarts) {
    const booked = args.occupancy[occupancyKey(args.dateKey, time)] || 0;
    const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
    if (remaining >= args.minSeats) return time;
  }
  return null;
}

export type SlotAlternative = {
  time: string;
  end: string;
  remaining: number;
};

export function findNextAvailableSlots(args: {
  slotStarts: string[];
  occupancy: Record<string, number>;
  dateKey: string;
  minSeats: number;
  afterSlot?: string;
  limit?: number;
}): SlotAlternative[] {
  const limit = args.limit ?? 3;
  const afterIdx = args.afterSlot ? args.slotStarts.indexOf(args.afterSlot) : -1;
  const startIdx = afterIdx >= 0 ? afterIdx + 1 : 0;
  const results: SlotAlternative[] = [];

  for (const time of args.slotStarts.slice(startIdx)) {
    const booked = args.occupancy[occupancyKey(args.dateKey, time)] || 0;
    const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
    if (remaining >= args.minSeats) {
      results.push({
        time,
        end: addMinutesToTime(time, POKE_SLOT_MINUTES),
        remaining,
      });
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function formatSlotFullError(args: {
  slotStart: string;
  slotEnd: string;
  cartPokeCount: number;
  alternatives: SlotAlternative[];
}): string {
  if (args.alternatives.length === 0) {
    return `Nessuna fascia con abbastanza posti per ${args.cartPokeCount} poke. Scegli un altro giorno o riduci le poke.`;
  }
  const lines = [
    `Fascia ${args.slotStart}–${args.slotEnd} esaurita per ${args.cartPokeCount} poke.`,
    'Prossime fasce disponibili:',
  ];
  for (const alt of args.alternatives) {
    const posti = alt.remaining === 1 ? '1 posto' : `${alt.remaining} posti`;
    lines.push(`· ${alt.time}–${alt.end} · ${posti}`);
  }
  lines.push('Scegli un altro orario e riprova.');
  return lines.join('\n');
}

function formatSlotRange(slotStart: string): string {
  return `${slotStart}–${addMinutesToTime(slotStart, POKE_SLOT_MINUTES)}`;
}

function buildHeadline(args: {
  prefix: string;
  remaining: number;
  inCart: number;
  variant: SlotSummaryVariant;
}): string {
  if (args.variant === 'warning') {
    const posti = args.remaining === 1 ? '1 posto' : `${args.remaining} posti`;
    const pokeLabel = args.inCart === 1 ? '1 poke' : `${args.inCart} poke`;
    return `${args.prefix} · Attenzione: la fascia ha solo ${posti}, hai ${pokeLabel} nel carrello. Potresti dover cambiare orario.`;
  }
  if (args.variant === 'full') {
    return `${args.prefix} · Esaurito (10/10) — puoi continuare, ma l'ordine potrebbe non andare a buon fine`;
  }
  if (args.variant === 'unavailable') {
    return 'Nessuna fascia poke disponibile. Scegli un altro giorno o riduci le poke.';
  }
  const remainingLabel =
    args.remaining === 1 ? '1 poke rimasta' : `${args.remaining} poke rimaste`;
  const cartSuffix = args.inCart > 0 ? ` · ${args.inCart} nel tuo ordine` : '';
  return `${args.prefix} · ${remainingLabel}${cartSuffix}`;
}

function variantForSlot(booked: number, cartPokeCount: number): SlotSummaryVariant {
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
  if (cartPokeCount > remaining) return 'warning';
  if (remaining <= 0) return 'full';
  if (remaining <= 2) return 'low';
  return 'available';
}

export function buildSlotSummary(args: BuildSlotSummaryArgs): SlotSummary | null {
  if (args.isDayClosed) return null;
  if (!args.occupancyLoaded) {
    return {
      variant: 'loading',
      headline: 'Caricamento disponibilità…',
      remaining: 0,
      inCart: args.cartPokeCount,
    };
  }
  if (args.slotStarts.length === 0) return null;
  if (args.isCustomTime && args.customTimeValid === false) return null;

  const raw = args.pickupTime.replace(/\s*\((Oggi|Domani|oggi|domani)\)/gi, '').trim();
  const isAsap = /prima possibile|asap/i.test(raw);
  const minSeats = Math.max(1, args.cartPokeCount);

  if (isAsap) {
    const slotStart = findFirstAvailableSlot({
      slotStarts: args.slotStarts,
      occupancy: args.slotOccupancy,
      dateKey: args.dateKey,
      minSeats,
    });
    if (!slotStart) {
      return {
        variant: 'unavailable',
        headline: buildHeadline({
          prefix: '',
          remaining: 0,
          inCart: args.cartPokeCount,
          variant: 'unavailable',
        }),
        remaining: 0,
        inCart: args.cartPokeCount,
      };
    }
    const booked = args.slotOccupancy[occupancyKey(args.dateKey, slotStart)] || 0;
    const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
    const variant = variantForSlot(booked, args.cartPokeCount);
    return {
      variant,
      headline: buildHeadline({
        prefix: `Prima fascia libera: ${formatSlotRange(slotStart)}`,
        remaining,
        inCart: args.cartPokeCount,
        variant,
      }),
      remaining,
      inCart: args.cartPokeCount,
      slotStart,
      slotEnd: addMinutesToTime(slotStart, POKE_SLOT_MINUTES),
    };
  }

  const parsed = parseClockAndDay(`Orario: ${raw}`);
  if (!parsed) return null;

  const slotStart = containingSlotStart(parsed.time, args.slotStarts) || parsed.time;
  const booked = args.slotOccupancy[occupancyKey(args.dateKey, slotStart)] || 0;
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
  const variant = variantForSlot(booked, args.cartPokeCount);

  return {
    variant,
    headline: buildHeadline({
      prefix: `Fascia ${formatSlotRange(slotStart)}`,
      remaining,
      inCart: args.cartPokeCount,
      variant,
    }),
    remaining,
    inCart: args.cartPokeCount,
    slotStart,
    slotEnd: addMinutesToTime(slotStart, POKE_SLOT_MINUTES),
  };
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

export type ValidatePokeSubmitResult =
  | { ok: true; time: string; day: SlotDay }
  | { ok: false; error: string; alternatives?: SlotAlternative[] };

export function validatePokeSubmitSlot(args: {
  pickupTime: string;
  selectedDay: SlotDay;
  slotStarts: string[];
  occupancy: Record<string, number>;
  dateKey: string;
  cartPokeCount: number;
}): ValidatePokeSubmitResult {
  if (args.cartPokeCount <= 0) {
    const parsed = parseClockAndDay(`Orario: ${args.pickupTime}`);
    return { ok: true, time: parsed?.time || args.pickupTime, day: args.selectedDay };
  }
  if (args.cartPokeCount > MAX_POKE_PER_SLOT) {
    return { ok: false, error: ASAP_ERROR };
  }
  if (args.slotStarts.length === 0) {
    return { ok: false, error: CLOSED_DAY_ERROR };
  }

  const raw = args.pickupTime;
  const isAsap = /prima possibile|asap/i.test(raw);

  if (isAsap) {
    const time = findFirstAvailableSlot({
      slotStarts: args.slotStarts,
      occupancy: args.occupancy,
      dateKey: args.dateKey,
      minSeats: args.cartPokeCount,
    });
    if (!time) {
      return {
        ok: false,
        error: formatSlotFullError({
          slotStart: '',
          slotEnd: '',
          cartPokeCount: args.cartPokeCount,
          alternatives: [],
        }),
      };
    }
    return { ok: true, time, day: args.selectedDay };
  }

  const parsed = parseClockAndDay(`Orario: ${raw}`);
  if (!parsed) {
    return { ok: false, error: 'Orario non valido. Scegli un orario dal picker.' };
  }

  const slotStart = containingSlotStart(parsed.time, args.slotStarts) || parsed.time;
  const booked = args.occupancy[occupancyKey(args.dateKey, slotStart)] || 0;
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);

  if (args.cartPokeCount > remaining) {
    const slotEnd = addMinutesToTime(slotStart, POKE_SLOT_MINUTES);
    const alternatives = findNextAvailableSlots({
      slotStarts: args.slotStarts,
      occupancy: args.occupancy,
      dateKey: args.dateKey,
      minSeats: args.cartPokeCount,
      afterSlot: slotStart,
      limit: 3,
    });
    return {
      ok: false,
      error: formatSlotFullError({
        slotStart,
        slotEnd,
        cartPokeCount: args.cartPokeCount,
        alternatives,
      }),
      alternatives,
    };
  }

  return { ok: true, time: slotStart, day: args.selectedDay };
}

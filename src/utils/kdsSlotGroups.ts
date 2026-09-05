import type { KdsOrder } from './orderMappers';
import { getQuickTimeOptionsForDate } from './openingHours';
import {
  containingSlotStart,
  countPokeInOrder,
  occupancyKey,
  parseClockAndDay,
  slotDateKeyForOrder,
  type CapacityOrder,
} from './pokeSlotCapacity';

export interface SlotGroup {
  slotKey: string;
  slotTime: string;
  dateKey: string;
  pokeCount: number;
  orderCount: number;
  targetMs: number;
  orders: KdsOrder[];
}

export interface GroupedOrders {
  slotGroups: SlotGroup[];
  generalQueue: KdsOrder[];
}

function toCapacityOrder(order: KdsOrder): CapacityOrder {
  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    notes: order.notes,
    order_items: order.order_items,
  };
}

function slotTargetMs(dateKey: string, slotTime: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = slotTime.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

export function countPokeInKdsOrder(order: KdsOrder): number {
  return countPokeInOrder(toCapacityOrder(order));
}

export function resolveOrderSlotKey(order: KdsOrder): string | null {
  const capacityOrder = toCapacityOrder(order);
  if (countPokeInOrder(capacityOrder) <= 0) return null;

  const parsed = parseClockAndDay(order.notes);
  const dateKey = slotDateKeyForOrder(capacityOrder);
  if (!parsed || !dateKey) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const calendarDate = new Date(year, month - 1, day, 12, 0, 0);
  const slotStarts = getQuickTimeOptionsForDate(calendarDate, { includePast: true });
  const slotTime = containingSlotStart(parsed.time, slotStarts) || parsed.time;

  return occupancyKey(dateKey, slotTime);
}

export function groupActiveOrders(orders: KdsOrder[]): GroupedOrders {
  const slotMap = new Map<string, { slotTime: string; dateKey: string; orders: KdsOrder[] }>();
  const generalQueue: KdsOrder[] = [];

  for (const order of orders) {
    const slotKey = resolveOrderSlotKey(order);
    if (!slotKey) {
      generalQueue.push(order);
      continue;
    }

    const [dateKey, slotTime] = slotKey.split('|');
    const existing = slotMap.get(slotKey);
    if (existing) {
      existing.orders.push(order);
    } else {
      slotMap.set(slotKey, { slotTime, dateKey, orders: [order] });
    }
  }

  const slotGroups: SlotGroup[] = Array.from(slotMap.entries())
    .map(([slotKey, group]) => ({
      slotKey,
      slotTime: group.slotTime,
      dateKey: group.dateKey,
      pokeCount: group.orders.reduce((sum, order) => sum + countPokeInKdsOrder(order), 0),
      orderCount: group.orders.length,
      targetMs: slotTargetMs(group.dateKey, group.slotTime),
      orders: group.orders,
    }))
    .sort((a, b) => a.targetMs - b.targetMs);

  return { slotGroups, generalQueue };
}

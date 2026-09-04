import { describe, expect, it } from 'vitest';
import type { KdsOrder } from './orderMappers';
import {
  countPokeInKdsOrder,
  groupActiveOrders,
  resolveOrderSlotKey,
} from './kdsSlotGroups';

const kdsOrder = (
  id: string,
  notes: string,
  items: Array<{ item_type?: string; quantity?: number }>,
  status: KdsOrder['status'] = 'RICEVUTO',
  created_at = '2030-09-01T08:00:00.000Z'
): KdsOrder => ({
  id,
  display_id: `#${id}`,
  status,
  created_at,
  notes,
  customer_name: 'Mario',
  order_type: 'Ritiro',
  total_price: 12,
  order_items: items.map((item, index) => ({
    id: `${id}-${index}`,
    item_type: item.item_type ?? 'poke',
    quantity: item.quantity ?? 1,
  })),
});

describe('countPokeInKdsOrder', () => {
  it('sums poke quantities', () => {
    const order = kdsOrder('a', 'Orario: 12:20 (Oggi)', [
      { item_type: 'poke', quantity: 2 },
      { item_type: 'fritto', quantity: 1 },
    ]);
    expect(countPokeInKdsOrder(order)).toBe(2);
  });
});

describe('resolveOrderSlotKey', () => {
  it('returns null for fritti-only orders', () => {
    const order = kdsOrder('f', 'Orario: 12:20 (Oggi)', [{ item_type: 'fritto' }]);
    expect(resolveOrderSlotKey(order)).toBeNull();
  });

  it('maps custom time 12:07 into slot 12:00 on Sunday grid', () => {
    const order = kdsOrder('p', 'Orario: 12:07 (Oggi)', [{ item_type: 'poke' }]);
    expect(resolveOrderSlotKey(order)).toBe('2030-09-01|12:00');
  });

  it('returns null when notes have no parseable time', () => {
    const order = kdsOrder('asap', 'Orario: Prima possibile (Oggi)', [{ item_type: 'poke' }]);
    expect(resolveOrderSlotKey(order)).toBeNull();
  });
});

describe('groupActiveOrders', () => {
  it('groups same-slot poke orders with correct poke count', () => {
    const orders = [
      kdsOrder('1', 'Orario: 12:19 (Oggi)', [{ item_type: 'poke', quantity: 2 }]),
      kdsOrder('2', 'Orario: 12:07 (Oggi)', [{ item_type: 'poke', quantity: 1 }]),
    ];

    const { slotGroups, generalQueue } = groupActiveOrders(orders);

    expect(generalQueue).toEqual([]);
    expect(slotGroups).toHaveLength(1);
    expect(slotGroups[0].slotTime).toBe('12:00');
    expect(slotGroups[0].pokeCount).toBe(3);
    expect(slotGroups[0].orderCount).toBe(2);
    expect(slotGroups[0].orders.map((o) => o.id)).toEqual(['1', '2']);
  });

  it('creates separate groups for different slots sorted by urgency', () => {
    const orders = [
      kdsOrder('late', 'Orario: 12:40 (Oggi)', [{ item_type: 'poke' }]),
      kdsOrder('early', 'Orario: 12:00 (Oggi)', [{ item_type: 'poke' }]),
    ];

    const { slotGroups } = groupActiveOrders(orders);

    expect(slotGroups.map((g) => g.slotTime)).toEqual(['12:00', '12:40']);
  });

  it('puts mixed poke+fritti orders in the slot group', () => {
    const order = kdsOrder('mix', 'Orario: 12:20 (Oggi)', [
      { item_type: 'poke' },
      { item_type: 'fritto' },
    ]);

    const { slotGroups, generalQueue } = groupActiveOrders([order]);

    expect(generalQueue).toEqual([]);
    expect(slotGroups).toHaveLength(1);
    expect(slotGroups[0].orders[0].id).toBe('mix');
  });

  it('puts non-slot orders in general queue', () => {
    const order = kdsOrder('fish', 'Orario: 12:20 (Oggi)', [{ item_type: 'pesce' }]);

    const { slotGroups, generalQueue } = groupActiveOrders([order]);

    expect(slotGroups).toEqual([]);
    expect(generalQueue.map((o) => o.id)).toEqual(['fish']);
  });
});

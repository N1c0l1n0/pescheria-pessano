import { describe, expect, it } from 'vitest';
import {
  MAX_POKE_PER_SLOT,
  containingSlotStart,
  countPokeInOrder,
  mergeCapacityOrders,
  occupancyBySlot,
  resolvePokeSubmitSlot,
  slotAvailability,
  type CapacityOrder,
} from './pokeSlotCapacity';

const pokeOrder = (
  id: string,
  notes: string,
  pokeCount: number,
  status = 'RICEVUTO',
  created_at = '2030-09-03T08:00:00.000Z'
): CapacityOrder => ({
  id,
  status,
  created_at,
  notes,
  order_items: Array.from({ length: pokeCount }, (_, i) => ({
    item_type: 'poke' as const,
    quantity: 1,
    id: `${id}-${i}`,
  })),
});

describe('mergeCapacityOrders', () => {
  it('drops a remotely completed order even when the local copy is stale and active', () => {
    const remote = [
      pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3, 'COMPLETATO'),
    ];
    const local = [pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3)];

    const merged = mergeCapacityOrders(remote, local);

    expect(merged).toEqual([]);
    expect(occupancyBySlot(merged)).toEqual({});
  });

  it('keeps a local-only active poke order', () => {
    const localOrder = pokeOrder('local', 'Orario: 12:20 (Oggi)', 2);

    expect(mergeCapacityOrders([], [localOrder])).toEqual([localOrder]);
  });

  it('keeps local poke items when the remote duplicate has no items', () => {
    const remoteOrder = {
      ...pokeOrder('shared', 'Orario: 12:20 (Oggi)', 2),
      order_items: [],
    };
    const localOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 2);

    const occupancy = occupancyBySlot(
      mergeCapacityOrders([remoteOrder], [localOrder])
    );
    const key = Object.keys(occupancy).find((entry) => entry.endsWith('|12:20'));

    expect(occupancy[key!]).toBe(2);
  });

  it('uses remote poke items when the remote duplicate has items', () => {
    const remoteOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3);
    const localOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 2);

    const occupancy = occupancyBySlot(
      mergeCapacityOrders([remoteOrder], [localOrder])
    );
    const key = Object.keys(occupancy).find((entry) => entry.endsWith('|12:20'));

    expect(occupancy[key!]).toBe(3);
  });

  it('keeps local pickup notes when remote notes have no parseable time', () => {
    const remoteOrder = pokeOrder('shared', 'Consegna al banco', 3);
    const localOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 2);

    const [merged] = mergeCapacityOrders([remoteOrder], [localOrder]);

    expect(merged.notes).toBe(localOrder.notes);
    expect(merged.order_items).toBe(remoteOrder.order_items);
  });
});

describe('countPokeInOrder', () => {
  it('counts poke quantities and ignores fritti', () => {
    const order: CapacityOrder = {
      id: '1',
      status: 'RICEVUTO',
      created_at: '2030-09-03T08:00:00.000Z',
      notes: 'Orario: 12:20 (Oggi)',
      order_items: [
        { item_type: 'poke', quantity: 2 },
        { item_type: 'fritto', quantity: 3 },
        { item_type: 'pesce', quantity: 1 },
      ],
    };
    expect(countPokeInOrder(order)).toBe(2);
  });
});

describe('occupancyBySlot', () => {
  it('sums poke into the notes slot and skips completed orders', () => {
    const map = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 6),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 4, 'COMPLETATO'),
    ]);
    const key = Object.keys(map).find((k) => k.endsWith('|12:20'));
    expect(key).toBeTruthy();
    expect(map[key!]).toBe(9);
  });
});

describe('slotAvailability', () => {
  it('disables full slots with Esaurito label', () => {
    const result = slotAvailability(MAX_POKE_PER_SLOT, 1);
    expect(result.disabled).toBe(true);
    expect(result.caption).toBe('Esaurito (10/10)');
  });

  it('disables when remaining is less than the cart', () => {
    const result = slotAvailability(7, 4);
    expect(result.disabled).toBe(true);
    expect(result.caption).toBe('3 posti');
  });

  it('allows a slot with enough remaining seats', () => {
    const result = slotAvailability(7, 3);
    expect(result.disabled).toBe(false);
    expect(result.caption).toBe('3 posti');
  });

  it('does not apply the cap when the cart has no poke', () => {
    const result = slotAvailability(10, 0);
    expect(result.disabled).toBe(false);
    expect(result.caption).toBe('');
  });
});

describe('containingSlotStart', () => {
  it('maps 12:07 into 11:50 on an 08:30 grid', () => {
    const starts = ['11:50', '12:10', '12:30'];
    expect(containingSlotStart('12:07', starts)).toBe('11:50');
  });
});

describe('resolvePokeSubmitSlot', () => {
  const slots = ['12:00', '12:20', '12:40'];
  const dateKey = '2030-09-03';

  it('assigns Prima possibile to the first slot with enough seats', () => {
    const occupancy = { [`${dateKey}|12:00`]: 10, [`${dateKey}|12:20`]: 2 };
    const result = resolvePokeSubmitSlot({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 3,
    });
    expect(result).toEqual({ time: '12:20', day: 'oggi' });
  });

  it('moves a full chosen slot to the next fit', () => {
    const occupancy = { [`${dateKey}|12:20`]: 10 };
    const result = resolvePokeSubmitSlot({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 2,
    });
    expect(result).toEqual({ time: '12:40', day: 'oggi' });
  });

  it('returns the blocking error when no slot fits', () => {
    const occupancy = {
      [`${dateKey}|12:00`]: 10,
      [`${dateKey}|12:20`]: 10,
      [`${dateKey}|12:40`]: 10,
    };
    const result = resolvePokeSubmitSlot({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 1,
    });
    expect(result).toEqual({
      error:
        'Non ci sono più fasce con abbastanza posti per le poke. Scegli un altro orario o riduci il numero di poke.',
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  MAX_POKE_PER_SLOT,
  buildSlotSummary,
  containingSlotStart,
  countPokeInOrder,
  countsTowardSlotCapacity,
  findFirstAvailableSlot,
  findNextAvailableSlots,
  formatSlotFullError,
  mergeCapacityOrders,
  occupancyBySlot,
  parseClockAndDay,
  validatePokeSubmitSlot,
  slotDateKeyForOrder,
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
    const key = Object.keys(occupancy).find((entry) => entry.endsWith('|12:10'));

    expect(occupancy[key!]).toBe(2);
  });

  it('uses remote poke items when the remote duplicate has items', () => {
    const remoteOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3);
    const localOrder = pokeOrder('shared', 'Orario: 12:20 (Oggi)', 2);

    const occupancy = occupancyBySlot(
      mergeCapacityOrders([remoteOrder], [localOrder])
    );
    const key = Object.keys(occupancy).find((entry) => entry.endsWith('|12:10'));

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

describe('countsTowardSlotCapacity', () => {
  it('returns true for active prep statuses', () => {
    expect(countsTowardSlotCapacity('RICEVUTO')).toBe(true);
    expect(countsTowardSlotCapacity('IN_PREPARAZIONE')).toBe(true);
  });

  it('returns false for PRONTO and COMPLETATO', () => {
    expect(countsTowardSlotCapacity('PRONTO')).toBe(false);
    expect(countsTowardSlotCapacity('COMPLETATO')).toBe(false);
  });
});

describe('occupancyBySlot PRONTO exclusion', () => {
  it('skips PRONTO orders when summing slot occupancy', () => {
    const map = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 6),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 4, 'COMPLETATO'),
    ]);
    const key = Object.keys(map).find((k) => k.endsWith('|12:10'));
    expect(key).toBeTruthy();
    expect(map[key!]).toBe(6);
  });

  it('frees capacity when orders move to PRONTO', () => {
    const active = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 4),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 3),
    ]);
    const key = Object.keys(active).find((k) => k.endsWith('|12:10'))!;
    expect(active[key]).toBe(10);

    const afterPronto = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 4),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
    ]);
    expect(afterPronto[key]).toBe(4);
    expect(MAX_POKE_PER_SLOT - afterPronto[key]).toBe(6);
  });
});

describe('mergeCapacityOrders PRONTO remote wins', () => {
  it('excludes a remotely PRONTO order even when local copy is stale and active', () => {
    const remote = [
      pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
    ];
    const local = [pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3, 'IN_PREPARAZIONE')];

    const merged = mergeCapacityOrders(remote, local);
    const key = Object.keys(occupancyBySlot(merged)).find((k) => k.endsWith('|12:10'));

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('PRONTO');
    expect(key).toBeUndefined();
  });
});

describe('occupancyBySlot', () => {
  it('sums poke into the canonical slot and skips completed orders', () => {
    const map = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 6),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 4, 'COMPLETATO'),
    ]);
    const key = Object.keys(map).find((k) => k.endsWith('|12:10'));
    expect(key).toBeTruthy();
    expect(map[key!]).toBe(9);
  });

  it('stores only the canonical slot start', () => {
    const map = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:07 (Oggi)', 2),
    ]);
    const dateKey = Object.keys(map)[0]?.split('|')[0];

    expect(map[`${dateKey}|11:50`]).toBe(2);
    expect(map[`${dateKey}|12:07`]).toBeUndefined();
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

  it('returns null between opening blocks', () => {
    const starts = ['11:50', '12:10', '18:30', '18:50'];
    expect(containingSlotStart('15:00', starts)).toBeNull();
  });
});

describe('order note parsing', () => {
  it('advances Domani one calendar day from the local created_at date', () => {
    const order = pokeOrder(
      'tomorrow',
      'Orario: 12:20 (Domani)',
      1,
      'RICEVUTO',
      '2030-09-03T23:30:00'
    );

    expect(slotDateKeyForOrder(order)).toBe('2030-09-04');
  });

  it('does not parse Prima possibile as a clock', () => {
    expect(parseClockAndDay('Orario: Prima possibile (Oggi)')).toBeNull();
  });
});

describe('validatePokeSubmitSlot', () => {
  const slots = ['12:00', '12:20', '12:40'];
  const dateKey = '2030-09-03';

  it('accepts Prima possibile when first fitting slot exists', () => {
    const occupancy = { [`${dateKey}|12:00`]: 10, [`${dateKey}|12:20`]: 2 };
    const result = validatePokeSubmitSlot({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 3,
    });
    expect(result).toEqual({ ok: true, time: '12:20', day: 'oggi' });
  });

  it('rejects a full chosen slot without auto-shift', () => {
    const occupancy = { [`${dateKey}|12:20`]: 10, [`${dateKey}|12:40`]: 2 };
    const result = validatePokeSubmitSlot({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 2,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Fascia 12:20–12:40 esaurita per 2 poke.');
    expect(result.error).toContain('12:40–13:00');
    expect(result.alternatives).toEqual([{ time: '12:40', end: '13:00', remaining: 8 }]);
  });

  it('returns error when no slot fits for ASAP', () => {
    const occupancy = {
      [`${dateKey}|12:00`]: 10,
      [`${dateKey}|12:20`]: 10,
      [`${dateKey}|12:40`]: 10,
    };
    const result = validatePokeSubmitSlot({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy,
      dateKey,
      cartPokeCount: 1,
    });
    expect(result).toEqual({
      ok: false,
      error:
        'Nessuna fascia con abbastanza posti per 1 poke. Scegli un altro giorno o riduci le poke.',
    });
  });

  it('returns closed-day error when no slots exist', () => {
    const result = validatePokeSubmitSlot({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      slotStarts: [],
      occupancy: {},
      dateKey,
      cartPokeCount: 1,
    });
    expect(result).toEqual({ ok: false, error: 'La pescheria è chiusa in questo giorno. Scegli un altro giorno.' });
  });

  it('accepts chosen slot when enough remaining', () => {
    const result = validatePokeSubmitSlot({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      slotStarts: slots,
      occupancy: { [`${dateKey}|12:20`]: 7 },
      dateKey,
      cartPokeCount: 2,
    });
    expect(result).toEqual({ ok: true, time: '12:20', day: 'oggi' });
  });
});

describe('findNextAvailableSlots', () => {
  const dateKey = '2030-09-03';
  const slots = ['12:00', '12:20', '12:40', '13:00'];

  it('returns up to 3 slots with enough remaining seats after a given slot', () => {
    const occupancy = {
      [`${dateKey}|12:00`]: 10,
      [`${dateKey}|12:20`]: 10,
      [`${dateKey}|12:40`]: 6,
      [`${dateKey}|13:00`]: 2,
    };
    expect(
      findNextAvailableSlots({
        slotStarts: slots,
        occupancy,
        dateKey,
        minSeats: 2,
        afterSlot: '12:20',
        limit: 3,
      })
    ).toEqual([
      { time: '12:40', end: '13:00', remaining: 4 },
      { time: '13:00', end: '13:20', remaining: 8 },
    ]);
  });

  it('returns empty array when no slot fits', () => {
    const occupancy = {
      [`${dateKey}|12:00`]: 10,
      [`${dateKey}|12:20`]: 10,
      [`${dateKey}|12:40`]: 10,
    };
    expect(
      findNextAvailableSlots({
        slotStarts: slots.slice(0, 3),
        occupancy,
        dateKey,
        minSeats: 1,
        afterSlot: '12:00',
      })
    ).toEqual([]);
  });
});

describe('formatSlotFullError', () => {
  it('formats error with alternatives', () => {
    const message = formatSlotFullError({
      slotStart: '12:30',
      slotEnd: '12:50',
      cartPokeCount: 2,
      alternatives: [
        { time: '13:10', end: '13:30', remaining: 4 },
        { time: '13:30', end: '13:50', remaining: 1 },
      ],
    });
    expect(message).toContain('Fascia 12:30–12:50 esaurita per 2 poke.');
    expect(message).toContain('Prossime fasce disponibili:');
    expect(message).toContain('· 13:10–13:30 · 4 posti');
    expect(message).toContain('· 13:30–13:50 · 1 posto');
    expect(message).toContain('Scegli un altro orario e riprova.');
  });

  it('formats error without alternatives when cart is too large', () => {
    const message = formatSlotFullError({
      slotStart: '12:30',
      slotEnd: '12:50',
      cartPokeCount: 5,
      alternatives: [],
    });
    expect(message).toContain('Nessuna fascia con abbastanza posti per 5 poke.');
  });
});

describe('findFirstAvailableSlot', () => {
  const dateKey = '2030-09-03';
  const slots = ['12:00', '12:20', '12:40'];

  it('returns the first slot with enough remaining seats', () => {
    const occupancy = { [`${dateKey}|12:00`]: 10, [`${dateKey}|12:20`]: 7 };
    expect(
      findFirstAvailableSlot({ slotStarts: slots, occupancy, dateKey, minSeats: 3 })
    ).toBe('12:20');
  });

  it('returns null when no slot fits', () => {
    const occupancy = {
      [`${dateKey}|12:00`]: 10,
      [`${dateKey}|12:20`]: 10,
      [`${dateKey}|12:40`]: 10,
    };
    expect(
      findFirstAvailableSlot({ slotStarts: slots, occupancy, dateKey, minSeats: 1 })
    ).toBeNull();
  });
});

describe('buildSlotSummary', () => {
  const dateKey = '2030-09-03';
  const slots = ['12:00', '12:20', '12:40'];

  it('returns loading when occupancy is not loaded', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: {},
      cartPokeCount: 0,
      occupancyLoaded: false,
    });
    expect(summary?.variant).toBe('loading');
  });

  it('shows remaining seats with empty cart', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 7 },
      cartPokeCount: 0,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('available');
    expect(summary?.remaining).toBe(3);
    expect(summary?.headline).toContain('Fascia 12:20–12:40');
    expect(summary?.headline).toContain('3 poke rimaste');
    expect(summary?.headline).not.toContain('nel tuo ordine');
  });

  it('includes cart count in headline', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 7 },
      cartPokeCount: 1,
      occupancyLoaded: true,
    });
    expect(summary?.headline).toContain('1 nel tuo ordine');
  });

  it('marks warning when cart exceeds remaining', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 8 },
      cartPokeCount: 3,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('warning');
    expect(summary?.headline).toContain('Attenzione');
    expect(summary?.headline).toContain('2 posti');
    expect(summary?.headline).toContain('3 poke nel carrello');
  });

  it('marks full with soft copy when cart is empty', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 10 },
      cartPokeCount: 0,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('full');
    expect(summary?.headline).toContain('Esaurito (10/10)');
    expect(summary?.headline).toContain('puoi continuare');
  });

  it('marks warning when slot is full but cart has poke', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 10 },
      cartPokeCount: 1,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('warning');
  });

  it('marks low stock when remaining is 2 or less but cart still fits', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 8 },
      cartPokeCount: 1,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('low');
    expect(summary?.remaining).toBe(2);
  });

  it('resolves Prima possibile to the first available slot', () => {
    const summary = buildSlotSummary({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:00`]: 10, [`${dateKey}|12:20`]: 7 },
      cartPokeCount: 0,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('available');
    expect(summary?.headline).toContain('Prima fascia libera: 12:20–12:40');
    expect(summary?.remaining).toBe(3);
  });

  it('returns unavailable when ASAP has no fitting slot', () => {
    const summary = buildSlotSummary({
      pickupTime: 'Prima possibile (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: {
        [`${dateKey}|12:00`]: 10,
        [`${dateKey}|12:20`]: 10,
        [`${dateKey}|12:40`]: 10,
      },
      cartPokeCount: 1,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('unavailable');
    expect(summary?.headline).toContain('Nessuna fascia poke disponibile');
  });

  it('returns null for closed day', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: [],
      slotOccupancy: {},
      cartPokeCount: 0,
      occupancyLoaded: true,
      isDayClosed: true,
    });
    expect(summary).toBeNull();
  });
});

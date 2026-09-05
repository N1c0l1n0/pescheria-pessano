# KDS Filter, Poke Slots, Fried-on-Arrival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clickable KDS status chips, kitchen cap of 10 poke per 20-minute slot, and on-arrival copy for fried cones.

**Architecture:** Pure helpers for KDS filters, poke occupancy, and fried copy. Wire them into `KdsBoard`, `AlarmTimePicker`, `PokeBuilder`, and `OrderTracking`. No new database columns; pickup time stays in order notes as `Orario: HH:MM (Oggi|Domani)`.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase client already in `src/lib/supabase.ts`.

## Global Constraints

- Do not `git push`. Local commits only.
- Do not add Supabase migrations, RPC, or new order columns.
- Poke cap is kitchen-wide: 10 bowls per 20-minute slot across all non-`COMPLETATO` orders. Fritti and pesce do not count.
- `Prima possibile` with poke in the cart resolves to the first fitting slot; stored notes must never say `Prima possibile` when poke were ordered.
- Full slots stay visible and disabled with label `Esaurito (10/10)`.
- KDS status filter: one status at a time; second click on the same chip clears to `ALL`; combines with Tutti/Ritiro/Consegna; chip counts remain unfiltered totals; history view unchanged.
- Fried copy is verbatim:
  - Pickup: `I coni fritti si preparano all'arrivo: presentati al banco e li friggiamo al momento, caldi.`
  - Delivery: `I coni fritti si friggono al momento della partenza, così arrivano caldi.`
  - KDS: `Friggere all'arrivo`
- Follow existing UI patterns (inline styles in KDS/time picker, CSS classes in PokeBuilder).
- TDD for new util modules. Add Vitest once in Task 1.

## File Structure

- Create: `src/utils/kdsFilters.ts` — fulfillment + status predicates and empty-state copy
- Create: `src/utils/kdsFilters.test.ts`
- Create: `src/utils/pokeSlotCapacity.ts` — 20-min occupancy, ASAP assign, submit resolve
- Create: `src/utils/pokeSlotCapacity.test.ts`
- Create: `src/utils/friedArrival.ts` — locked copy + pickup/delivery helper
- Create: `src/utils/friedArrival.test.ts`
- Modify: `package.json` — add `vitest` and `"test": "vitest run"`
- Modify: `vite.config.ts` — vitest `environment: 'node'`
- Modify: `src/utils/openingHours.ts` — 20-minute quick slots from opening start
- Modify: `src/components/KdsBoard.tsx` — clickable status chips, use `kdsFilters` + fried KDS badge
- Modify: `src/components/AlarmTimePicker.tsx` — occupancy labels, disable full slots
- Modify: `src/components/PokeBuilder.tsx` — occupancy fetch, ASAP resolve, 10-poke cap, fried cart notice
- Modify: `src/components/OrderTracking.tsx` — fried banner when order has fritto

---

### Task 1: KDS status filter

**Files:**
- Create: `src/utils/kdsFilters.ts`
- Create: `src/utils/kdsFilters.test.ts`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/components/KdsBoard.tsx`

**Interfaces:**
- Consumes: `KdsOrder.status`, `KdsOrder.order_type`, existing `activeFilter: 'TUTTI' | 'RITIRO' | 'CONSEGNA'`
- Produces: `StatusFilter`, `nextStatusFilter`, `matchesFulfillmentFilter`, `matchesStatusFilter`, `emptyStatusListCopy`

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```

In `package.json` scripts add:

```json
"test": "vitest run"
```

In `vite.config.ts` add inside `defineConfig`:

```ts
test: {
  environment: 'node',
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/utils/kdsFilters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  emptyStatusListCopy,
  matchesFulfillmentFilter,
  matchesStatusFilter,
  nextStatusFilter,
} from './kdsFilters';

describe('nextStatusFilter', () => {
  it('selects the clicked status when none is active', () => {
    expect(nextStatusFilter('ALL', 'RICEVUTO')).toBe('RICEVUTO');
  });

  it('clears when the same status is clicked again', () => {
    expect(nextStatusFilter('RICEVUTO', 'RICEVUTO')).toBe('ALL');
  });

  it('replaces when a different status is clicked', () => {
    expect(nextStatusFilter('RICEVUTO', 'PRONTO')).toBe('PRONTO');
  });
});

describe('matchesStatusFilter', () => {
  it('passes every status when filter is ALL', () => {
    expect(matchesStatusFilter('RICEVUTO', 'ALL')).toBe(true);
    expect(matchesStatusFilter('PRONTO', 'ALL')).toBe(true);
  });

  it('matches only the selected status', () => {
    expect(matchesStatusFilter('RICEVUTO', 'RICEVUTO')).toBe(true);
    expect(matchesStatusFilter('IN_PREPARAZIONE', 'RICEVUTO')).toBe(false);
  });
});

describe('matchesFulfillmentFilter', () => {
  it('ANDs with ritiro', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'RITIRO')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'RITIRO')).toBe(false);
  });
});

describe('emptyStatusListCopy', () => {
  it('uses the generic empty copy for ALL', () => {
    expect(emptyStatusListCopy('ALL').title).toBe('Nessun Ordine Attivo al Momento!');
  });

  it('uses status-specific titles', () => {
    expect(emptyStatusListCopy('RICEVUTO').title).toBe('Nessun ordine in attesa');
    expect(emptyStatusListCopy('IN_PREPARAZIONE').title).toBe('Nessun ordine in preparazione');
    expect(emptyStatusListCopy('PRONTO').title).toBe('Nessun ordine pronto');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/utils/kdsFilters.test.ts`

Expected: FAIL with cannot find module `./kdsFilters`

- [ ] **Step 4: Write minimal implementation**

Create `src/utils/kdsFilters.ts`:

```ts
export type FulfillmentFilter = 'TUTTI' | 'RITIRO' | 'CONSEGNA';
export type StatusFilter = 'ALL' | 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO';

export function nextStatusFilter(
  current: StatusFilter,
  clicked: Exclude<StatusFilter, 'ALL'>
): StatusFilter {
  return current === clicked ? 'ALL' : clicked;
}

export function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true;
  return status === filter;
}

export function matchesFulfillmentFilter(
  orderType: string,
  filter: FulfillmentFilter
): boolean {
  const type = orderType.toLowerCase();
  if (filter === 'RITIRO') return type.includes('ritiro');
  if (filter === 'CONSEGNA') return type.includes('consegna');
  return true;
}

export function emptyStatusListCopy(filter: StatusFilter): { title: string; body: string } {
  if (filter === 'RICEVUTO') {
    return {
      title: 'Nessun ordine in attesa',
      body: 'Non ci sono ordini ricevuti da preparare.',
    };
  }
  if (filter === 'IN_PREPARAZIONE') {
    return {
      title: 'Nessun ordine in preparazione',
      body: 'Nessun ordine è attualmente in preparazione.',
    };
  }
  if (filter === 'PRONTO') {
    return {
      title: 'Nessun ordine pronto',
      body: 'Nessun ordine è pronto per il ritiro o la consegna.',
    };
  }
  return {
    title: 'Nessun Ordine Attivo al Momento!',
    body: 'Tutti gli ordini in coda sono stati preparati e completati. In attesa di nuovi ordini in arrivo dai clienti.',
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/utils/kdsFilters.test.ts`

Expected: PASS

- [ ] **Step 6: Wire KdsBoard**

Add import:

```ts
import {
  emptyStatusListCopy,
  matchesFulfillmentFilter,
  matchesStatusFilter,
  nextStatusFilter,
  type StatusFilter,
} from '../utils/kdsFilters';
```

Add state next to `activeFilter`:

```ts
const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
```

Replace `filteredOrders` / `filteredHistoryOrders` predicates:

```ts
const filteredOrders = orders.filter((o) => {
  if (!matchesFulfillmentFilter(o.order_type, activeFilter)) return false;
  return matchesStatusFilter(o.status, statusFilter);
});

const filteredHistoryOrders = historyOrders.filter((o) =>
  matchesFulfillmentFilter(o.order_type, activeFilter)
);
```

Do **not** apply `statusFilter` to history.

Turn the three count `div`s (In Attesa / In Prep / Pronti) into `<button type="button">` with:

- `onClick={() => setStatusFilter((current) => nextStatusFilter(current, 'RICEVUTO'))}` (and the matching status for the other two)
- `aria-pressed={statusFilter === 'RICEVUTO'}`
- Keep the existing colors. When pressed, strengthen the background/border (e.g. In Attesa pressed: `backgroundColor: 'rgba(234, 179, 8, 0.35)'`, `boxShadow: '0 0 0 1px #FACC15'`). Unpressed stays as today.
- `cursor: 'pointer'`
- Counts still use `countRicevuto` / `countInPrep` / `countPronto` from the unfiltered `orders` array.

In the empty active list, replace hardcoded title/body with:

```ts
const emptyCopy = emptyStatusListCopy(statusFilter);
```

Use `emptyCopy.title` and `emptyCopy.body`.

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run && npx tsc --noEmit`

Expected: PASS / no errors

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/utils/kdsFilters.ts src/utils/kdsFilters.test.ts src/components/KdsBoard.tsx
git commit -m "$(cat <<'EOF'
feat(kds): filter active orders by clicking status chips

EOF
)"
```

---

### Task 2: 10 poke per 20-minute slot

**Files:**
- Create: `src/utils/pokeSlotCapacity.ts`
- Create: `src/utils/pokeSlotCapacity.test.ts`
- Modify: `src/utils/openingHours.ts`
- Modify: `src/components/AlarmTimePicker.tsx`
- Modify: `src/components/PokeBuilder.tsx`

**Interfaces:**
- Consumes: `getQuickTimeOptionsForDate`, `KdsOrder`-shaped orders, cart poke count, `pickupTime` / `selectedDay`
- Produces: `MAX_POKE_PER_SLOT = 10`, `occupancyBySlot`, `slotAvailability`, `resolvePokeSubmitSlot`

- [ ] **Step 1: Write failing tests for 20-minute grid**

Create `src/utils/openingHours.test.ts` (or add a describe in `pokeSlotCapacity.test.ts` that imports `getQuickTimeOptionsForDate`). Prefer `src/utils/openingHours.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getQuickTimeOptionsForDate } from './openingHours';

describe('getQuickTimeOptionsForDate 20-minute grid', () => {
  it('starts at 08:30 and steps 20 minutes on a Tuesday far in the future', () => {
    const date = new Date(2030, 8, 3, 7, 0, 0); // Tuesday 3 Sep 2030, before open
    const slots = getQuickTimeOptionsForDate(date);
    expect(slots[0]).toBe('08:30');
    expect(slots[1]).toBe('08:50');
    expect(slots[2]).toBe('09:10');
    expect(slots).toContain('14:30');
    expect(slots).not.toContain('14:50');
  });

  it('starts Friday evening at 17:45 not 18:00', () => {
    const date = new Date(2030, 8, 6, 7, 0, 0); // Friday
    const slots = getQuickTimeOptionsForDate(date);
    expect(slots).toContain('17:45');
    expect(slots).toContain('18:05');
    expect(slots).not.toContain('18:00');
  });
});
```

If `isToday` filtering uses `new Date()` and the test date is 2030, all slots are included (not today). Good.

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/utils/openingHours.test.ts`

Expected: FAIL (`08:30` maybe pass, but `08:50` / `17:45` fail because step is 30 and evening rounds to 18:00)

- [ ] **Step 3: Change `getQuickTimeOptionsForDate`**

In `src/utils/openingHours.ts` replace the 30-minute loop with:

```ts
export function getQuickTimeOptionsForDate(
  date: Date = new Date(),
  options: { includePast?: boolean; stepMinutes?: number } = {}
): string[] {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return [];

  const stepMinutes = options.stepMinutes ?? 20;
  const includePast = options.includePast ?? false;
  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();

  const slotsOptions: string[] = [];
  schedule.slots.forEach((slot) => {
    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);

    for (let m = openMin; m <= closeMin; m += stepMinutes) {
      if (!includePast && isToday && m < currentTotalMin) {
        continue;
      }
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      slotsOptions.push(`${hh}:${mm}`);
    }
  });

  return slotsOptions;
}
```

- [ ] **Step 4: Confirm grid tests pass**

Run: `npx vitest run src/utils/openingHours.test.ts`

Expected: PASS

- [ ] **Step 5: Write failing capacity tests**

Create `src/utils/pokeSlotCapacity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_POKE_PER_SLOT,
  containingSlotStart,
  countPokeInOrder,
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
```

- [ ] **Step 6: Run capacity tests to verify fail**

Run: `npx vitest run src/utils/pokeSlotCapacity.test.ts`

Expected: FAIL cannot find module

- [ ] **Step 7: Implement `pokeSlotCapacity.ts`**

```ts
import { getQuickTimeOptionsForDate } from './openingHours';

export const MAX_POKE_PER_SLOT = 10;
export const POKE_SLOT_MINUTES = 20;

export type SlotDay = 'oggi' | 'domani';

export interface CapacityOrderItem {
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

const ASAP_ERROR =
  'Non ci sono più fasce con abbastanza posti per le poke. Scegli un altro orario o riduci il numero di poke.';

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function padTime(totalMin: number): string {
  const hh = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const mm = (totalMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
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
    const allStarts = getQuickTimeOptionsForDate(new Date(`${dateKey}T12:00:00`), {
      includePast: true,
    });
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
```

If `getQuickTimeOptionsForDate(new Date(\`${dateKey}T12:00:00\`))` timezone-shifts the calendar day, instead split `dateKey` and construct `new Date(y, m - 1, d, 12, 0, 0)`. Use that in `occupancyBySlot`.

- [ ] **Step 8: Make capacity tests pass**

Run: `npx vitest run src/utils/pokeSlotCapacity.test.ts src/utils/openingHours.test.ts`

Expected: PASS. Fix timezone date construction if occupancy keys fail.

- [ ] **Step 9: Wire AlarmTimePicker**

Add optional props (default so existing call sites still typecheck until PokeBuilder is updated in the same task):

```ts
slotOccupancy?: Record<string, number>;
cartPokeCount?: number;
dateKey?: string;
```

Import `occupancyKey`, `slotAvailability` from `../utils/pokeSlotCapacity`.

For each `quickSlots` button:

```ts
const booked = dateKey ? (slotOccupancy?.[occupancyKey(dateKey, slotTime)] || 0) : 0;
const availability = slotAvailability(booked, cartPokeCount || 0);
```

- Button `disabled={availability.disabled}`
- `cursor: availability.disabled ? 'not-allowed' : 'pointer'`
- `opacity: availability.disabled ? 0.55 : 1`
- Label: `availability.caption ? `${slotTime} · ${availability.caption}` : slotTime`
- Do not call `onTimeChange` when disabled

Custom time: after `handleCustomTimeInput`, if `cartPokeCount > 0` and `dateKey`, map with `containingSlotStart(val, quickSlotsForContainment)`. For containment, generate starts with `getQuickTimeOptionsForDate(activeDate, { includePast: true })`. If that start is disabled for the cart, keep the value but the parent submit path will bounce it; also show the existing invalid badge text `Fascia poke al completo` when disabled.

- [ ] **Step 10: Wire PokeBuilder**

Import supabase, mappers, local store, and capacity helpers.

Count poke in `orderList`:

```ts
const cartPokeCount = orderList.filter((i) => i.itemType === 'poke').length;
```

Each configured poke is one bowl (no quantity field on `ConfiguredPoke`).

Block adding an 11th poke in `handleSavePokeToOrder` before append:

```ts
if (!editingPokeId && cartPokeCount >= 10) {
  triggerValidationError(
    'Massimo 10 poke per fascia di 20 minuti. Scegli un altro orario o invia questo ordine prima.',
    'ordine-invia'
  );
  return;
}
```

Add state `slotOccupancy: Record<string, number>` and `dateKey` for the selected day:

```ts
const occupancyDate = selectedDay === 'oggi' ? new Date() : (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
})();
const occupancyDateKey = localDateKey(occupancyDate);
```

`useEffect` on mount / `selectedDay` / after successful occupancy fetch:

```ts
async function loadOccupancy() {
  let remote: CapacityOrder[] = [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .neq('status', 'COMPLETATO');
  if (!error && data) {
    remote = data.map((o) => mapSupabaseOrderToKdsOrder(o as Record<string, unknown>));
  }
  const local = getLocalOrders()
    .filter((o) => o.status !== 'COMPLETATO')
    .map((o) => mapLocalOrderToKdsOrder(o));
  const orderMap = new Map<string, CapacityOrder>();
  remote.forEach((o) => orderMap.set(o.id, o));
  local.forEach((o) => orderMap.set(o.id, o));
  setSlotOccupancy(occupancyBySlot(Array.from(orderMap.values())));
}
```

Pass into `AlarmTimePicker`:

```tsx
<AlarmTimePicker
  orderType={orderType}
  selectedTime={pickupTime}
  selectedDay={selectedDay}
  slotOccupancy={slotOccupancy}
  cartPokeCount={cartPokeCount}
  dateKey={occupancyDateKey}
  onTimeChange={...existing...}
/>
```

In submit, after `finalItems` / `totalToPay` and before the Supabase insert:

```ts
const pokeCount = finalItems.filter((i) => i.itemType === 'poke').length;
await loadOccupancy(); // use the function result, do not rely on stale state
const latestOccupancy = /* return occupancyBySlot(...) from loadOccupancy */;
const slotStarts = getQuickTimeOptionsForDate(occupancyDate);
let effectiveTime = pickupTime || 'Prima possibile';
if (pokeCount > 0) {
  const resolved = resolvePokeSubmitSlot({
    pickupTime: effectiveTime,
    selectedDay,
    slotStarts,
    occupancy: latestOccupancy,
    dateKey: occupancyDateKey,
    cartPokeCount: pokeCount,
  });
  if ('error' in resolved) {
    triggerValidationError(resolved.error, 'ordine-dati');
    return;
  }
  const formattedDay = selectedDay === 'oggi' ? 'Oggi' : 'Domani';
  effectiveTime = `${resolved.time} (${formattedDay})`;
  setPickupTime(effectiveTime);
}
```

Refactor `loadOccupancy` to `return` the map so submit does not use stale React state.

`combinedNotes` already uses `effectiveTime`. After this change, poke orders always store a clock time.

- [ ] **Step 11: Run full tests and typecheck**

Run: `npx vitest run && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add src/utils/openingHours.ts src/utils/openingHours.test.ts src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts src/components/AlarmTimePicker.tsx src/components/PokeBuilder.tsx
git commit -m "$(cat <<'EOF'
feat(order): cap poke at 10 bowls per 20-minute slot

EOF
)"
```

---

### Task 3: Fried cones cooked on arrival

**Files:**
- Create: `src/utils/friedArrival.ts`
- Create: `src/utils/friedArrival.test.ts`
- Modify: `src/components/PokeBuilder.tsx`
- Modify: `src/components/OrderTracking.tsx`
- Modify: `src/components/KdsBoard.tsx`

**Interfaces:**
- Consumes: `orderType` / `order_type`, fried item flags already used in those components
- Produces: `friedArrivalMessage`, `FRIED_ON_ARRIVAL_KDS`

- [ ] **Step 1: Write failing tests**

Create `src/utils/friedArrival.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FRIED_ON_ARRIVAL_DELIVERY,
  FRIED_ON_ARRIVAL_KDS,
  FRIED_ON_ARRIVAL_PICKUP,
  friedArrivalMessage,
} from './friedArrival';

describe('friedArrivalMessage', () => {
  it('uses pickup copy for ritiro', () => {
    expect(friedArrivalMessage('Ritiro')).toBe(FRIED_ON_ARRIVAL_PICKUP);
  });

  it('uses departure copy for consegna', () => {
    expect(friedArrivalMessage('Consegna')).toBe(FRIED_ON_ARRIVAL_DELIVERY);
  });
});

describe('KDS badge', () => {
  it('is the kitchen short label', () => {
    expect(FRIED_ON_ARRIVAL_KDS).toBe('Friggere all\'arrivo');
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/utils/friedArrival.test.ts`

Expected: FAIL cannot find module

- [ ] **Step 3: Implement `friedArrival.ts`**

```ts
export const FRIED_ON_ARRIVAL_PICKUP =
  "I coni fritti si preparano all'arrivo: presentati al banco e li friggiamo al momento, caldi.";

export const FRIED_ON_ARRIVAL_DELIVERY =
  'I coni fritti si friggono al momento della partenza, così arrivano caldi.';

export const FRIED_ON_ARRIVAL_KDS = "Friggere all'arrivo";

export function friedArrivalMessage(orderType: string): string {
  return orderType.toLowerCase().includes('consegna')
    ? FRIED_ON_ARRIVAL_DELIVERY
    : FRIED_ON_ARRIVAL_PICKUP;
}
```

- [ ] **Step 4: Tests pass**

Run: `npx vitest run src/utils/friedArrival.test.ts`

Expected: PASS

- [ ] **Step 5: PokeBuilder tab + cart**

On the fritti tab, under the existing subtitle paragraph, add:

```tsx
<p className="order-step-sub" style={{ maxWidth: '36rem', marginInline: 'auto', marginTop: '0.65rem', fontWeight: 700, color: 'var(--color-coral)' }}>
  {friedArrivalMessage(orderType)}
</p>
```

In the cart, after `order-cart-kicker` (or after the list), if `orderList.some((i) => i.itemType === 'fritto')`:

```tsx
<p className="order-hint" style={{ marginTop: '0.65rem', color: '#FDE047', fontWeight: 700 }}>
  {friedArrivalMessage(orderType)}
</p>
```

- [ ] **Step 6: OrderTracking banner**

After the schedule card (or before items), if any item is fried (reuse the existing `isFried` detection used in the items map — extract a small `const hasFried = (order.order_items || order.items || []).some(...)` using `item_type === 'fritto'` or name containing `cono` / `fritt`):

```tsx
{hasFried && (
  <div
    style={{
      padding: '0.65rem 0.8rem',
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: '0.5rem',
      color: '#FCD34D',
      fontSize: '0.85rem',
      fontWeight: 700,
      marginBottom: '1.15rem',
    }}
  >
    {friedArrivalMessage(order.order_type || 'Ritiro')}
  </div>
)}
```

- [ ] **Step 7: KDS fried row badge**

Where fried items render (`isFriedItem`), next to the item name, add a small span:

```tsx
{isFriedItem && (
  <span
    style={{
      marginLeft: '0.4rem',
      fontSize: '0.7rem',
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: '#FBBF24',
    }}
  >
    {FRIED_ON_ARRIVAL_KDS}
  </span>
)}
```

Apply on both the compact history row and the active card item row if both exist.

- [ ] **Step 8: Run tests and typecheck**

Run: `npx vitest run && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/utils/friedArrival.ts src/utils/friedArrival.test.ts src/components/PokeBuilder.tsx src/components/OrderTracking.tsx src/components/KdsBoard.tsx
git commit -m "$(cat <<'EOF'
feat(order): tell customers fried cones are cooked on arrival

EOF
)"
```

# KDS Poke Slot Groups and Ready Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group poke orders by 20-minute pickup slot in the KDS work grid and move ready orders into a compact bottom strip for faster kitchen production.

**Architecture:** New pure helper `kdsSlotGroups.ts` reuses slot math from `pokeSlotCapacity.ts`. `KdsBoard.tsx` splits active orders into work (`RICEVUTO` + `IN_PREPARAZIONE`) and ready (`PRONTO`) lists, renders slot-group headers plus the existing order cards, and adds a fixed bottom strip for archive/WhatsApp. Status filter chips are removed; fulfillment filter (Ritiro/Consegna) stays.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, inline styles in KDS (existing pattern).

## Global Constraints

- Do not `git push`. Local commits only.
- Do not add Supabase migrations, RPC, or new order columns.
- Time source of truth remains order notes: `Orario: HH:MM (Oggi|Domani)`.
- Main grid shows only `RICEVUTO` and `IN_PREPARAZIONE`. Ready strip shows only `PRONTO`.
- Marking `PRONTO` moves the order instantly (no animation, no extra click).
- Archive from ready strip: single tap on **Archivia** button.
- Slot grouping uses canonical 20-minute slot starts via `containingSlotStart`.
- Mixed orders (poke + fritti/pesce) stay in one card inside the slot group.
- Orders without poke or without parseable time go to **Altri ordini** general queue.
- Status counter badges stay in header but are not clickable filters.
- Ritiro/Consegna filter applies to both work grid and ready strip.
- No transition animations. No forced batches of 4.

## File Structure

- Create: `src/utils/kdsSlotGroups.ts` — slot grouping for KDS work orders
- Create: `src/utils/kdsSlotGroups.test.ts`
- Modify: `src/utils/kdsFilters.ts` — remove status filter API; add work-area empty copy
- Modify: `src/utils/kdsFilters.test.ts` — drop status filter tests; add empty copy test
- Modify: `src/components/KdsBoard.tsx` — slot group layout, ready strip, status chip removal

---

### Task 1: Slot grouping helper

**Files:**
- Create: `src/utils/kdsSlotGroups.ts`
- Create: `src/utils/kdsSlotGroups.test.ts`

**Interfaces:**
- Consumes: `KdsOrder` from `orderMappers.ts`; `parseClockAndDay`, `slotDateKeyForOrder`, `containingSlotStart`, `countPokeInOrder`, `occupancyKey` from `pokeSlotCapacity.ts`; `getQuickTimeOptionsForDate` from `openingHours.ts`
- Produces:
  - `SlotGroup` interface
  - `GroupedOrders` interface
  - `countPokeInKdsOrder(order: KdsOrder): number`
  - `resolveOrderSlotKey(order: KdsOrder): string | null`
  - `groupActiveOrders(orders: KdsOrder[]): GroupedOrders`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/kdsSlotGroups.test.ts`:

```ts
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
  created_at = '2030-09-04T08:00:00.000Z'
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
    expect(resolveOrderSlotKey(order)).toBe('2030-09-04|12:00');
  });

  it('returns null when notes have no parseable time', () => {
    const order = kdsOrder('asap', 'Orario: Prima possibile (Oggi)', [{ item_type: 'poke' }]);
    expect(resolveOrderSlotKey(order)).toBeNull();
  });
});

describe('groupActiveOrders', () => {
  it('groups same-slot poke orders with correct poke count', () => {
    const orders = [
      kdsOrder('1', 'Orario: 12:20 (Oggi)', [{ item_type: 'poke', quantity: 2 }]),
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/kdsSlotGroups.test.ts`
Expected: FAIL — module `./kdsSlotGroups` not found

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/kdsSlotGroups.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/kdsSlotGroups.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/kdsSlotGroups.ts src/utils/kdsSlotGroups.test.ts
git commit -m "feat(kds): add slot grouping helper for poke production"
```

---

### Task 2: Simplify KDS filters

**Files:**
- Modify: `src/utils/kdsFilters.ts`
- Modify: `src/utils/kdsFilters.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1
- Produces:
  - `matchesFulfillmentFilter(orderType, filter)` — unchanged
  - `emptyWorkAreaCopy(): { title: string; body: string }` — new, replaces status-specific empty copy for work grid

- [ ] **Step 1: Write the failing test**

Replace `src/utils/kdsFilters.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { emptyWorkAreaCopy, matchesFulfillmentFilter } from './kdsFilters';

describe('matchesFulfillmentFilter', () => {
  it('passes ritiro orders when filter is RITIRO', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'RITIRO')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'RITIRO')).toBe(false);
  });

  it('passes consegna orders when filter is CONSEGNA', () => {
    expect(matchesFulfillmentFilter('Consegna', 'CONSEGNA')).toBe(true);
    expect(matchesFulfillmentFilter('Ritiro', 'CONSEGNA')).toBe(false);
  });

  it('passes all orders when filter is TUTTI', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'TUTTI')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'TUTTI')).toBe(true);
  });
});

describe('emptyWorkAreaCopy', () => {
  it('returns work-area empty copy', () => {
    expect(emptyWorkAreaCopy()).toEqual({
      title: 'Nessun ordine da preparare',
      body: 'Tutti gli ordini attivi sono pronti per il ritiro o in attesa di nuovi ordini.',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/kdsFilters.test.ts`
Expected: FAIL — `emptyWorkAreaCopy` not exported

- [ ] **Step 3: Simplify implementation**

Replace `src/utils/kdsFilters.ts` with:

```ts
export type FulfillmentFilter = 'TUTTI' | 'RITIRO' | 'CONSEGNA';

export function matchesFulfillmentFilter(
  orderType: string,
  filter: FulfillmentFilter
): boolean {
  const type = orderType.toLowerCase();
  if (filter === 'RITIRO') return type.includes('ritiro');
  if (filter === 'CONSEGNA') return type.includes('consegna');
  return true;
}

export function emptyWorkAreaCopy(): { title: string; body: string } {
  return {
    title: 'Nessun ordine da preparare',
    body: 'Tutti gli ordini attivi sono pronti per il ritiro o in attesa di nuovi ordini.',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/kdsFilters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/kdsFilters.ts src/utils/kdsFilters.test.ts
git commit -m "refactor(kds): remove status filter helpers, add work-area empty copy"
```

---

### Task 3: KdsBoard work grid with slot groups

**Files:**
- Modify: `src/components/KdsBoard.tsx`

**Interfaces:**
- Consumes: `groupActiveOrders`, `SlotGroup` from `kdsSlotGroups.ts`; `emptyWorkAreaCopy`, `matchesFulfillmentFilter` from `kdsFilters.ts`
- Produces: updated active-board layout with slot headers + general queue; status chips converted to non-clickable badges

- [ ] **Step 1: Update imports and remove status filter state**

In `src/components/KdsBoard.tsx`:

1. Remove imports: `emptyStatusListCopy`, `matchesStatusFilter`, `nextStatusFilter`, `StatusFilter`
2. Add imports:

```ts
import { emptyWorkAreaCopy, matchesFulfillmentFilter } from '../utils/kdsFilters';
import { groupActiveOrders, type SlotGroup } from '../utils/kdsSlotGroups';
```

3. Delete state line:

```ts
const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
```

- [ ] **Step 2: Split orders into work and ready lists**

Replace the `filteredOrders` block (~lines 598–602) with:

```ts
const fulfillmentFiltered = orders.filter((o) =>
  matchesFulfillmentFilter(o.order_type, activeFilter)
);

const workOrders = fulfillmentFiltered.filter(
  (o) => o.status === 'RICEVUTO' || o.status === 'IN_PREPARAZIONE'
);

const readyOrders = fulfillmentFiltered
  .filter((o) => o.status === 'PRONTO')
  .sort((a, b) => {
    const slotA = resolveOrderSlotKey(a) ?? '';
    const slotB = resolveOrderSlotKey(b) ?? '';
    if (slotA !== slotB) return slotA.localeCompare(slotB);
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

const groupedWork = groupActiveOrders(workOrders);
const workIsEmpty =
  groupedWork.slotGroups.length === 0 && groupedWork.generalQueue.length === 0;
const emptyCopy = emptyWorkAreaCopy();
```

Also add import for ready-strip slot label:

```ts
import { groupActiveOrders, resolveOrderSlotKey, type SlotGroup } from '../utils/kdsSlotGroups';
```

Update focus effect (~lines 621–626) to use `workOrders`:

```ts
useEffect(() => {
  if (!focusedOrderId) return;
  const stillVisible = workOrders.some((o) => o.id === focusedOrderId);
  if (!stillVisible) setFocusedOrderId(null);
}, [workOrders, focusedOrderId]);
```

- [ ] **Step 3: Release focus when marking Pronto**

In `handleUpdateStatus`, after the `IN_PREPARAZIONE` branch, add:

```ts
} else if (newStatus === 'PRONTO') {
  clearFocus();
}
```

- [ ] **Step 4: Convert status chips to display-only badges**

Replace the three clickable status `<button>` elements (In Attesa / In Prep / Pronti) with non-interactive `<span>` badges. Remove `onClick`, `aria-pressed`, and `cursor: 'pointer'`. Keep the same colors and counts (`countRicevuto`, `countInPrep`, `countPronto`).

Example for In Attesa badge:

```tsx
<span
  style={{
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    border: '1px solid rgba(234, 179, 8, 0.4)',
    color: '#FACC15',
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexShrink: 0,
  }}
>
  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FACC15' }} />
  {countRicevuto} In Attesa
</span>
```

Apply the same pattern for In Prep and Pronti badges.

- [ ] **Step 5: Extract order card renderer**

Above the `return (` of the component, add a helper function `renderOrderCard(ord: KdsOrder)` that contains the existing card JSX currently inside `filteredOrders.map((ord) => { ... })`. Move the entire card `return (...)` block into this function unchanged.

Remove the `ord.status === 'PRONTO'` green border branch from `statusBorder` — work grid never shows PRONTO:

```ts
const statusBorder =
  timerInfo.isUrgent
    ? '2px solid #EF4444'
    : ord.status === 'IN_PREPARAZIONE'
    ? '2px solid #3B82F6'
    : '1px solid rgba(148, 163, 184, 0.2)';
```

- [ ] **Step 6: Replace flat grid with slot groups**

Replace the active-board grid section. Change outer scroll container to flex column with room for bottom strip:

```tsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
  <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
    {workIsEmpty ? (
      /* existing empty state block, using emptyCopy.title / emptyCopy.body */
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {groupedWork.slotGroups.map((group) => (
          <section key={group.slotKey}>
            <SlotGroupHeader group={group} calculateOrderTimer={calculateOrderTimer} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
                alignItems: 'start',
                marginTop: '0.75rem',
              }}
            >
              {group.orders.map((ord) => renderOrderCard(ord))}
            </div>
          </section>
        ))}

        {groupedWork.generalQueue.length > 0 && (
          <section>
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Altri ordini · {groupedWork.generalQueue.length}{' '}
              {groupedWork.generalQueue.length === 1 ? 'ordine' : 'ordini'}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
                alignItems: 'start',
                marginTop: '0.75rem',
              }}
            >
              {groupedWork.generalQueue.map((ord) => renderOrderCard(ord))}
            </div>
          </section>
        )}
      </div>
    )}
  </div>

  {/* Ready strip added in Task 4 */}
</div>
```

Add `SlotGroupHeader` as a local component in the same file (above `KdsBoard` export):

```tsx
function SlotGroupHeader({
  group,
  calculateOrderTimer,
}: {
  group: SlotGroup;
  calculateOrderTimer: (
    createdAtStr: string,
    requestedTimeText: string,
    isAsap: boolean
  ) => {
    timerLabel: string;
    subLabel: string;
    timerBg: string;
    timerText: string;
    timerBorder: string;
    isUrgent: boolean;
  };
}) {
  const timerInfo = calculateOrderTimer('', group.slotTime, false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '10px',
        backgroundColor: timerInfo.isUrgent ? 'rgba(239, 68, 68, 0.12)' : '#1E293B',
        border: timerInfo.isUrgent
          ? '1px solid rgba(239, 68, 68, 0.45)'
          : '1px solid rgba(148, 163, 184, 0.2)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>
        Slot {group.slotTime} · {group.pokeCount} poke · {group.orderCount}{' '}
        {group.orderCount === 1 ? 'ordine' : 'ordini'}
      </h3>
      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: timerInfo.timerText,
          backgroundColor: timerInfo.timerBg,
          border: `1px solid ${timerInfo.timerBorder}`,
          borderRadius: '999px',
          padding: '0.2rem 0.65rem',
          whiteSpace: 'nowrap',
        }}
      >
        {timerInfo.timerLabel}
      </span>
    </div>
  );
}
```

- [ ] **Step 7: Fix loading/empty condition**

Change the condition that currently checks `filteredOrders.length === 0` to use `workIsEmpty` for the active view empty state. Keep loading spinner logic unchanged.

- [ ] **Step 8: Run full test suite**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/KdsBoard.tsx
git commit -m "feat(kds): group work orders by poke slot with slot headers"
```

---

### Task 4: Ready strip at bottom

**Files:**
- Modify: `src/components/KdsBoard.tsx`

**Interfaces:**
- Consumes: `readyOrders` from Task 3; existing `handleUpdateStatus`, `buildOrderReadyWhatsAppUrl`, `openOrderReadyWhatsApp`
- Produces: fixed bottom strip with compact ready cards and direct archive

- [ ] **Step 1: Add ReadyStrip local component**

In `src/components/KdsBoard.tsx`, above the main export, add:

```tsx
function ReadyStrip({
  orders,
  onArchive,
  onWhatsApp,
}: {
  orders: KdsOrder[];
  onArchive: (orderId: string) => void;
  onWhatsApp: (order: KdsOrder) => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(148, 163, 184, 0.25)',
        backgroundColor: '#0B1220',
        padding: '0.65rem 1rem',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em' }}>
        PRONTI PER RITIRO ({orders.length})
      </div>

      {orders.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Nessun ordine pronto</div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            overflowX: 'auto',
            paddingBottom: '0.15rem',
          }}
        >
          {orders.map((ord) => {
            const slotKey = resolveOrderSlotKey(ord);
            const slotLabel = slotKey ? slotKey.split('|')[1] : extractRequestedTimeInfo(ord.notes).timeText;
            const isDelivery = ord.order_type.toLowerCase().includes('consegna');
            const whatsAppUrl = buildOrderReadyWhatsAppUrl(ord);

            return (
              <div
                key={ord.id}
                style={{
                  flex: '0 0 220px',
                  minHeight: '72px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '12px',
                  padding: '0.55rem 0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem' }}>
                  <span style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>
                    {ord.display_id || `#${ord.id}`} · {ord.customer_name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isDelivery ? '#38BDF8' : '#FBBF24',
                    }}
                  >
                    {isDelivery ? 'Consegna' : 'Ritiro'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Slot {slotLabel}</div>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => onArchive(ord.id)}
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.45rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#10B981',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Check size={14} />
                    Archivia
                  </button>
                  {whatsAppUrl && (
                    <button
                      type="button"
                      onClick={() => onWhatsApp(ord)}
                      aria-label="Invia WhatsApp"
                      style={{
                        padding: '0.3rem 0.45rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        backgroundColor: '#0F172A',
                        color: '#4ADE80',
                        cursor: 'pointer',
                      }}
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Render ReadyStrip only on active board view**

Inside the active-board flex wrapper from Task 3, after the scrollable work area, add:

```tsx
{boardView === 'active' && (
  <ReadyStrip
    orders={readyOrders}
    onArchive={(orderId) => handleUpdateStatus(orderId, 'COMPLETATO')}
    onWhatsApp={openOrderReadyWhatsApp}
  />
)}
```

Ensure the root KDS layout uses `display: 'flex'`, `flexDirection: 'column'`, `height: '100vh'` (already present) and the middle content area has `flex: 1; minHeight: 0`.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`

Verify on `/admin/kds`:
1. Active orders with poke group under slot headers
2. Click **Segnala Pronto** → card disappears from grid, appears in bottom strip immediately
3. Click **Archivia** on strip card → order removed
4. Ritiro/Consegna filter affects both grid and strip
5. Status badges in header are not clickable

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/KdsBoard.tsx
git commit -m "feat(kds): add ready strip with direct archive for pronto orders"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Separate work from ready | Task 3 (split lists) + Task 4 (strip) |
| Group by pickup slot | Task 1 + Task 3 |
| Mixed orders in same card | Task 1 grouping rules + Task 3 reuses existing card |
| Direct archive on strip | Task 4 |
| Immediate Pronto transition | Task 3 focus clear + Task 4 instant strip |
| General queue for non-slot orders | Task 1 + Task 3 |
| Remove status filter chips | Task 2 + Task 3 |
| Keep Ritiro/Consegna filter | Task 3 |
| Keep status counters (display only) | Task 3 |
| Empty work state while strip full | Task 3 `emptyWorkAreaCopy` |
| No DB changes | all tasks |

No placeholders found. Type names consistent across tasks.

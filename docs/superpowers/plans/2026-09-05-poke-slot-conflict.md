# Poke Slot Conflict Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Warn customers in real time when a poke slot fills during composition, hard-block submit with alternative slots when capacity is insufficient, and enforce capacity atomically via a Supabase RPC.

**Architecture:** Extend `pokeSlotCapacity.ts` with validate-only submit logic (`validatePokeSubmitSlot`), soft `warning` banner variant, and shared error formatting. Remove client-side add-to-cart blocking. Wire Realtime on `order_items`. Replace direct Supabase insert with `submit_poke_order` RPC for poke orders; non-poke orders keep direct insert.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase (`@supabase/supabase-js` 2.x), PostgreSQL RPC (PL/pgSQL).

## Global Constraints

- Poke cap: **10 bowls per 20-minute slot** (`MAX_POKE_PER_SLOT = 10`, `POKE_SLOT_MINUTES = 20`).
- Only `RICEVUTO` and `IN_PREPARAZIONE` occupy slots (`countsTowardSlotCapacity`).
- **No auto-shift** at submit — customer must pick a new time manually.
- **Soft warning** during composition — never disable "Aggiungi al carrello" for slot capacity.
- RPC failure when Supabase is reachable: show generic error, **do not** silently fall back to direct insert.
- Offline / no Supabase: existing localStorage path unchanged (overbooking possible offline — accepted).
- Realtime debounce: **300 ms** on `orders` and `order_items`.
- Submit error shows up to **3** alternative slots with remaining capacity.
- Do not change KDS workflow or schema beyond the new RPC function.
- TDD for util changes. Run `npm test` after each task.
- Local commits only unless user asks to push.

## File Structure

| File | Responsibility |
|------|----------------|
| `src/utils/pokeSlotCapacity.ts` | `validatePokeSubmitSlot`, `findNextAvailableSlots`, `formatSlotFullError`, `warning` variant in `buildSlotSummary`; remove `resolvePokeSubmitSlot`, `canAddPokeToSlot` |
| `src/utils/pokeSlotCapacity.test.ts` | Unit tests for all util changes |
| `src/components/PokeSlotSummary.tsx` | `warning` variant styling and copy |
| `src/index.css` | CSS class `poke-slot-summary--warning` |
| `src/components/PokeBuilder.tsx` | Remove add-block, Realtime on `order_items`, RPC submit |
| `docs/supabase/submit_poke_order.sql` | Atomic capacity check + order insert RPC |

Spec reference: `docs/superpowers/specs/2026-09-05-poke-slot-conflict-design.md`

---

### Task 1: `findNextAvailableSlots` + `formatSlotFullError`

**Files:**
- Modify: `src/utils/pokeSlotCapacity.ts`
- Modify: `src/utils/pokeSlotCapacity.test.ts`

**Interfaces:**
- Consumes: `MAX_POKE_PER_SLOT`, `occupancyKey`, `addMinutesToTime`, `POKE_SLOT_MINUTES`
- Produces:
  - `export type SlotAlternative = { time: string; end: string; remaining: number }`
  - `export function findNextAvailableSlots(args: { slotStarts: string[]; occupancy: Record<string, number>; dateKey: string; minSeats: number; afterSlot?: string; limit?: number }): SlotAlternative[]`
  - `export function formatSlotFullError(args: { slotStart: string; slotEnd: string; cartPokeCount: number; alternatives: SlotAlternative[] }): string`

- [ ] **Step 1: Write failing tests**

Append to `src/utils/pokeSlotCapacity.test.ts`:

```typescript
import {
  // ...existing imports...
  findNextAvailableSlots,
  formatSlotFullError,
} from './pokeSlotCapacity';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts -t "findNextAvailableSlots|formatSlotFullError"`
Expected: FAIL — functions not defined

- [ ] **Step 3: Implement**

Add to `src/utils/pokeSlotCapacity.ts` (after `findFirstAvailableSlot`):

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts -t "findNextAvailableSlots|formatSlotFullError"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts
git commit -m "feat(poke): add slot alternative finder and full-slot error formatter"
```

---

### Task 2: `validatePokeSubmitSlot` (replace auto-shift)

**Files:**
- Modify: `src/utils/pokeSlotCapacity.ts`
- Modify: `src/utils/pokeSlotCapacity.test.ts`

**Interfaces:**
- Consumes: `findNextAvailableSlots`, `formatSlotFullError`, `findFirstAvailableSlot`, `containingSlotStart`, `parseClockAndDay`, `occupancyKey`, `ASAP_ERROR`, `CLOSED_DAY_ERROR`
- Produces:
  - `export type ValidatePokeSubmitResult = { ok: true; time: string; day: SlotDay } | { ok: false; error: string; alternatives?: SlotAlternative[] }`
  - `export function validatePokeSubmitSlot(args: { pickupTime: string; selectedDay: SlotDay; slotStarts: string[]; occupancy: Record<string, number>; dateKey: string; cartPokeCount: number }): ValidatePokeSubmitResult`
- Removes: `resolvePokeSubmitSlot` (delete function and all imports/usages)

- [ ] **Step 1: Write failing tests**

Replace the `describe('resolvePokeSubmitSlot')` block in `src/utils/pokeSlotCapacity.test.ts` with:

```typescript
import {
  // replace resolvePokeSubmitSlot with validatePokeSubmitSlot
  validatePokeSubmitSlot,
} from './pokeSlotCapacity';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts -t "validatePokeSubmitSlot"`
Expected: FAIL — `validatePokeSubmitSlot` not defined

- [ ] **Step 3: Implement and remove `resolvePokeSubmitSlot`**

Add to `src/utils/pokeSlotCapacity.ts`:

```typescript
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
```

Delete the entire `resolvePokeSubmitSlot` function from the same file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts -t "validatePokeSubmitSlot"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts
git commit -m "feat(poke): validate submit slot without auto-shift"
```

---

### Task 3: Soft `warning` variant + remove `canAddPokeToSlot`

**Files:**
- Modify: `src/utils/pokeSlotCapacity.ts`
- Modify: `src/utils/pokeSlotCapacity.test.ts`

**Interfaces:**
- Consumes: existing `buildSlotSummary`, `variantForSlot` internals
- Produces:
  - `SlotSummaryVariant` includes `'warning'` instead of `'overbooked'`
  - Updated `buildHeadline()` copy for `warning` and soft `full`
- Removes: `canAddPokeToSlot` function and its test block

- [ ] **Step 1: Write failing tests**

Update `buildSlotSummary` tests — replace the overbooked test:

```typescript
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
    expect(summary?.headline).toContain('2 poke');
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
```

Delete the entire `describe('canAddPokeToSlot')` block.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts -t "buildSlotSummary"`
Expected: FAIL — variant/copy mismatch

- [ ] **Step 3: Implement**

In `src/utils/pokeSlotCapacity.ts`:

1. Change `SlotSummaryVariant` — replace `'overbooked'` with `'warning'`.

2. Replace `variantForSlot`:

```typescript
function variantForSlot(
  booked: number,
  cartPokeCount: number
): SlotSummaryVariant {
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
  if (cartPokeCount > remaining) return 'warning';
  if (remaining <= 0) return 'full';
  if (remaining <= 2) return 'low';
  return 'available';
}
```

3. Update `buildHeadline`:

```typescript
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
```

4. Delete `canAddPokeToSlot` entirely.

- [ ] **Step 4: Run full util tests**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts
git commit -m "feat(poke): soft warning variant and remove add-to-cart slot guard util"
```

---

### Task 4: `PokeSlotSummary` warning styling

**Files:**
- Modify: `src/components/PokeSlotSummary.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `SlotSummary` with `variant: 'warning'`
- Produces: rendered banner with orange/red styling for `warning`; no `overbooked` references

- [ ] **Step 1: Update component**

In `src/components/PokeSlotSummary.tsx`:

1. Replace `overbooked: AlertCircle` with `warning: AlertCircle` in `VARIANT_ICONS`.
2. Update `remainingCopy`:

```typescript
function remainingCopy(summary: SlotSummary): string | null {
  if (summary.variant === 'loading' || summary.variant === 'unavailable') return null;
  if (summary.variant === 'warning') return 'Attenzione';
  if (summary.variant === 'full') return 'Esaurito (10/10)';
  return summary.remaining === 1 ? '1 poke rimasta' : `${summary.remaining} poke rimaste`;
}
```

3. For `warning` variant with `hasTime === false` (fallback headline path), render `summary.headline` directly.

- [ ] **Step 2: Add CSS**

In `src/index.css`, replace the combined full/overbooked rule with:

```css
.poke-slot-summary--warning {
  background: #FEF3C7;
  border-top-color: #FCD34D;
  color: #92400E;
}

.poke-slot-summary--full,
.poke-slot-summary--unavailable {
  background: #FEE2E2;
  border-top-color: #FCA5A5;
  color: #B91C1C;
}
```

Remove `.poke-slot-summary--overbooked` selector.

- [ ] **Step 3: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS / build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/PokeSlotSummary.tsx src/index.css
git commit -m "feat(poke): warning styling for soft slot conflict banner"
```

---

### Task 5: Remove add-to-cart block + Realtime on `order_items`

**Files:**
- Modify: `src/components/PokeBuilder.tsx`

**Interfaces:**
- Consumes: updated `SlotSummary` (no `canAddPokeToSlot`)
- Produces: poke add button always enabled for capacity; Realtime reload on `order_items` changes

- [ ] **Step 1: Remove add-block logic**

In `src/components/PokeBuilder.tsx`:

1. Remove `canAddPokeToSlot` from imports.
2. Delete `const pokeAddBlocked = !canAddPokeToSlot(...)`.
3. Remove the `canAddPokeToSlot` guard in `handleSavePokeToOrder` (lines ~642–648).
4. On the "Aggiungi poke" button: remove `disabled={pokeAddBlocked}` and the opacity/cursor styles tied to it.

Keep the `cartPokeCount >= MAX_POKE_PER_SLOT` guard (max 10 poke per single order in one slot).

- [ ] **Step 2: Add Realtime listener on `order_items`**

In the existing `useEffect` that sets up `poke_occupancy_realtime`, add after the `orders` listener:

```typescript
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          scheduleOccupancyReload();
        }
      )
```

Ensure `postgres_changes` on `order_items` is enabled in Supabase Dashboard → Database → Replication (add `order_items` to supabase_realtime publication if not already present).

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
1. Open `/componi-poke`, pick a nearly-full slot.
2. Confirm "Aggiungi poke" stays enabled when banner shows warning/full.
3. In another tab submit an order filling the slot — banner updates within ~1 s.

- [ ] **Step 4: Commit**

```bash
git add src/components/PokeBuilder.tsx
git commit -m "feat(poke): soft warning UX and realtime order_items occupancy refresh"
```

---

### Task 6: Supabase RPC `submit_poke_order`

**Files:**
- Create: `docs/supabase/submit_poke_order.sql`

**Interfaces:**
- Produces: PostgreSQL function callable as `supabase.rpc('submit_poke_order', {...})` returning `jsonb`

- [ ] **Step 1: Create SQL file**

Create `docs/supabase/submit_poke_order.sql`:

```sql
-- Deploy manually in Supabase SQL Editor.
-- Enables atomic poke slot capacity check + order insert.

CREATE OR REPLACE FUNCTION public.submit_poke_order(
  p_friendly_id text,
  p_customer_name text,
  p_customer_phone text,
  p_order_type text,
  p_status text DEFAULT 'RICEVUTO',
  p_total_price numeric DEFAULT 0,
  p_notes text DEFAULT '',
  p_delivery_address text DEFAULT NULL,
  p_poke_count integer DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_slot_time text;
  v_slot_day text;
  v_date_key date;
  v_booked integer;
  v_remaining integer;
  v_slot_end text;
  v_item jsonb;
  v_lock_key bigint;
BEGIN
  IF p_poke_count <= 0 THEN
    INSERT INTO orders (
      friendly_id, status, customer_name, customer_phone,
      order_type, delivery_address, total_amount, notes
    ) VALUES (
      p_friendly_id, p_status, p_customer_name, p_customer_phone,
      p_order_type, p_delivery_address, p_total_price, p_notes
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO order_items (id, order_id, item_type, name, quantity, unit_price, details)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_order_id,
        v_item->>'item_type',
        v_item->>'name',
        COALESCE((v_item->>'quantity')::integer, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE(v_item->'details', '{}'::jsonb)
      );
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'friendly_id', p_friendly_id);
  END IF;

  -- Parse Orario: HH:MM (Oggi|Domani) from notes
  v_slot_time := substring(p_notes FROM 'Orario:\s*(\d{1,2}:\d{2})');
  IF v_slot_time IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TIME', 'message', 'Orario non valido.');
  END IF;
  v_slot_time := to_char(to_timestamp(v_slot_time, 'HH24:MI'), 'HH24:MI');

  v_slot_day := CASE WHEN p_notes ~* 'domani' THEN 'domani' ELSE 'oggi' END;
  v_date_key := CURRENT_DATE;
  IF v_slot_day = 'domani' THEN
    v_date_key := CURRENT_DATE + INTERVAL '1 day';
  END IF;

  -- Serialize concurrent submits for same slot
  v_lock_key := hashtext(v_date_key::text || '|' || v_slot_time);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COALESCE(SUM(
    CASE WHEN oi.item_type = 'poke' THEN COALESCE(oi.quantity, 1) ELSE 0 END
  ), 0)::integer
  INTO v_booked
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('RICEVUTO', 'IN_PREPARAZIONE')
    AND o.notes ~ ('Orario:\s*' || v_slot_time)
    AND (
      (v_slot_day = 'oggi' AND o.notes ~* 'oggi')
      OR (v_slot_day = 'domani' AND o.notes ~* 'domani')
    );

  IF v_booked + p_poke_count > 10 THEN
    v_remaining := GREATEST(0, 10 - v_booked);
    v_slot_end := to_char(
      to_timestamp(v_slot_time, 'HH24:MI') + INTERVAL '20 minutes',
      'HH24:MI'
    );
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'SLOT_FULL',
      'slot', v_slot_time,
      'slot_end', v_slot_end,
      'requested', p_poke_count,
      'remaining', v_remaining
    );
  END IF;

  INSERT INTO orders (
    friendly_id, status, customer_name, customer_phone,
    order_type, delivery_address, total_amount, notes
  ) VALUES (
    p_friendly_id, p_status, p_customer_name, p_customer_phone,
    p_order_type, p_delivery_address, p_total_price, p_notes
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (id, order_id, item_type, name, quantity, unit_price, details)
    VALUES (
      COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
      v_order_id,
      v_item->>'item_type',
      v_item->>'name',
      COALESCE((v_item->>'quantity')::integer, 1),
      COALESCE((v_item->>'unit_price')::numeric, 0),
      COALESCE(v_item->'details', '{}'::jsonb)
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'friendly_id', p_friendly_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_poke_order TO anon, authenticated;
```

- [ ] **Step 2: Deploy to Supabase**

Run in Supabase SQL Editor (manual step). Verify:

```sql
SELECT submit_poke_order(
  '#TEST', 'Test', '333', 'Ritiro', 'RICEVUTO', 10,
  'Orario: 12:30 (Oggi)', NULL, 0, '[]'::jsonb
);
```

Expected: `{ "ok": true, ... }` or table-not-found if schema differs — adjust column names to match live schema before deploy.

**Schema check before deploy:** Confirm `orders` columns match insert list (`friendly_id`, `customer_name`, `customer_phone`, `order_type`, `delivery_address`, `total_amount`, `notes`). Adjust SQL if live DB uses different names (e.g. `total_price` instead of `total_amount`).

- [ ] **Step 3: Commit SQL file**

```bash
git add docs/supabase/submit_poke_order.sql
git commit -m "feat(poke): add submit_poke_order RPC for atomic slot enforcement"
```

---

### Task 7: Wire RPC submit in `PokeBuilder`

**Files:**
- Modify: `src/components/PokeBuilder.tsx`

**Interfaces:**
- Consumes: `validatePokeSubmitSlot`, RPC `submit_poke_order`
- Produces: poke orders submitted via RPC; `SLOT_FULL` mapped to `formatSlotFullError`-style message

- [ ] **Step 1: Update imports**

Replace `resolvePokeSubmitSlot` with `validatePokeSubmitSlot` in `PokeBuilder.tsx` imports.

- [ ] **Step 2: Replace submit slot resolution**

In `handleDirectOrderSubmit`, replace the `resolvePokeSubmitSlot` block (~lines 840–857):

```typescript
    if (pokeCount > 0) {
      const validated = validatePokeSubmitSlot({
        pickupTime: effectiveTime,
        selectedDay,
        slotStarts,
        occupancy: latestOccupancy,
        dateKey: occupancyDateKey,
        cartPokeCount: pokeCount,
      });
      if (!validated.ok) {
        setIsSubmitting(false);
        triggerValidationError(validated.error, 'ordine-dati');
        return;
      }
      const formattedDay = selectedDay === 'oggi' ? 'Oggi' : 'Domani';
      effectiveTime = `${validated.time} (${formattedDay})`;
      setPickupTime(effectiveTime);
    }
```

Update `combinedNotes` to use the final `effectiveTime` (already downstream).

- [ ] **Step 3: Replace Supabase insert with RPC for poke orders**

Replace the try block's direct insert when `pokeCount > 0`:

```typescript
    try {
      if (pokeCount > 0) {
        const itemsPayload = finalItems.map((item) => {
          // reuse existing item mapping from current insert block
          // return { id, item_type, name, quantity, unit_price, details }
        });

        const { data: rpcResult, error: rpcErr } = await supabase.rpc('submit_poke_order', {
          p_friendly_id: generatedFriendlyId,
          p_customer_name: clientName,
          p_customer_phone: customerPhone.trim(),
          p_order_type: orderType,
          p_status: 'RICEVUTO',
          p_total_price: totalToPay,
          p_notes: combinedNotes,
          p_delivery_address: orderType === 'Consegna' ? deliveryAddress.trim() : null,
          p_poke_count: pokeCount,
          p_items: itemsPayload,
        });

        if (rpcErr) {
          console.error('submit_poke_order RPC error:', rpcErr);
          setIsSubmitting(false);
          triggerValidationError(
            'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
            'ordine-invia'
          );
          return;
        }

        const result = rpcResult as {
          ok: boolean;
          code?: string;
          order_id?: string;
          friendly_id?: string;
          slot?: string;
          slot_end?: string;
          requested?: number;
        };

        if (!result?.ok) {
          setIsSubmitting(false);
          if (result.code === 'SLOT_FULL') {
            const slotEnd = result.slot_end || '';
            const alternatives = findNextAvailableSlots({
              slotStarts,
              occupancy: latestOccupancy,
              dateKey: occupancyDateKey,
              minSeats: pokeCount,
              afterSlot: result.slot,
              limit: 3,
            });
            triggerValidationError(
              formatSlotFullError({
                slotStart: result.slot || '',
                slotEnd,
                cartPokeCount: pokeCount,
                alternatives,
              }),
              'ordine-dati'
            );
          } else {
            triggerValidationError(
              'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
              'ordine-invia'
            );
          }
          return;
        }

        insertedOrderId = result.order_id ? String(result.order_id) : null;
      } else {
        // existing direct insert for fritti/pesce-only orders (unchanged)
      }
    } catch (e) {
      console.error('Error submitting order to Supabase:', e);
      setIsSubmitting(false);
      triggerValidationError(
        'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
        'ordine-invia'
      );
      return;
    }
```

Add imports: `findNextAvailableSlots`, `formatSlotFullError`, `validatePokeSubmitSlot`.

Extract item payload mapping into a shared helper inside the file to avoid duplication between RPC and direct-insert paths.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 5: Manual concurrent submit test**

1. Two tabs, same slot, 1 seat left.
2. Submit both simultaneously.
3. Exactly one succeeds; other shows slot-full error with alternatives.

- [ ] **Step 6: Commit**

```bash
git add src/components/PokeBuilder.tsx
git commit -m "feat(poke): enforce slot capacity via RPC at submit"
```

---

## Manual Test Checklist (post all tasks)

- [ ] Banner shows `warning` when cart exceeds remaining; add button stays enabled
- [ ] Banner shows soft `full` when slot 10/10 and cart empty
- [ ] Realtime: another customer's order updates banner without reload
- [ ] Submit blocked with alternatives when slot full
- [ ] Submit succeeds after picking suggested slot
- [ ] Concurrent submit: only one wins for last seat
- [ ] Fritti/pesce-only order bypasses RPC
- [ ] RPC error shows generic message, no silent direct insert

## Deploy Order

1. Deploy `docs/supabase/submit_poke_order.sql` to Supabase (verify column names first).
2. Enable `order_items` in Realtime publication.
3. Deploy frontend (Vercel or `npm run build`).

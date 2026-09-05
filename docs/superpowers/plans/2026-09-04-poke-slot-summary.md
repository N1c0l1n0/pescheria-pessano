# Poke Slot Availability Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show poke slot remaining capacity below the time picker immediately on `/componi-poke`, without requiring poke in the cart first.

**Architecture:** Add pure helpers (`buildSlotSummary`, `findFirstAvailableSlot`, `canAddPokeToSlot`) to `pokeSlotCapacity.ts`, a presentational `PokeSlotSummary` banner, simplify `AlarmTimePicker` buttons to clock-only, and wire guards in `PokeBuilder`.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, existing Supabase occupancy fetch in `PokeBuilder`.

## Global Constraints

- Do not `git push`. Local commits only.
- Do not add Supabase migrations, RPC, or new order columns.
- Poke cap: **10 bowls per 20-minute slot** across all non-`COMPLETATO` orders (`MAX_POKE_PER_SLOT = 10`, `POKE_SLOT_MINUTES = 20`).
- Summary lives **below** `AlarmTimePicker`, not on time buttons.
- Time buttons stay **enabled** even when full; only poke add is blocked.
- Full slot copy: `Esaurito (10/10)`.
- Block poke add message: `Fascia poke al completo. Scegli un altro orario.`
- No slot available copy: `Nessuna fascia poke disponibile. Scegli un altro giorno o riduci le poke.`
- Loading copy: `Caricamento disponibilità…` — do not block the form while loading.
- TDD for new util functions. Run `npm test` after each task.

## File Structure

- Modify: `src/utils/pokeSlotCapacity.ts` — add `SlotSummary`, `buildSlotSummary`, `findFirstAvailableSlot`, `canAddPokeToSlot`; refactor `resolvePokeSubmitSlot`
- Modify: `src/utils/pokeSlotCapacity.test.ts` — tests for new helpers
- Create: `src/components/PokeSlotSummary.tsx` — banner UI
- Modify: `src/components/AlarmTimePicker.tsx` — remove occupancy captions/disable on preset buttons
- Modify: `src/components/PokeBuilder.tsx` — mount summary, track `occupancyLoaded`, guard poke save

Spec reference: `docs/superpowers/specs/2026-09-04-poke-slot-summary-design.md`

---

### Task 1: Slot summary pure functions

**Files:**
- Modify: `src/utils/pokeSlotCapacity.ts`
- Modify: `src/utils/pokeSlotCapacity.test.ts`

**Interfaces:**
- Consumes: existing `MAX_POKE_PER_SLOT`, `POKE_SLOT_MINUTES`, `occupancyKey`, `containingSlotStart`, `parseClockAndDay`, `slotAvailability`
- Produces:
  - `export type SlotSummaryVariant = 'available' | 'low' | 'full' | 'overbooked' | 'unavailable' | 'loading'`
  - `export type SlotSummary = { variant: SlotSummaryVariant; headline: string; remaining: number; inCart: number; slotStart?: string; slotEnd?: string }`
  - `export function addMinutesToTime(time: string, minutes: number): string`
  - `export function findFirstAvailableSlot(args: { slotStarts: string[]; occupancy: Record<string, number>; dateKey: string; minSeats: number }): string | null`
  - `export function buildSlotSummary(args: BuildSlotSummaryArgs): SlotSummary | null`
  - `export function canAddPokeToSlot(summary: SlotSummary | null, addingOne: boolean): boolean`

- [ ] **Step 1: Write failing tests**

Append to `src/utils/pokeSlotCapacity.test.ts`:

```ts
import {
  buildSlotSummary,
  canAddPokeToSlot,
  findFirstAvailableSlot,
} from './pokeSlotCapacity';

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

  it('marks full slots', () => {
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
  });

  it('marks overbooked when cart exceeds remaining', () => {
    const summary = buildSlotSummary({
      pickupTime: '12:20 (Oggi)',
      selectedDay: 'oggi',
      dateKey,
      slotStarts: slots,
      slotOccupancy: { [`${dateKey}|12:20`]: 8 },
      cartPokeCount: 3,
      occupancyLoaded: true,
    });
    expect(summary?.variant).toBe('overbooked');
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

describe('canAddPokeToSlot', () => {
  it('allows add while loading', () => {
    expect(canAddPokeToSlot({ variant: 'loading', headline: '', remaining: 0, inCart: 0 }, true)).toBe(true);
  });

  it('blocks add on full, overbooked, and unavailable', () => {
    expect(canAddPokeToSlot({ variant: 'full', headline: '', remaining: 0, inCart: 0 }, true)).toBe(false);
    expect(canAddPokeToSlot({ variant: 'overbooked', headline: '', remaining: 1, inCart: 2 }, true)).toBe(false);
    expect(canAddPokeToSlot({ variant: 'unavailable', headline: '', remaining: 0, inCart: 0 }, true)).toBe(false);
  });

  it('blocks add when one more poke would exceed remaining', () => {
    expect(
      canAddPokeToSlot({ variant: 'available', headline: '', remaining: 2, inCart: 2 }, true)
    ).toBe(false);
    expect(
      canAddPokeToSlot({ variant: 'available', headline: '', remaining: 2, inCart: 1 }, true)
    ).toBe(true);
  });

  it('allows edit without requiring an extra seat', () => {
    expect(
      canAddPokeToSlot({ variant: 'available', headline: '', remaining: 2, inCart: 2 }, false)
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts`
Expected: FAIL — `buildSlotSummary` / `findFirstAvailableSlot` / `canAddPokeToSlot` not exported

- [ ] **Step 3: Implement helpers in `pokeSlotCapacity.ts`**

Add types and functions (keep existing exports intact):

```ts
export type SlotSummaryVariant =
  | 'available'
  | 'low'
  | 'full'
  | 'overbooked'
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

function formatSlotRange(slotStart: string): string {
  const slotEnd = addMinutesToTime(slotStart, POKE_SLOT_MINUTES);
  return `${slotStart}–${slotEnd}`;
}

function buildHeadline(args: {
  prefix: string;
  remaining: number;
  inCart: number;
  variant: SlotSummaryVariant;
}): string {
  if (args.variant === 'full') {
    return `${args.prefix} · Esaurito (10/10)`;
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
  if (remaining <= 0) return 'full';
  if (cartPokeCount > remaining) return 'overbooked';
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
    const slotEnd = addMinutesToTime(slotStart, POKE_SLOT_MINUTES);
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
      slotEnd,
    };
  }

  const parsed = parseClockAndDay(`Orario: ${raw}`);
  if (!parsed) return null;

  const slotStart =
    containingSlotStart(parsed.time, args.slotStarts) || parsed.time;
  const booked = args.slotOccupancy[occupancyKey(args.dateKey, slotStart)] || 0;
  const remaining = Math.max(0, MAX_POKE_PER_SLOT - booked);
  const variant = variantForSlot(booked, args.cartPokeCount);
  const slotEnd = addMinutesToTime(slotStart, POKE_SLOT_MINUTES);

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
    slotEnd,
  };
}

export function canAddPokeToSlot(
  summary: SlotSummary | null,
  addingOne: boolean
): boolean {
  if (!summary || summary.variant === 'loading') return true;
  if (
    summary.variant === 'full' ||
    summary.variant === 'overbooked' ||
    summary.variant === 'unavailable'
  ) {
    return false;
  }
  const needed = addingOne ? summary.inCart + 1 : summary.inCart;
  return needed <= summary.remaining;
}
```

Refactor `resolvePokeSubmitSlot` to use `findFirstAvailableSlot`:

```ts
  const fromIndex = (startIdx: number) => {
    const slice = args.slotStarts.slice(startIdx);
    const time = findFirstAvailableSlot({
      slotStarts: slice,
      occupancy: args.occupancy,
      dateKey: args.dateKey,
      minSeats: args.cartPokeCount,
    });
    if (time) return { time, day: args.selectedDay };
    return { error: ASAP_ERROR };
  };
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts`
Expected: PASS (all tests including existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts
git commit -m "feat: add poke slot summary helpers for order page"
```

---

### Task 2: PokeSlotSummary component

**Files:**
- Create: `src/components/PokeSlotSummary.tsx`

**Interfaces:**
- Consumes: `SlotSummary | null` from Task 1
- Produces: `export function PokeSlotSummary({ summary }: { summary: SlotSummary | null })`

- [ ] **Step 1: Create component**

```tsx
import React from 'react';
import { AlertCircle, Check, Clock, Loader2 } from 'lucide-react';
import type { SlotSummary } from '../utils/pokeSlotCapacity';

const VARIANT_STYLES: Record<
  SlotSummary['variant'],
  { bg: string; border: string; color: string; Icon: typeof Check }
> = {
  available: {
    bg: '#DCFCE7',
    border: '#86EFAC',
    color: '#15803D',
    Icon: Check,
  },
  low: {
    bg: '#FFEDD5',
    border: '#FDBA74',
    color: '#C2410C',
    Icon: Clock,
  },
  full: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  overbooked: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  unavailable: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  loading: {
    bg: 'rgba(19, 64, 116, 0.06)',
    border: 'rgba(19, 64, 116, 0.12)',
    color: 'var(--color-ocean-dark)',
    Icon: Loader2,
  },
};

export function PokeSlotSummary({ summary }: { summary: SlotSummary | null }) {
  if (!summary) return null;

  const style = VARIANT_STYLES[summary.variant];
  const Icon = style.Icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.75rem',
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: '0.825rem',
        fontWeight: 600,
      }}
      aria-live="polite"
    >
      <Icon
        size={16}
        className={summary.variant === 'loading' ? 'spin' : undefined}
        style={
          summary.variant === 'loading'
            ? { animation: 'spin 1s linear infinite' }
            : undefined
        }
      />
      <span>{summary.headline}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PokeSlotSummary.tsx
git commit -m "feat: add PokeSlotSummary banner component"
```

---

### Task 3: Simplify AlarmTimePicker buttons

**Files:**
- Modify: `src/components/AlarmTimePicker.tsx`

**Interfaces:**
- Consumes: none from Task 1/2 for logic; remove unused occupancy props usage on buttons
- Produces: preset buttons show clock only; buttons never `disabled` due to occupancy

- [ ] **Step 1: Remove occupancy from preset buttons**

In the `quickSlots.map` block, replace button body and remove disable logic:

```tsx
{quickSlots.map((slotTime) => {
  const isSel = !isCustom && selectedTime.includes(slotTime);
  return (
    <button
      key={slotTime}
      type="button"
      onClick={() => handlePresetSelect(slotTime)}
      style={{
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        border: isSel ? '1.5px solid var(--color-ocean-medium)' : '1px solid rgba(11, 37, 69, 0.15)',
        backgroundColor: isSel ? 'var(--color-ocean-dark)' : 'white',
        color: isSel ? 'white' : 'var(--color-ocean-dark)',
        fontWeight: isSel ? 800 : 600,
        fontSize: '0.825rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {slotTime}
    </button>
  );
})}
```

Remove unused imports: `occupancyKey`, `slotAvailability` if no longer used.

Keep custom-time validation for opening hours only (`isValidCustomTime`); remove `isCustomPokeSlotFull` / poke slot full badge — custom invalid hours still show red, but poke fullness is handled by `PokeSlotSummary` in parent.

Update custom validation badge to only check `isValidCustomTime`:

```tsx
{backgroundColor: isValidCustomTime ? '#DCFCE7' : '#FEE2E2', ...}
{isValidCustomTime ? (<> <Check /> <span>Orario valido</span> </>) : ( ... hours error ... )}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/AlarmTimePicker.tsx
git commit -m "refactor: show clock-only labels on poke time picker buttons"
```

---

### Task 4: Wire PokeBuilder

**Files:**
- Modify: `src/components/PokeBuilder.tsx`

**Interfaces:**
- Consumes: `buildSlotSummary`, `canAddPokeToSlot`, `PokeSlotSummary`, `getDaySchedule`, `getQuickTimeOptionsForDate`
- Produces: summary visible below time picker; poke add blocked when slot full

- [ ] **Step 1: Track occupancy loaded state**

Add state:

```tsx
const [occupancyLoaded, setOccupancyLoaded] = useState(false);
```

In `loadOccupancy`, before fetch set `setOccupancyLoaded(false)`; after `setSlotOccupancy` set `setOccupancyLoaded(true)`.

- [ ] **Step 2: Compute summary with useMemo**

Import:

```tsx
import { buildSlotSummary, canAddPokeToSlot } from '../utils/pokeSlotCapacity';
import { PokeSlotSummary } from './PokeSlotSummary';
import { getDaySchedule, getQuickTimeOptionsForDate } from '../utils/openingHours';
```

Add memo (place after `occupancyDateKey`):

```tsx
const slotSummary = useMemo(() => {
  const schedule = getDaySchedule(occupancyDate);
  const slotStarts = getQuickTimeOptionsForDate(occupancyDate);
  const rawTime = pickupTime.replace(/\s*\((Oggi|Domani|oggi|domani)\)/gi, '').trim();
  const isAsap = /prima possibile|asap/i.test(rawTime);
  const isCustom = !isAsap && /^\d{1,2}:\d{2}$/.test(rawTime);

  return buildSlotSummary({
    pickupTime,
    selectedDay,
    dateKey: occupancyDateKey,
    slotStarts,
    slotOccupancy,
    cartPokeCount,
    occupancyLoaded,
    isDayClosed: schedule.isClosedAllDay,
    isCustomTime: isCustom,
    customTimeValid: isCustom
      ? slotStarts.some((start) => start === rawTime) ||
        Boolean(
          containingSlotStart(rawTime, getQuickTimeOptionsForDate(occupancyDate, { includePast: true }))
        )
      : undefined,
  });
}, [
  occupancyDate,
  pickupTime,
  selectedDay,
  occupancyDateKey,
  slotOccupancy,
  cartPokeCount,
  occupancyLoaded,
]);
```

Import `containingSlotStart` and `useMemo` as needed.

- [ ] **Step 3: Render summary below AlarmTimePicker**

```tsx
<AlarmTimePicker ... />
<PokeSlotSummary summary={slotSummary} />
```

- [ ] **Step 4: Guard handleSavePokeToOrder**

At start of `handleSavePokeToOrder` (after name/phone/base/protein checks or before them — prefer early after basic form validation):

```tsx
if (!canAddPokeToSlot(slotSummary, !editingPokeId)) {
  triggerValidationError(
    'Fascia poke al completo. Scegli un altro orario.',
    'ordine-invia'
  );
  return;
}
```

Disable add button when blocked:

```tsx
const pokeAddBlocked = !canAddPokeToSlot(slotSummary, !editingPokeId);

<button
  type="button"
  onClick={handleSavePokeToOrder}
  disabled={pokeAddBlocked}
  className="btn btn-coral"
  style={{
    ...,
    opacity: pokeAddBlocked ? 0.55 : 1,
    cursor: pokeAddBlocked ? 'not-allowed' : 'pointer',
  }}
>
```

- [ ] **Step 5: Run full test suite and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/PokeBuilder.tsx
git commit -m "feat: show poke slot availability summary on order page"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Summary below time picker | Task 2 + 4 |
| Visible with empty cart | Task 1 `buildSlotSummary` |
| Prima possibile first free slot | Task 1 |
| Full slot blocks poke add | Task 1 `canAddPokeToSlot` + Task 4 |
| Cart + remaining in headline | Task 1 |
| Buttons clock-only, full slots selectable | Task 3 |
| Loading state, no form block | Task 1 + 2 |
| Hidden on closed/invalid custom | Task 1 |
| Unit tests | Task 1 |

## Manual Test Plan

1. Open `/componi-poke` with empty cart → green/orange summary under time picker.
2. Pick a full slot (mock occupancy or fill 10 poke in DB) → red Esaurito, add poke disabled.
3. Select Prima possibile → shows first free fascia.
4. Add poke to cart → headline includes “N nel tuo ordine”.
5. Change day → summary updates after occupancy reload.

# Meal Preset Visible Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full 20-minute slot button grid with grouped pranzo/cena presets, and on Oggi show only the meal that matches the device clock (lunch, last-30-minute overlap, then dinner).

**Architecture:** Add preset targets, `getMealPresetOptionsForDate()`, and `getVisibleMealGroups()` in `openingHours.ts`. `AlarmTimePicker` renders grouped clock-only buttons from those helpers. Poke occupancy, ASAP, custom time, KDS, and order notes keep using the full 20-minute grid.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest.

## Global Constraints

- Do not add Supabase migrations or new order columns.
- Poke cap remains 10 per 20-minute slot; preset button time must equal the occupancy slot key (1:1).
- Lunch targets: `12:10`, `12:30`, `13:10`. Dinner targets: `18:45`, `19:05`, `19:25`, `20:05`.
- Meal windows: pranzo `11:30`–`13:30`, cena `18:30`–`20:15`.
- A day has evening hours if a `WEEKLY_SCHEDULE` slot has `open >= 17:00`.
- Oggi phases: lunch until 30 minutes before first-slot `close`; both during that overlap (inclusive); dinner after morning close.
- Domani shows that day’s full main meals; ignore today’s phase; do not drop “past” times.
- `Prima possibile` and custom time unchanged; ASAP scans the full grid, not presets only.
- Preset buttons stay clock-only; do not add occupancy captions or disable-on-full logic.
- Do not auto-clear a selected time when a meal group hides.
- Do not `git push` unless the user asks.

## File Structure

- Modify: `src/utils/openingHours.ts` — `MEAL_WINDOWS`, `MEAL_PRESET_TARGETS`, `MEAL_OVERLAP_MINUTES`, `getMealPresetOptionsForDate`, `getVisibleMealGroups`
- Modify: `src/utils/openingHours.test.ts` — resolution and phase tests
- Modify: `src/components/AlarmTimePicker.tsx` — grouped Pranzo/Cena UI from the two helpers

Do not modify `PokeBuilder.tsx`, `pokeSlotCapacity.ts`, or KDS files. They already scan the full grid.

---

### Task 1: Meal preset resolution in openingHours

**Files:**
- Modify: `src/utils/openingHours.ts`
- Modify: `src/utils/openingHours.test.ts`

**Interfaces:**
- Consumes: `getQuickTimeOptionsForDate`, `getDaySchedule`, `timeToMinutes` (internal), `WEEKLY_SCHEDULE`
- Produces:
  - `export const MEAL_WINDOWS = { pranzo: { start: '11:30', end: '13:30' }, cena: { start: '18:30', end: '20:15' } }`
  - `export const MEAL_PRESET_TARGETS = { pranzo: ['12:10', '12:30', '13:10'], cena: ['18:45', '19:05', '19:25', '20:05'] }`
  - `export interface MealPresetOptions { pranzo: string[]; cena: string[] }`
  - `export function dayHasEvening(schedule: DaySchedule): boolean`
  - `export function getMealPresetOptionsForDate(date?: Date): MealPresetOptions`

- [ ] **Step 1: Write the failing tests**

Keep the existing `getQuickTimeOptionsForDate` describe block. Change the test file imports to:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { getMealPresetOptionsForDate, getQuickTimeOptionsForDate } from './openingHours';
```

Then append:

```typescript
describe('getMealPresetOptionsForDate', () => {
  it('returns exact lunch targets on Tuesday (08:30 grid)', () => {
    const date = new Date(2030, 8, 3, 10, 0, 0); // Tue Sep 3 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:10', '12:30', '13:10']);
    expect(presets.cena).toEqual([]);
  });

  it('returns lunch and dinner on Friday', () => {
    const date = new Date(2030, 8, 6, 10, 0, 0); // Fri Sep 6 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:10', '12:30', '13:10']);
    expect(presets.cena).toEqual(['18:45', '19:05', '19:25', '20:05']);
  });

  it('resolves lunch to nearest grid slots on Sunday (09:00 grid)', () => {
    const date = new Date(2030, 8, 1, 10, 0, 0); // Sun Sep 1 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:20', '12:40', '13:20']);
    expect(presets.cena).toEqual(['18:45', '19:05', '19:25', '20:05']);
  });

  it('excludes past lunch presets when date is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 8, 3, 12, 35, 0));
    try {
      const date = new Date(2030, 8, 3, 12, 35, 0);
      const presets = getMealPresetOptionsForDate(date);
      expect(presets.pranzo).toEqual(['13:10']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns empty lists on Monday', () => {
    const date = new Date(2030, 8, 2, 10, 0, 0); // Mon Sep 2 2030
    expect(getMealPresetOptionsForDate(date)).toEqual({ pranzo: [], cena: [] });
  });
});
```

Use fake timers only in the “today” test. `getQuickTimeOptionsForDate` compares against `new Date()` internally; without `vi.setSystemTime` that case never treats 2030 as today.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/openingHours.test.ts`

Expected: FAIL — `getMealPresetOptionsForDate` is not exported.

- [ ] **Step 3: Implement meal preset resolution**

Append to `src/utils/openingHours.ts` after `getQuickTimeOptionsForDate`:

```typescript
export const MEAL_WINDOWS = {
  pranzo: { start: '11:30', end: '13:30' },
  cena: { start: '18:30', end: '20:15' },
} as const;

export const MEAL_PRESET_TARGETS = {
  pranzo: ['12:10', '12:30', '13:10'],
  cena: ['18:45', '19:05', '19:25', '20:05'],
} as const;

export interface MealPresetOptions {
  pranzo: string[];
  cena: string[];
}

export function dayHasEvening(schedule: DaySchedule): boolean {
  return schedule.slots.some((slot) => timeToMinutes(slot.open) >= timeToMinutes('17:00'));
}

function resolveTargetsToGrid(
  targets: readonly string[],
  gridAll: string[],
  gridVisible: Set<string>,
  window: { start: string; end: string }
): string[] {
  const windowStart = timeToMinutes(window.start);
  const windowEnd = timeToMinutes(window.end);
  const resolved = new Set<string>();

  for (const target of targets) {
    const targetMin = timeToMinutes(target);
    let best: string | null = null;
    let bestDist = Infinity;

    for (const slot of gridAll) {
      const slotMin = timeToMinutes(slot);
      if (slotMin < windowStart || slotMin > windowEnd) continue;
      const dist = Math.abs(slotMin - targetMin);
      if (dist < bestDist || (dist === bestDist && best !== null && slotMin > timeToMinutes(best))) {
        bestDist = dist;
        best = slot;
      }
    }

    if (best && gridVisible.has(best)) {
      resolved.add(best);
    }
  }

  return Array.from(resolved).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function getMealPresetOptionsForDate(date: Date = new Date()): MealPresetOptions {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay) {
    return { pranzo: [], cena: [] };
  }

  const gridAll = getQuickTimeOptionsForDate(date, { includePast: true });
  const gridVisible = new Set(getQuickTimeOptionsForDate(date, { includePast: false }));
  const hasEvening = dayHasEvening(schedule);

  return {
    pranzo: resolveTargetsToGrid(
      MEAL_PRESET_TARGETS.pranzo,
      gridAll,
      gridVisible,
      MEAL_WINDOWS.pranzo
    ),
    cena: hasEvening
      ? resolveTargetsToGrid(
          MEAL_PRESET_TARGETS.cena,
          gridAll,
          gridVisible,
          MEAL_WINDOWS.cena
        )
      : [],
  };
}
```

Keep `timeToMinutes` private. Tests use the public API only.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/openingHours.test.ts`

Expected: PASS (existing grid tests plus the five new cases).

- [ ] **Step 5: Commit**

```bash
git add src/utils/openingHours.ts src/utils/openingHours.test.ts
git commit -m "$(cat <<'EOF'
feat: resolve meal preset times onto the poke slot grid

EOF
)"
```

---

### Task 2: Device-time meal visibility helper

**Files:**
- Modify: `src/utils/openingHours.ts`
- Modify: `src/utils/openingHours.test.ts`

**Interfaces:**
- Consumes: `getDaySchedule`, `dayHasEvening`, `isSameDay` (internal), `timeToMinutes` (internal)
- Produces:
  - `export const MEAL_OVERLAP_MINUTES = 30`
  - `export interface VisibleMealGroups { showPranzo: boolean; showCena: boolean }`
  - `export function getVisibleMealGroups(date: Date, now?: Date): VisibleMealGroups`

- [ ] **Step 1: Write the failing tests**

Add to the import in `src/utils/openingHours.test.ts`:

```typescript
import {
  getMealPresetOptionsForDate,
  getQuickTimeOptionsForDate,
  getVisibleMealGroups,
} from './openingHours';
```

Append:

```typescript
describe('getVisibleMealGroups', () => {
  it('shows only pranzo on Friday morning', () => {
    const today = new Date(2030, 8, 6, 10, 0, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: true,
      showCena: false,
    });
  });

  it('shows pranzo and cena in the last 30 minutes before Friday morning close', () => {
    const today = new Date(2030, 8, 6, 14, 20, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: true,
      showCena: true,
    });
  });

  it('shows only cena after Friday morning close', () => {
    const today = new Date(2030, 8, 6, 15, 0, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: false,
      showCena: true,
    });
  });

  it('ignores device phase for Domani', () => {
    const now = new Date(2030, 8, 6, 15, 0, 0); // Fri 15:00
    const tomorrow = new Date(2030, 8, 7, 15, 0, 0); // Sat
    expect(getVisibleMealGroups(tomorrow, now)).toEqual({
      showPranzo: true,
      showCena: true,
    });
  });

  it('never shows cena on Wednesday', () => {
    const morning = new Date(2030, 8, 4, 10, 0, 0);
    const afternoon = new Date(2030, 8, 4, 15, 0, 0);
    expect(getVisibleMealGroups(morning, morning)).toEqual({
      showPranzo: true,
      showCena: false,
    });
    expect(getVisibleMealGroups(afternoon, afternoon)).toEqual({
      showPranzo: false,
      showCena: false,
    });
  });

  it('hides both groups on Monday', () => {
    const monday = new Date(2030, 8, 2, 10, 0, 0);
    expect(getVisibleMealGroups(monday, monday)).toEqual({
      showPranzo: false,
      showCena: false,
    });
  });
});
```

Pass `now` explicitly. Do not use fake timers here.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/openingHours.test.ts`

Expected: FAIL — `getVisibleMealGroups` is not exported.

- [ ] **Step 3: Implement getVisibleMealGroups**

Append to `src/utils/openingHours.ts` after `getMealPresetOptionsForDate`:

```typescript
export const MEAL_OVERLAP_MINUTES = 30;

export interface VisibleMealGroups {
  showPranzo: boolean;
  showCena: boolean;
}

export function getVisibleMealGroups(
  date: Date,
  now: Date = new Date()
): VisibleMealGroups {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) {
    return { showPranzo: false, showCena: false };
  }

  const hasEvening = dayHasEvening(schedule);
  if (!isSameDay(date, now)) {
    return { showPranzo: true, showCena: hasEvening };
  }

  const morningClose = timeToMinutes(schedule.slots[0].close);
  const overlapStart = morningClose - MEAL_OVERLAP_MINUTES;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < overlapStart) {
    return { showPranzo: true, showCena: false };
  }
  if (nowMin <= morningClose) {
    return { showPranzo: true, showCena: hasEvening };
  }
  return { showPranzo: false, showCena: hasEvening };
}
```

Friday morning close is `14:45`, so overlap starts at `14:15`. `14:20` is inside the inclusive overlap. `15:00` is dinner only.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/openingHours.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/openingHours.ts src/utils/openingHours.test.ts
git commit -m "$(cat <<'EOF'
feat: hide meal preset groups from the device clock phase

EOF
)"
```

---

### Task 3: Grouped Pranzo/Cena UI in AlarmTimePicker

**Files:**
- Modify: `src/components/AlarmTimePicker.tsx`

**Interfaces:**
- Consumes: `getMealPresetOptionsForDate`, `getVisibleMealGroups` (signatures from Tasks 1–2)
- Produces: no change to `TimePickerProps`; picker shows grouped clock-only presets

- [ ] **Step 1: Switch imports and data source**

Replace the `openingHours` import:

```typescript
import {
  getDaySchedule,
  isTimeInOpeningHours,
  getMealPresetOptionsForDate,
  getVisibleMealGroups,
} from '../utils/openingHours';
```

Replace `const quickSlots = getQuickTimeOptionsForDate(activeDate);` with:

```typescript
const mealPresets = getMealPresetOptionsForDate(activeDate);
const visibleMeals = getVisibleMealGroups(activeDate);
const visiblePranzo = visibleMeals.showPranzo ? mealPresets.pranzo : [];
const visibleCena = visibleMeals.showCena ? mealPresets.cena : [];
```

Do not call `onTimeChange` when computing these lists. A time already selected stays selected if its group hides.

- [ ] **Step 2: Add a clock-only preset button helper**

Inside the component, after `isValidCustomTime`:

```typescript
  const renderPresetButton = (slotTime: string) => {
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
  };
```

Do not add occupancy captions, `disabled`, or `slotAvailability`.

- [ ] **Step 3: Replace the flat slot list with grouped sections**

Replace `{quickSlots.map((slotTime) => { ... })}` with:

```tsx
          {visiblePranzo.length > 0 && (
            <div style={{ width: '100%', marginTop: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Pranzo
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {visiblePranzo.map(renderPresetButton)}
              </div>
            </div>
          )}

          {visibleCena.length > 0 && (
            <div style={{ width: '100%', marginTop: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Cena
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {visibleCena.map(renderPresetButton)}
              </div>
            </div>
          )}
```

Keep **Prima possibile** as the first child of the flex wrap and **Altro Orario** as the last child. Leave the custom `<input type="time">` block unchanged.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Manual smoke check**

Run: `npm run dev` and open `/componi-poke`.

Verify:

- Before overlap (e.g. morning): only **Pranzo** presets still in the future, plus Prima possibile and Altro Orario.
- Ven/Sab/Dom in the last 30 minutes before morning close (`14:15`–`14:45`): remaining pranzo + **Cena**.
- After morning close on Ven/Sab/Dom: only **Cena** (until those presets are past).
- Mar–Gio after `14:30`: no preset groups; Prima possibile and Altro Orario remain.
- **Domani** after today’s morning close: that day’s Pranzo and Cena (if the shop has evening hours).
- Altro Orario still validates; `PokeSlotSummary` still follows the selected time.
- Changing phase does not wipe a time already chosen.

- [ ] **Step 6: Commit**

```bash
git add src/components/AlarmTimePicker.tsx
git commit -m "$(cat <<'EOF'
feat: show meal presets grouped by device-time phase

EOF
)"
```

---

## Plan self-review

| Spec requirement | Task |
| --- | --- |
| Preset targets 1:1 with poke slots | Task 1 resolution; Task 3 buttons use resolved times |
| Sunday 09:00 nearest-slot | Task 1 Sunday test + `resolveTargetsToGrid` |
| Past presets hidden on Oggi | Task 1 fake-timer test + `gridVisible` |
| Mar–Gio / no evening → no cena | Task 1 Tuesday; Task 2 Wednesday |
| Monday closed → no presets | Task 1 empty lists; Task 2 both false |
| Oggi lunch / overlap / dinner | Task 2 Friday 10:00 / 14:20 / 15:00 |
| Overlap 30 min, inclusive, first-slot close | Task 2 + `MEAL_OVERLAP_MINUTES` |
| Domani ignores device phase | Task 2 Saturday-from-Friday-15:00 |
| Pranzo/Cena grouping, clock-only buttons | Task 3 |
| Prima possibile + Altro Orario unchanged | Task 3 does not touch PokeBuilder / ASAP / custom input |
| Do not auto-clear selection | Task 3 computes lists only |
| Occupancy / KDS / notes unchanged | No edits to those files |

No placeholders. Names match across tasks: `getMealPresetOptionsForDate`, `getVisibleMealGroups`, `dayHasEvening`, `MealPresetOptions`, `VisibleMealGroups`, `MEAL_OVERLAP_MINUTES`.

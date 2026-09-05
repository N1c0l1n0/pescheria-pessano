# Meal Preset Times Implementation Plan

> **Superseded** by `docs/superpowers/plans/2026-09-05-meal-preset-visible-phases.md`. Do not execute this plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full 20-minute slot button grid with grouped pranzo/cena meal presets that map 1:1 to poke slot starts, keeping Prima possibile and Altro Orario unchanged.

**Architecture:** Add `MEAL_PRESET_TARGETS`, meal windows, and `getMealPresetOptionsForDate()` to `openingHours.ts`. `AlarmTimePicker` renders grouped preset buttons from that helper; poke occupancy, ASAP, and custom time continue using the full grid via existing utilities.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest.

## Global Constraints

- Do not add Supabase migrations or new order columns.
- Poke cap remains 10 per 20-minute slot; preset button time must equal the occupancy slot key (1:1).
- Lunch targets: `12:10`, `12:30`, `13:10`. Dinner targets: `18:45`, `19:05`, `19:25`, `20:05`.
- Meal windows: pranzo `11:30`–`13:30`, cena `18:30`–`20:15`.
- `Prima possibile` and custom time behavior unchanged; ASAP scans the full grid, not presets only.
- Do not `git push` unless the user asks.

## File Structure

- Modify: `src/utils/openingHours.ts` — preset targets, windows, `getMealPresetOptionsForDate`
- Modify: `src/utils/openingHours.test.ts` — preset resolution tests
- Modify: `src/components/AlarmTimePicker.tsx` — grouped Pranzo/Cena UI, use meal presets instead of full `quickSlots` for buttons

---

### Task 1: Meal preset resolution in openingHours

**Files:**
- Modify: `src/utils/openingHours.ts`
- Modify: `src/utils/openingHours.test.ts`

**Interfaces:**
- Consumes: `getQuickTimeOptionsForDate`, `timeToMinutes` (internal), `WEEKLY_SCHEDULE`
- Produces:
  - `export const MEAL_PRESET_TARGETS = { pranzo: [...], cena: [...] }`
  - `export const MEAL_WINDOWS = { pranzo: { start, end }, cena: { start, end } }`
  - `export interface MealPresetOptions { pranzo: string[]; cena: string[] }`
  - `export function getMealPresetOptionsForDate(date?: Date): MealPresetOptions`

- [ ] **Step 1: Write the failing tests**

Add to `src/utils/openingHours.test.ts`:

```typescript
import { getMealPresetOptionsForDate } from './openingHours';

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
    const date = new Date(2030, 8, 3, 12, 35, 0); // Tue 12:35
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['13:10']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/openingHours.test.ts`
Expected: FAIL — `getMealPresetOptionsForDate` not defined

- [ ] **Step 3: Implement meal preset resolution**

Add to `src/utils/openingHours.ts` (after existing exports, before or after `getQuickTimeOptionsForDate`):

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

function minutesToHHMM(totalMin: number): string {
  const hh = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const mm = (totalMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
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
  const hasEvening = schedule.slots.length > 1;

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

Export `timeToMinutes` if tests need it, or keep it private (tests use public API only).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/openingHours.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/openingHours.ts src/utils/openingHours.test.ts
git commit -m "$(cat <<'EOF'
feat: add meal preset time resolution for order picker

EOF
)"
```

---

### Task 2: Grouped Pranzo/Cena UI in AlarmTimePicker

**Files:**
- Modify: `src/components/AlarmTimePicker.tsx`

**Interfaces:**
- Consumes: `getMealPresetOptionsForDate`, existing poke occupancy helpers
- Produces: UI with grouped preset sections; no API changes to `TimePickerProps`

- [ ] **Step 1: Switch preset source from full grid to meal presets**

In `AlarmTimePicker.tsx`:

1. Import `getMealPresetOptionsForDate` from `../utils/openingHours`.
2. Replace use of `quickSlots` for button rendering with:

```typescript
const mealPresets = getMealPresetOptionsForDate(activeDate);
```

3. Keep `quickSlotsForContainment` unchanged:

```typescript
const quickSlotsForContainment = getQuickTimeOptionsForDate(activeDate, {
  includePast: true,
});
```

- [ ] **Step 2: Extract a preset button renderer**

Add a small helper inside the component to avoid duplicating button markup:

```typescript
const renderPresetButton = (slotTime: string) => {
  const isSel = !isCustom && selectedTime.includes(slotTime);
  const booked = dateKey
    ? (slotOccupancy?.[occupancyKey(dateKey, slotTime)] || 0)
    : 0;
  const availability = slotAvailability(booked, cartPokeCount);
  return (
    <button
      key={slotTime}
      type="button"
      disabled={availability.disabled}
      onClick={() => {
        if (!availability.disabled) handlePresetSelect(slotTime);
      }}
      style={{
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        border: isSel ? '1.5px solid var(--color-ocean-medium)' : '1px solid rgba(11, 37, 69, 0.15)',
        backgroundColor: isSel ? 'var(--color-ocean-dark)' : 'white',
        color: isSel ? 'white' : 'var(--color-ocean-dark)',
        fontWeight: isSel ? 800 : 600,
        fontSize: '0.825rem',
        cursor: availability.disabled ? 'not-allowed' : 'pointer',
        opacity: availability.disabled ? 0.55 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {availability.caption ? `${slotTime} · ${availability.caption}` : slotTime}
    </button>
  );
};
```

- [ ] **Step 3: Replace flat slot list with grouped sections**

Replace `{quickSlots.map(...)}` with:

```tsx
{mealPresets.pranzo.length > 0 && (
  <div style={{ width: '100%', marginTop: '0.35rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
      Pranzo
    </div>
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {mealPresets.pranzo.map(renderPresetButton)}
    </div>
  </div>
)}

{mealPresets.cena.length > 0 && (
  <div style={{ width: '100%', marginTop: '0.35rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
      Cena
    </div>
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {mealPresets.cena.map(renderPresetButton)}
    </div>
  </div>
)}
```

Keep **Prima possibile** and **Altro Orario** in the same flex wrapper as today (Prima possibile first, meal groups as block children, Altro Orario last).

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 5: Manual smoke check**

Run: `npm run dev`

Verify on order flow:
- Tue shows Pranzo presets only (3 buttons near noon)
- Fri shows Pranzo + Cena
- Altro Orario still validates custom times
- Poke full slot shows Esaurito on preset button

- [ ] **Step 6: Commit**

```bash
git add src/components/AlarmTimePicker.tsx
git commit -m "$(cat <<'EOF'
feat: show grouped meal presets instead of full time grid

EOF
)"
```

---

## Plan self-review

| Spec requirement | Task |
| --- | --- |
| Meal preset targets 1:1 with poke slots | Task 1 resolution + Task 2 buttons use resolved times |
| Sunday 09:00 grid nearest-slot logic | Task 1 test + `resolveTargetsToGrid` |
| Pranzo/Cena grouping | Task 2 UI |
| Prima possibile unchanged | No changes to PokeBuilder / resolvePokeSubmitSlot |
| Altro Orario unchanged | Task 2 keeps custom block + `quickSlotsForContainment` |
| Past presets hidden today | Task 1 uses `gridVisible` |
| Mar–Gio no cena | Task 1 `hasEvening` check |
| Tests | Task 1 |

No placeholders remain. Types consistent across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-04-meal-preset-times.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach do you prefer?

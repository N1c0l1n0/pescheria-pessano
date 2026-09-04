# Meal preset times in order picker

**Date:** 2026-09-04  
**Status:** Approved for implementation

## Problem

The order time picker shows every 20-minute slot across the full opening day (often 15+ buttons). Customers mainly order for lunch or dinner and find the long list confusing. A custom-time input already exists for precise times.

## Goals

1. Quick-select buttons show only **main meal times** for **pranzo** and **cena**, not the full 20-minute grid.
2. Each preset maps **1:1** to a real 20-minute poke slot start (no hidden remapping).
3. **Prima possibile** and **Altro Orario** stay unchanged.
4. Poke capacity (10 per 20-minute slot), ASAP resolution, custom-time containment, KDS, and order notes format stay as they are today.

## Non-goals

- Changing opening hours, poke cap, or slot step (20 minutes).
- New Supabase columns or order fields.
- Different preset sets for Ritiro vs Consegna.
- Updating marketing copy in `DeliveryInfoSection` (may be aligned later).
- Removing the underlying full 20-minute grid used by poke occupancy and ASAP.

## Preset times (option A)

Target times (aligned to the Tue–Sat morning grid anchored at 08:30):

| Pasto | Preset targets |
| --- | --- |
| Pranzo | `12:10`, `12:30`, `13:10` |
| Cena (Ven/Sab/Dom only) | `18:45`, `19:05`, `19:25`, `20:05` |

On days where the morning grid starts at **09:00** (Sunday), targets are **resolved to the nearest slot start** on that day’s grid (see resolution below). The button always shows the resolved grid time, never a non-grid label.

## Meal windows

Presets must fall inside these windows (same intent as delivery copy):

- **Pranzo:** `11:30` – `13:30` (inclusive)
- **Cena:** `18:30` – `20:15` (inclusive); section hidden on days with no evening opening (Mar–Gio)

## Resolution algorithm

New helper `getMealPresetOptionsForDate(date)` in `src/utils/openingHours.ts`:

1. Build the day’s full 20-minute slot grid with `getQuickTimeOptionsForDate(date, { includePast: true })`.
2. Build the visible grid with `includePast: false` (for “today”, drop past slots).
3. For each target in `MEAL_PRESET_TARGETS.pranzo` / `.cena`:
   - Among grid starts inside the meal window and opening hours, pick the start with **minimum absolute minute distance** to the target; on tie, pick the **later** slot.
   - Include the resolved time in output **only if** it appears in the visible grid (not past for today).
4. Deduplicate and sort chronologically within each meal group.
5. Return `{ pranzo: string[]; cena: string[] }`. `cena` is always `[]` when the day has no evening slot in `WEEKLY_SCHEDULE`.

**Sunday example:** targets `12:10`, `12:30`, `13:10` resolve to `12:20`, `12:40`, `13:20` (nearest grid slots on the 09:00 anchor; ties pick the later slot).

**Tuesday example:** exact match `12:10`, `12:30`, `13:10` (all on 08:30-anchored grid).

## UI (`AlarmTimePicker`)

Replace the flat list of all `quickSlots` with:

1. **Prima possibile** (unchanged)
2. **Pranzo** — label + preset buttons for `mealPresets.pranzo`
3. **Cena** — label + preset buttons for `mealPresets.cena` (omit section if empty)
4. **Altro Orario** (unchanged custom `<input type="time">` block)

Poke occupancy labels on presets unchanged: `12:30 · 3 posti`, `Esaurito (10/10)`.

`quickSlotsForContainment` continues to use the **full** grid (`includePast: true`) for custom-time validation and `containingSlotStart`.

## Data flow (unchanged paths)

```
Customer picks preset "12:30"
  → onTimeChange("12:30", day)
  → submit: notes "Orario: 12:30 (Oggi)"
  → occupancy key dateKey|12:30
  → KDS shows ORARIO: 12:30 (Oggi)

Customer picks Prima possibile (cart has poke)
  → resolvePokeSubmitSlot scans FULL 20-min grid (not presets only)
  → first slot with remaining >= cart poke count

Customer picks Altro Orario e.g. 12:45
  → containingSlotStart → 12:50 slot for capacity check
  → notes store 12:45 as today
```

## Error handling

- Closed day (Monday): empty preset lists; only custom time if user could reach picker (existing day selector still applies).
- All presets past for today: only Prima possibile + Altro Orario remain.
- Occupancy fetch failure: same fallback as today (local orders only).
- Preset disabled when poke slot full: same as current slot buttons.

## Testing

Add tests in `src/utils/openingHours.test.ts`:

- Tue: pranzo resolves to exact targets `12:10`, `12:30`, `13:10`; no cena.
- Fri: pranzo + cena targets resolve exactly on grid.
- Sun: pranzo resolves to nearest grid slots inside lunch window (not necessarily exact targets).
- Today with mocked time: past presets excluded.
- Mar–Gio: `cena` array empty.

Manual check: picker shows grouped Pranzo/Cena, custom time still validates, poke full slot disables button.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Preset strategy | Option A — button time = poke slot start (1:1) |
| Lunch targets | `12:10`, `12:30`, `13:10` |
| Dinner targets | `18:45`, `19:05`, `19:25`, `20:05` |
| Sunday / 09:00 grid | Nearest grid slot per target inside meal window |
| ASAP | Scans full 20-min grid, not presets only |
| Custom time | Unchanged |
| UI grouping | Labels Pranzo / Cena |

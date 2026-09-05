# Meal preset times with device-time phases

**Date:** 2026-09-05  
**Status:** Approved for implementation  
**Supersedes:** `docs/superpowers/specs/2026-09-04-meal-preset-times-design.md`

## Problem

The order time picker on `/componi-poke` still lists every 20-minute slot for the whole opening day. Customers want only the **main lunch or dinner times**, chosen from the **device clock**: lunch in the morning, dinner after the shop’s morning close, and **both** in the last 30 minutes before that close. Tomorrow should show that day’s full main-meal set, not today’s phase.

## Goals

1. Quick-select buttons show only **main meal presets**, never the full 20-minute grid.
2. **Oggi** shows one meal at a time, except during a 30-minute overlap before morning close (lunch remaining + dinner).
3. **Domani** shows that calendar day’s main lunch and, if the shop has evening hours, main dinner.
4. Each preset maps **1:1** to a real 20-minute poke slot start (button label = occupancy key).
5. **Prima possibile** and **Altro Orario** stay unchanged.
6. Poke capacity (10 per 20-minute slot), ASAP resolution, custom-time containment, KDS, and order notes format stay as they are today.

## Non-goals

- Changing opening hours, poke cap, or slot step (20 minutes).
- New Supabase columns or order fields.
- Different preset sets for Ritiro vs Consegna.
- Updating marketing copy in `DeliveryInfoSection`.
- Removing the underlying full 20-minute grid used by poke occupancy and ASAP.
- Auto-clearing a time the customer already selected when the phase changes.

## Preset times

Target times (aligned to the Tue–Sat morning grid anchored at 08:30):

| Pasto | Preset targets |
| --- | --- |
| Pranzo | `12:10`, `12:30`, `13:10` |
| Cena (Ven/Sab/Dom only) | `18:45`, `19:05`, `19:25`, `20:05` |

On Sunday the morning grid starts at **09:00**. Targets resolve to the nearest slot start on that day’s grid. The button always shows the resolved grid time.

## Meal windows

Presets must fall inside these windows:

- **Pranzo:** `11:30` – `13:30` (inclusive)
- **Cena:** `18:30` – `20:15` (inclusive)

A day has evening hours if `WEEKLY_SCHEDULE` has a slot with `open >= 17:00`. Mar–Gio have no evening slot; `cena` is always empty.

## Visibility phases (device clock)

The clock is the **device local time** (`new Date()`).  
**Morning close** is the `close` of the day’s **first** opening slot (`14:30` Mar–Gio, `14:45` Ven–Dom).  
**Overlap** starts 30 minutes before morning close (`OVERLAP_MINUTES = 30`). Comparisons use hour×60+minute (same as existing opening-hours helpers).

Let `overlapStart = morningClose − 30` and `nowMin` be the device clock.

**Oggi** (selected date is today):

| Device time | Visible preset groups |
| --- | --- |
| `nowMin < overlapStart` | Pranzo only (past presets already dropped) |
| `overlapStart <= nowMin <= morningClose` | Pranzo remaining + Cena if the day has evening hours |
| `nowMin > morningClose` | Cena only, if the day has evening hours |

Examples (Friday, morning close `14:45`, overlap from `14:15`):

- `10:00` → pranzo `12:10`, `12:30`, `13:10`
- `13:00` → pranzo `13:10` only
- `14:20` → pranzo remaining (none if `13:10` is past) + cena presets
- `15:00` → cena only
- After the last cena preset is past, or Mar–Gio after morning close → no preset buttons

**Domani:** always that day’s pranzo presets and, if it has evening hours, cena presets. Do **not** apply today’s phase. Do **not** drop “past” times (tomorrow has not started).

**Closed day (Monday):** no presets.

**Prima possibile** and **Altro Orario** remain visible whenever the selected day is open.

If the customer already selected a clock time and the phase later hides that group, **keep the selection**. Do not rewrite it to ASAP.

## Resolution algorithm

New helper `getMealPresetOptionsForDate(date)` in `src/utils/openingHours.ts`:

1. Build the day’s full 20-minute grid with `getQuickTimeOptionsForDate(date, { includePast: true })`.
2. Build the visible grid with `includePast: false` (for today, drop past slots). For **tomorrow**, the visible grid is the full day grid.
3. For each target in `MEAL_PRESET_TARGETS.pranzo` / `.cena`:
   - Among grid starts inside the meal window and opening hours, pick the start with **minimum absolute minute distance** to the target; on tie, pick the **later** slot.
   - Include the resolved time **only if** it appears in the visible grid.
4. Deduplicate and sort chronologically within each meal group.
5. Return `{ pranzo: string[]; cena: string[] }`. `cena` is `[]` when the day has no evening slot.

This helper does **not** decide which meal is on screen.

**Sunday:** `12:10`, `12:30`, `13:10` → `12:20`, `12:40`, `13:20`. Cena targets stay on-grid as listed.  
**Tuesday:** exact `12:10`, `12:30`, `13:10`; `cena` is `[]`.

## Phase helper

New helper `getVisibleMealGroups(date, now = new Date())` in `src/utils/openingHours.ts`:

```
{ showPranzo: boolean; showCena: boolean }
```

Rules:

1. Closed all day → both `false`.
2. `hasEvening` from `WEEKLY_SCHEDULE` (`open >= 17:00`).
3. If `date` is not the same calendar day as `now` → `showPranzo: true`, `showCena: hasEvening`.
4. If `date` is today:
   - `nowMin < overlapStart` → `showPranzo: true`, `showCena: false`
   - `overlapStart <= nowMin <= morningClose` → `showPranzo: true`, `showCena: hasEvening`
   - `nowMin > morningClose` → `showPranzo: false`, `showCena: hasEvening`

`AlarmTimePicker` renders:

- pranzo buttons only if `showPranzo && presets.pranzo.length > 0`
- cena buttons only if `showCena && presets.cena.length > 0`

## UI (`AlarmTimePicker`)

Replace the flat `quickSlots` list with:

1. **Prima possibile** (unchanged)
2. **Pranzo** — section label + buttons from `presets.pranzo` when visible and non-empty
3. **Cena** — section label + buttons from `presets.cena` when visible and non-empty
4. **Altro Orario** (unchanged custom `<input type="time">`)

Preset buttons stay **clock-only** (`12:30`). Occupancy stays on `PokeSlotSummary` below the picker. Same presets for Ritiro and Consegna.

Custom-time validation and poke containment keep using the **full** 20-minute grid (`includePast: true` where they already do).

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
  → notes store 12:45 as typed
```

## Error handling

- Closed day: empty groups; existing closed-day banner and day selector stay.
- No visible presets (all past, or Mar–Gio after morning close): only Prima possibile + Altro Orario.
- Occupancy fetch failure: same fallback as today.
- Full poke slot: existing `PokeSlotSummary` / add-to-order guards; do not re-add occupancy captions or disable logic on the time buttons.

## Testing

Add tests in `src/utils/openingHours.test.ts`.

`getMealPresetOptionsForDate`:

- Tue 10:00: pranzo `12:10`, `12:30`, `13:10`; cena `[]`.
- Fri 10:00: those lunch targets + cena `18:45`, `19:05`, `19:25`, `20:05`.
- Sun 10:00: pranzo `12:20`, `12:40`, `13:20` + same cena targets.
- Tue today 12:35: pranzo `['13:10']`.

`getVisibleMealGroups`:

- Fri today 10:00 → pranzo only.
- Fri today 14:20 → pranzo + cena.
- Fri today 15:00 → cena only.
- Selected **Domani** (Saturday) while device is Friday 15:00 → pranzo + cena (no phase on Domani).
- Wed today any time → `showCena` false.

Manual check: localhost picker shows grouped Pranzo/Cena per phase; switch Oggi/Domani; Altro Orario still validates; `PokeSlotSummary` still follows the selected time.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Preset strategy | Button time = poke slot start (1:1) |
| Lunch targets | `12:10`, `12:30`, `13:10` |
| Dinner targets | `18:45`, `19:05`, `19:25`, `20:05` |
| Sunday / 09:00 grid | Nearest grid slot per target inside meal window |
| Oggi phase | Lunch until overlap; both in last 30 min before morning close; dinner after close |
| Morning close | First slot `close` that day |
| Overlap | 30 minutes, inclusive of `overlapStart` and `morningClose` |
| Domani | Full main meals for that day; ignore device phase |
| ASAP | Scans full 20-min grid, not presets only |
| Custom time | Unchanged |
| UI grouping | Labels Pranzo / Cena; omit empty/hidden groups |
| Existing selection | Do not auto-clear when a group hides |

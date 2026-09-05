# Poke slot availability summary on order page

**Date:** 2026-09-04  
**Status:** Approved for implementation

## Problem

On `/componi-poke`, customers only see how many poke remain in a time slot **after** adding at least one poke to the cart. With an empty cart, time buttons show only the clock time (e.g. `12:30`) with no capacity information. Customers must compose a poke before knowing whether their chosen slot still has room.

## Goals

1. Show poke slot availability **immediately** when the customer lands on the order page — no poke in cart required.
2. Display a summary **below the time picker** for the currently selected slot (not on every time button).
3. For **Prima possibile**, show the first available slot and its remaining capacity.
4. When a slot is full (`10/10`), show **Esaurito** and **block adding poke** until the customer picks another time.
5. When the cart has poke, show **both** remaining slot capacity and how many poke are already in the order.

## Non-goals

- Showing remaining seats on every time-picker button (labels stay clock-only).
- Server-side capacity enforcement or new Supabase columns/RPC.
- Capacity limits on fritti or pesce.
- Polling or real-time occupancy refresh beyond existing reload points (mount, day change, pre-submit).
- Changing ASAP submit resolution or order notes format.

## UX

### Banner placement

New component `PokeSlotSummary` renders directly below `AlarmTimePicker` inside `PokeBuilder`.

### Copy and states

**Preset or valid custom time** (example slot 12:30–12:50):

- Available: `Fascia 12:30–12:50 · 3 poke rimaste`
- With cart: `Fascia 12:30–12:50 · 3 poke rimaste · 1 nel tuo ordine`
- Low stock (≤ 2 remaining, still enough for cart): same copy, orange styling
- Full: `Fascia 12:30–12:50 · Esaurito (10/10)` — red styling
- Overbooked (cart exceeds remaining): red styling, message that cart exceeds available seats

**Prima possibile:**

- `Prima fascia libera: 12:30–12:50 · 3 poke rimaste`
- If cart has poke, append `· N nel tuo ordine`
- Resolution uses the same slot-finding rules as submit: first slot on the chosen day with `remaining >= max(1, cartPokeCount)`

**No slot available** (all full or day closed for poke):

- `Nessuna fascia poke disponibile. Scegli un altro giorno o riduci le poke.`

**Loading** (occupancy not yet loaded):

- Lightweight skeleton or muted “Caricamento disponibilità…” — do not block the form.

**Hidden:**

- Day is closed (time picker already shows closed banner)
- Custom time is invalid (outside opening hours)

**Always visible when applicable**, even if the cart contains only fritti or pesce — poke capacity is tied to pickup time, not cart contents.

### Block adding poke when slot is full

In `PokeBuilder.handleSavePokeToOrder()`:

- If selected slot summary is `full` or `overbooked`, reject with: `Fascia poke al completo. Scegli un altro orario.`
- Disable or guard the “add to cart” action while the slot is full/overbooked.

Time-picker buttons stay **enabled** even for full slots (customer can select them and see the red summary). Only poke composition is blocked.

## Architecture

### New files / exports

| Unit | Location | Role |
|------|----------|------|
| `PokeSlotSummary` | `src/components/PokeSlotSummary.tsx` | Renders the banner from summary props |
| `buildSlotSummary()` | `src/utils/pokeSlotCapacity.ts` | Pure function: time + occupancy → summary |
| `findFirstAvailableSlot()` | `src/utils/pokeSlotCapacity.ts` | Shared helper for ASAP summary and submit |
| `canAddPokeToSlot()` | `src/utils/pokeSlotCapacity.ts` | Thin wrapper: summary variant allows add? |

### `SlotSummary` type

```typescript
type SlotSummaryVariant =
  | 'available'
  | 'low'
  | 'full'
  | 'overbooked'
  | 'unavailable'
  | 'loading';

type SlotSummary = {
  variant: SlotSummaryVariant;
  headline: string;
  remaining: number;
  inCart: number;
  slotStart?: string;
  slotEnd?: string;
};
```

`slotEnd` is computed as `slotStart + 20 minutes` for display (e.g. `12:30–12:50`).

### Changes to existing code

- **`slotAvailability()`** — unchanged for time-picker buttons (no captions on buttons; existing cart-based disable logic on buttons can be removed or left inert since captions are empty when cart is empty and buttons no longer show occupancy).
- **`AlarmTimePicker`** — remove occupancy captions from preset buttons (`12:30 · 3 posti` → `12:30`). Slot disable based on occupancy is **removed** from buttons; full slots remain selectable for transparency via the summary banner.
- **`PokeBuilder`** — mount `PokeSlotSummary` below `AlarmTimePicker`; guard `handleSavePokeToOrder` with `canAddPokeToSlot()`.
- **`resolvePokeSubmitSlot()`** — refactor to call `findFirstAvailableSlot()` internally (no behavior change).

## Data flow

1. `loadOccupancy()` on mount and `selectedDay` change → `slotOccupancy` map (`YYYY-MM-DD|HH:MM` → booked count).
2. `buildSlotSummary({ selectedTime, selectedDay, dateKey, slotOccupancy, cartPokeCount, occupancyLoaded })` runs on every relevant state change.
3. Adding/removing poke updates `cartPokeCount` → summary refreshes “nel tuo ordine” and overbooked state.
4. Pre-submit occupancy reload unchanged.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Closed day | No summary banner |
| Invalid custom time | No summary banner |
| Full slot selected | Red “Esaurito”, block poke add |
| ASAP, all slots full | “Nessuna fascia poke disponibile…” |
| ASAP, cart has 5 poke | Find first slot with ≥ 5 free seats |
| Occupancy loading | Loading variant, no poke block |
| Cart empty | Show remaining only, no “nel tuo ordine” |
| Fritti/pesce only in cart | Summary still shown |

**Known limitation (unchanged):** client-side occupancy only; concurrent orders can still overbook without server enforcement.

## Testing

Unit tests in `src/utils/pokeSlotCapacity.test.ts` for `buildSlotSummary()` and `canAddPokeToSlot()`:

- Empty cart → correct `remaining`, no cart suffix
- Cart with poke → headline includes “N nel tuo ordine”
- Full slot (`booked >= 10`) → `variant: 'full'`
- Cart exceeds remaining → `variant: 'overbooked'`
- ASAP → resolves first available slot
- ASAP all full → `variant: 'unavailable'`
- Low remaining (1–2) with sufficient cart → `variant: 'low'`

No E2E tests required.

## Success criteria

- Customer opening `/componi-poke` with empty cart sees remaining poke for the selected time slot without adding anything to the order.
- Selecting a full slot shows Esaurito and prevents adding poke until another time is chosen.
- Prima possibile shows the first free slot and its remaining count.
- Cart poke count is reflected in the summary alongside slot remaining capacity.

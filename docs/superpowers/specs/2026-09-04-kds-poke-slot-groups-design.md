# KDS poke slot groups and ready strip

**Date:** 2026-09-04  
**Status:** Approved for implementation

## Problem

Kitchen staff prepare poke in batches of ~4 bowls at a time, aligned to 20-minute pickup slots. The current KDS shows all active orders in a flat grid regardless of status — ready orders sit next to orders still to prepare, creating visual clutter and slowing production. Staff have not used the software yet; the workflow must be optimized before go-live.

## Goals

1. **Separate work from ready:** orders marked `PRONTO` leave the main grid immediately and appear in a compact bottom strip.
2. **Group by pickup slot:** orders with poke are visually grouped by their 20-minute slot (e.g. "Slot 12:20 · 4 poke · 2 ordini") so staff see what to prepare together.
3. **Keep mixed orders intact:** poke + fritti/pesce stay in one card within the slot group.
4. **Direct archive:** ready orders are archived with a single tap on the compact card — no extra panel.

## Non-goals

- Forced batches of exactly 4 poke.
- Ingredient checklist persistence across refresh.
- Transition animations.
- Changes to poke slot capacity (10/20 min), customer picker, or Supabase schema.
- Kanban columns per status within each slot.
- Manual status filter chips in the active view (replaced by layout).
- Changes to OrderTracking or WhatsApp message content.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header KDS (Attivi/Storico, Ritiro/Consegna, counters)│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▼ Slot 12:20 · 4 poke · 2 ordini          [urgency]   │
│  ┌──────────┐  ┌──────────┐                             │
│  │ Order 1  │  │ Order 2  │   ← full cards (current UI) │
│  └──────────┘  └──────────┘                             │
│                                                         │
│  ▼ Slot 12:40 · 3 poke · 1 ordine                       │
│  ┌──────────┐                                           │
│  │ Order 3  │                                           │
│  └──────────┘                                           │
│                                                         │
│  ▼ Altri ordini · 1 ordine                              │
│  ┌──────────┐                                           │
│  │ Order 4  │                                           │
│  └──────────┘                                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ PRONTI PER RITIRO  ──────────────────────────────────► │
│ [ #42 Mario · 12:20 · Archivia ✓ ] [ #43 ... ]  scroll │
└─────────────────────────────────────────────────────────┘
```

### Main grid (work area)

Shows only `RICEVUTO` and `IN_PREPARAZIONE` orders.

- **Slot groups:** orders containing at least one poke item with a parseable time in notes are grouped by canonical 20-minute slot start.
- **Slot header:** time, total poke count (sum of `quantity`), order count, urgency indicator (reuse `calculateOrderTimer` against slot target).
- **Slot ordering:** ascending urgency (soonest slot first), same logic as `getOrderTargetMs`.
- **General queue ("Altri ordini"):** orders without poke, without parseable time (ASAP with no resolved slot in notes), or fritti/pesce-only. Sorted by urgency as today.
- Empty slot groups are not rendered.

### Ready strip (bottom)

Shows only `PRONTO` orders.

- Fixed height ~80px, horizontal scroll.
- Compact card (~220×72px): display ID, customer name, slot time, Ritiro/Consegna badge.
- **Archivia** button — single tap, status → `COMPLETATO`, removed everywhere, checklist cleared (existing logic).
- **WhatsApp** icon — secondary, only when phone is valid (existing `buildOrderReadyWhatsAppUrl`).
- Ordering: by slot time, then FIFO within slot.
- When empty: thin bar with text "Nessun ordine pronto" (bar stays visible to avoid layout jump).
- Counter in strip label: `Pronti (N)`.

## Slot grouping logic

New module: `src/utils/kdsSlotGroups.ts`

Reuses from `pokeSlotCapacity.ts`:
- `parseClockAndDay(notes)` — extract `HH:MM` and Oggi/Domani
- `slotDateKeyForOrder(order)` — calendar date for slot key
- `containingSlotStart(time, slotStarts)` — map custom time to slot start
- `countPokeInOrder(order)` — poke bowl count

Reuses from `openingHours.ts`:
- `getQuickTimeOptionsForDate(date, { includePast: true })` — full slot grid for containment

```typescript
interface SlotGroup {
  slotKey: string;        // "2026-09-04|12:20"
  slotTime: string;       // "12:20"
  dateKey: string;
  pokeCount: number;
  orderCount: number;
  targetMs: number;
  orders: KdsOrder[];
}

interface GroupedOrders {
  slotGroups: SlotGroup[];
  generalQueue: KdsOrder[];
}

function groupActiveOrders(orders: KdsOrder[]): GroupedOrders
```

**Grouping rules:**

1. Input orders must already be filtered to `RICEVUTO` and `IN_PREPARAZIONE` only.
2. If order has poke items AND parseable time in notes → assign to slot group.
3. Custom time (e.g. `12:07`) maps to containing slot start (e.g. `11:50`).
4. ASAP orders with resolved time in notes (from submit) → slot group.
5. Everything else → general queue.

## Order cards (main grid)

Existing card UI preserved with minor adjustments:

- Mixed orders (poke + fritti/pesce): single card, fritti show `Friggere all'arrivo` badge (existing).
- Status border: yellow = `RICEVUTO`, blue = `IN_PREPARAZIONE`. No `PRONTO` state in grid.
- Buttons unchanged: `RICEVUTO` → Inizia Preparazione; `IN_PREPARAZIONE` → Segnala Pronto.
- Focus mode: "Inizia Preparazione" focuses the order; other cards in the same slot remain visible but dimmed.

## Status transitions

| Action | Immediate effect |
|---|---|
| Inizia Preparazione | Status → `IN_PREPARAZIONE`, focus order, stays in slot group |
| Segnala Pronto | Status → `PRONTO`, leaves grid instantly, appears in bottom strip, focus released |
| Archivia (strip) | Status → `COMPLETATO`, removed everywhere, checklist cleared |

No transition animation — instant move.

## Filters

- **Status filter chips** (In Attesa / In Prep / Pronti): removed from active view. Layout replaces them.
- **Status counters** in header: kept (total counts across all active orders).
- **Ritiro/Consegna filter:** unchanged, applies to both main grid and ready strip (AND).

## Edge cases

| Case | Behavior |
|---|---|
| Custom time `12:07` | Grouped in slot `11:50` |
| ASAP with resolved slot in notes | Slot group |
| ASAP without time in notes | General queue |
| Poke + fritti in same order | Single card in slot group |
| Fritti/pesce only | General queue |
| All orders ready, grid empty | Empty state "Nessun ordine da preparare"; strip shows ready orders |
| Ritiro/Consegna filter active | Applied to grid and strip |
| Realtime new order | Appears in correct slot group; counters update |
| Focused order marked Pronto | Focus released, order moves to strip |

## Architecture

```
KdsBoard
  ├── kdsSlotGroups (groupActiveOrders, countPoke)
  ├── kdsFilters (fulfillment filter only — Ritiro/Consegna)
  ├── pokeSlotCapacity (parseClockAndDay, containingSlotStart, slotDateKeyForOrder)
  ├── openingHours (getQuickTimeOptionsForDate)
  └── friedArrival (badge on fried rows — unchanged)
```

No new database fields. Time source of truth remains order notes (`Orario: HH:MM (Oggi|Domani)`).

## Files changed

| File | Change |
|---|---|
| `src/utils/kdsSlotGroups.ts` | New — slot grouping logic |
| `src/utils/kdsSlotGroups.test.ts` | New — grouping tests |
| `src/utils/kdsFilters.ts` | Simplify — remove status filter from active view |
| `src/utils/kdsFilters.test.ts` | Update — remove status filter tests |
| `src/components/KdsBoard.tsx` | Refactor — slot group layout + ready strip |

## Testing

Vitest coverage for `kdsSlotGroups`:

- Same-slot orders → one group, correct poke count
- Different slots → separate groups, urgency ordering
- Custom time containment (`12:07` → `11:50`)
- Fritti-only → general queue
- Mixed poke+fritti → slot group
- ASAP without time → general queue
- `PRONTO` orders excluded from grouping input

Update `kdsFilters.test.ts` for removed status filter.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Ready orders layout | Fixed bottom strip, horizontal scroll |
| Pronto transition | Immediate, no delay |
| Archive | Direct button on compact card |
| Poke grouping | By 20-min slot, header with poke count |
| Mixed orders | Same card, same slot |
| No-slot orders | "Altri ordini" section |
| Status filter chips | Removed (layout replaces) |
| Ritiro/Consegna filter | Unchanged |

# Poke slot capacity synced with KDS prep status

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

Poke slot capacity (max 10 per 20-minute window) counts every active order until it is archived (`COMPLETATO`). When kitchen staff mark an order **PRONTO** in the KDS, the poke are prepared and waiting for pickup — but the slot remains fully booked until someone archives the order. New customers see "Esaurito" even though the kitchen has finished preparing those poke.

There is also no real-time refresh on `/componi-poke`: occupancy reloads only on mount, day change, and pre-submit. A slot that frees up while a customer is ordering is invisible until they reload.

## Goals

1. **Free slot capacity when KDS marks PRONTO** — prepared poke no longer block new bookings.
2. **Real-time occupancy on `/componi-poke`** — when any order status changes (especially → `PRONTO`), the slot summary and time picker update without a page reload.
3. **Single source of truth** — reuse existing order `status`; no new DB columns.

## Non-goals

- Server-side capacity enforcement or Supabase RPC/triggers.
- Per-item prep tracking (`prepared_at` on `order_items`).
- Item-level slot release (partial order prep).
- Changes to KDS workflow, OrderTracking, or WhatsApp messaging.
- Undo/revert from PRONTO to IN_PREPARAZIONE in KDS.
- Polling beyond Supabase Realtime.

## Capacity rule

### Orders that occupy poke slots

| Status | Occupies slot? | Reason |
|--------|----------------|--------|
| `RICEVUTO` | Yes | Confirmed booking, not yet started |
| `IN_PREPARAZIONE` | Yes | Currently being prepared |

### Orders that do NOT occupy poke slots

| Status | Occupies slot? | Reason |
|--------|----------------|--------|
| `PRONTO` | **No** | Poke prepared; kitchen capacity freed |
| `COMPLETATO` | No | Archived (unchanged) |

For mixed orders (poke + fritti/pesce), when the whole order moves to `PRONTO`, all poke items in that order are excluded from the slot count. Fritti/pesce were never counted.

### Central helper

Add `countsTowardSlotCapacity(status: string): boolean` in `src/utils/pokeSlotCapacity.ts`:

```typescript
export function countsTowardSlotCapacity(status: string): boolean {
  return status === 'RICEVUTO' || status === 'IN_PREPARAZIONE';
}
```

Use in `occupancyBySlot()`:

```typescript
if (!countsTowardSlotCapacity(order.status)) continue;
```

`mergeCapacityOrders()` continues to filter only `COMPLETATO` (orders with status `PRONTO` remain in the merged list but are skipped by `occupancyBySlot`).

## Real-time occupancy on PokeBuilder

### Mechanism

Add a `useEffect` in `src/components/PokeBuilder.tsx` that:

1. Subscribes to Supabase Realtime on `orders` table (`postgres_changes`, event `*`).
2. Subscribes to `subscribeToLocalOrders()` from `orderStore.ts` (localStorage fallback, same as KDS).
3. On any change, calls `loadOccupancy()` with a **300 ms debounce** to coalesce rapid KDS transitions.

Channel name: `poke_occupancy_realtime` (distinct from KDS channel `kds_realtime_orders`).

### Reload triggers (complete list)

| Trigger | Already exists? |
|---------|-----------------|
| Component mount | Yes |
| `selectedDay` change | Yes |
| Pre-submit | Yes |
| Realtime INSERT/UPDATE/DELETE on `orders` | **New** |
| Local store change | **New** |

### What updates downstream

- `slotOccupancy` map → `PokeSlotSummary` banner (remaining / Esaurito)
- `AlarmTimePicker` remaining labels (when cart has poke)
- `canAddPokeToSlot()` guard — a slot that was full can become available live
- `buildSlotSummary()` / ASAP resolution via `findFirstAvailableSlot()`

## Architecture

### Files changed

| File | Change |
|------|--------|
| `src/utils/pokeSlotCapacity.ts` | Add `countsTowardSlotCapacity()`; update `occupancyBySlot()` |
| `src/components/PokeBuilder.tsx` | Realtime subscription + debounced `loadOccupancy()` |
| `src/utils/pokeSlotCapacity.test.ts` | New tests for PRONTO exclusion |

### Files unchanged

| File | Why |
|------|-----|
| `src/components/KdsBoard.tsx` | PRONTO transition already exists; no KDS changes needed |
| `src/utils/kdsSlotGroups.ts` | PRONTO orders already in ready strip, not slot groups |
| `src/components/OrderTracking.tsx` | Customer tracking unaffected |
| Supabase schema | Status field is sufficient |

## Data flow

```
Customer on /componi-poke
  → loadOccupancy(): fetch orders (last 2 days) + localStorage
  → mergeCapacityOrders()
  → occupancyBySlot() — count only RICEVUTO + IN_PREPARAZIONE poke
  → slotOccupancy → PokeSlotSummary + AlarmTimePicker

Kitchen on /admin/kds
  → SEGNALA PRONTO: status IN_PREPARAZIONE → PRONTO
  → Supabase UPDATE orders.status
  → Realtime event → PokeBuilder debounced loadOccupancy()
  → slotOccupancy decreases → banner shows freed seats
```

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Order IN_PREPARAZIONE → PRONTO | Slots freed immediately via realtime |
| Order PRONTO → COMPLETATO (archive) | No capacity change (already excluded) |
| Mixed poke + fritti order → PRONTO | All poke in order excluded |
| Slot full (10/10), 3 orders marked PRONTO | Banner updates to show 3+ remaining without reload |
| Customer on full slot, seats free up | `canAddPokeToSlot()` allows adding poke |
| Remote PRONTO + local stale IN_PREPARAZIONE | `mergeCapacityOrders` prefers remote status → excluded |
| Accidental PRONTO in KDS | Slots free immediately; no undo flow (operational risk, accepted) |
| Concurrent submits | Client-side only; overbooking still possible (unchanged limitation) |

## Testing

Unit tests in `src/utils/pokeSlotCapacity.test.ts`:

- `countsTowardSlotCapacity('PRONTO')` returns `false`
- `countsTowardSlotCapacity('RICEVUTO')` and `('IN_PREPARAZIONE')` return `true`
- `occupancyBySlot` with a PRONTO order → not counted
- Slot at capacity 10, 3 orders become PRONTO → remaining = 3
- `mergeCapacityOrders` with remote PRONTO + local stale active → remote wins, excluded from occupancy

No E2E tests. Realtime wiring follows the existing KDS pattern.

## Success criteria

- When kitchen marks poke orders PRONTO, `/componi-poke` shows freed slot capacity within ~1 second without reload.
- A slot showing "Esaurito (10/10)" updates to show available seats when enough orders move to PRONTO.
- Orders in `RICEVUTO` and `IN_PREPARAZIONE` still count toward the 10/20-min limit.
- No Supabase schema changes required.

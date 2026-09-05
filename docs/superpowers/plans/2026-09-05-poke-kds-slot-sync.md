# Poke KDS Slot Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Free poke slot capacity when KDS marks orders PRONTO and refresh `/componi-poke` occupancy in real time.

**Architecture:** Add `countsTowardSlotCapacity()` to centralize the rule that only `RICEVUTO` and `IN_PREPARAZIONE` orders count toward the 10/20-min cap; wire Supabase Realtime + local store subscription in `PokeBuilder` with a 300 ms debounced `loadOccupancy()` reload.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase Realtime (`@supabase/supabase-js`), existing `orderStore` localStorage fallback.

## Global Constraints

- Do not `git push`. Local commits only.
- Do not add Supabase migrations, RPC, or new order columns.
- Poke cap: **10 bowls per 20-minute slot** (`MAX_POKE_PER_SLOT = 10`, `POKE_SLOT_MINUTES = 20`).
- Only `RICEVUTO` and `IN_PREPARAZIONE` occupy slots; `PRONTO` and `COMPLETATO` do not.
- Realtime channel name: `poke_occupancy_realtime` (distinct from KDS `kds_realtime_orders`).
- Debounce occupancy reload: **300 ms**.
- No changes to KDS, OrderTracking, or Supabase schema.
- TDD for util changes. Run `npm test` after each task.

## File Structure

- Modify: `src/utils/pokeSlotCapacity.ts` — add `countsTowardSlotCapacity()`; update `occupancyBySlot()`
- Modify: `src/utils/pokeSlotCapacity.test.ts` — tests for PRONTO exclusion and merge edge case
- Modify: `src/components/PokeBuilder.tsx` — Realtime + local store subscription with debounced reload

Spec reference: `docs/superpowers/specs/2026-09-05-poke-kds-slot-sync-design.md`

---

### Task 1: Capacity rule — exclude PRONTO from slot count

**Files:**
- Modify: `src/utils/pokeSlotCapacity.ts`
- Modify: `src/utils/pokeSlotCapacity.test.ts`

**Interfaces:**
- Consumes: existing `CapacityOrder`, `countPokeInOrder`, `parseClockAndDay`, `slotDateKeyForOrder`, `containingSlotStart`, `occupancyKey`, `getQuickTimeOptionsForDate`
- Produces:
  - `export function countsTowardSlotCapacity(status: string): boolean`
  - Updated `occupancyBySlot()` — skips orders where `countsTowardSlotCapacity` returns `false`

- [ ] **Step 1: Write failing tests**

Append to `src/utils/pokeSlotCapacity.test.ts` (add `countsTowardSlotCapacity` to the import block):

```typescript
import {
  MAX_POKE_PER_SLOT,
  buildSlotSummary,
  canAddPokeToSlot,
  containingSlotStart,
  countPokeInOrder,
  countsTowardSlotCapacity,
  findFirstAvailableSlot,
  mergeCapacityOrders,
  occupancyBySlot,
  parseClockAndDay,
  resolvePokeSubmitSlot,
  slotDateKeyForOrder,
  slotAvailability,
  type CapacityOrder,
} from './pokeSlotCapacity';

describe('countsTowardSlotCapacity', () => {
  it('returns true for active prep statuses', () => {
    expect(countsTowardSlotCapacity('RICEVUTO')).toBe(true);
    expect(countsTowardSlotCapacity('IN_PREPARAZIONE')).toBe(true);
  });

  it('returns false for PRONTO and COMPLETATO', () => {
    expect(countsTowardSlotCapacity('PRONTO')).toBe(false);
    expect(countsTowardSlotCapacity('COMPLETATO')).toBe(false);
  });
});

describe('occupancyBySlot PRONTO exclusion', () => {
  it('skips PRONTO orders when summing slot occupancy', () => {
    const map = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 6),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 4, 'COMPLETATO'),
    ]);
    const key = Object.keys(map).find((k) => k.endsWith('|12:10'));
    expect(key).toBeTruthy();
    expect(map[key!]).toBe(6);
  });

  it('frees capacity when orders move to PRONTO', () => {
    const active = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 4),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 3),
    ]);
    const key = Object.keys(active).find((k) => k.endsWith('|12:10'))!;
    expect(active[key]).toBe(10);

    const afterPronto = occupancyBySlot([
      pokeOrder('a', 'Orario: 12:20 (Oggi)', 4),
      pokeOrder('b', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
      pokeOrder('c', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
    ]);
    expect(afterPronto[key]).toBe(4);
    expect(MAX_POKE_PER_SLOT - afterPronto[key]).toBe(6);
  });
});

describe('mergeCapacityOrders PRONTO remote wins', () => {
  it('excludes a remotely PRONTO order even when local copy is stale and active', () => {
    const remote = [
      pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3, 'PRONTO'),
    ];
    const local = [pokeOrder('shared', 'Orario: 12:20 (Oggi)', 3, 'IN_PREPARAZIONE')];

    const merged = mergeCapacityOrders(remote, local);
    const key = Object.keys(occupancyBySlot(merged)).find((k) => k.endsWith('|12:10'));

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('PRONTO');
    expect(key).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts`
Expected: FAIL — `countsTowardSlotCapacity is not exported` or PRONTO orders still counted (occupancy 9 instead of 6).

- [ ] **Step 3: Implement capacity rule**

In `src/utils/pokeSlotCapacity.ts`, add the helper after the `CapacityOrder` interface block (before `mergeCapacityOrders`):

```typescript
export function countsTowardSlotCapacity(status: string): boolean {
  return status === 'RICEVUTO' || status === 'IN_PREPARAZIONE';
}
```

In `occupancyBySlot()`, replace the status check inside the loop:

```typescript
// before:
if (order.status === 'COMPLETATO') continue;

// after:
if (!countsTowardSlotCapacity(order.status)) continue;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/pokeSlotCapacity.test.ts`
Expected: PASS (all tests including existing `occupancyBySlot` tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/pokeSlotCapacity.ts src/utils/pokeSlotCapacity.test.ts
git commit -m "$(cat <<'EOF'
feat(poke): exclude PRONTO orders from slot capacity count

Kitchen-ready orders no longer block new poke bookings in the same
20-minute slot.
EOF
)"
```

---

### Task 2: Realtime occupancy reload on PokeBuilder

**Files:**
- Modify: `src/components/PokeBuilder.tsx`

**Interfaces:**
- Consumes: `loadOccupancy()` (existing callback), `supabase` client, `subscribeToLocalOrders()` from `../utils/orderStore`
- Produces: debounced occupancy reload on Supabase Realtime `orders` changes and local store updates

- [ ] **Step 1: Update imports**

Change the React import to include `useRef`:

```typescript
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
```

Change the orderStore import:

```typescript
import { getLocalOrders, saveLocalOrder, subscribeToLocalOrders } from '../utils/orderStore';
```

- [ ] **Step 2: Add debounced reload and subscriptions**

Immediately after the existing `useEffect` that calls `loadOccupancy` on mount / `selectedDay` change (around line 431), add:

```typescript
const occupancyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleOccupancyReload = useCallback(() => {
  if (occupancyDebounceRef.current) {
    clearTimeout(occupancyDebounceRef.current);
  }
  occupancyDebounceRef.current = setTimeout(() => {
    void loadOccupancy();
  }, 300);
}, [loadOccupancy]);

useEffect(() => {
  const unsubLocal = subscribeToLocalOrders(() => {
    scheduleOccupancyReload();
  });

  const channel = supabase
    .channel('poke_occupancy_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        scheduleOccupancyReload();
      }
    )
    .subscribe();

  return () => {
    unsubLocal();
    if (occupancyDebounceRef.current) {
      clearTimeout(occupancyDebounceRef.current);
    }
    supabase.removeChannel(channel);
  };
}, [scheduleOccupancyReload]);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: PASS with no type errors.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Manual smoke test**

1. Start dev server: `npm run dev`
2. Open `/componi-poke` in one tab and `/admin/kds` in another.
3. Submit a poke order for a slot near capacity (or use existing orders).
4. In KDS, mark an order **SEGNALA PRONTO**.
5. Confirm `/componi-poke` banner updates within ~1 s without reload (remaining count increases).

- [ ] **Step 6: Commit**

```bash
git add src/components/PokeBuilder.tsx
git commit -m "$(cat <<'EOF'
feat(poke): refresh slot occupancy in real time from KDS

Subscribe to Supabase Realtime and local order store so /componi-poke
reflects freed capacity when orders move to PRONTO.
EOF
)"
```

---

## Self-Review Checklist

| Spec requirement | Task |
|------------------|------|
| PRONTO frees slot capacity | Task 1 — `countsTowardSlotCapacity` + `occupancyBySlot` |
| RICEVUTO + IN_PREPARAZIONE still count | Task 1 — tests |
| Realtime on `/componi-poke` | Task 2 — Supabase channel |
| 300 ms debounce | Task 2 — `scheduleOccupancyReload` |
| Local store fallback | Task 2 — `subscribeToLocalOrders` |
| No schema changes | No migration tasks |
| mergeCapacityOrders remote PRONTO wins | Task 1 — merge test |

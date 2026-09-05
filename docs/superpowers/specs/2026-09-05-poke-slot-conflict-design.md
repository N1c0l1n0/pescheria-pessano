# Poke slot conflict handling (soft warning + server enforcement)

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

On `/componi-poke`, a customer can select a time slot and start composing poke while another customer completes an order for the same slot. When the slot fills (10/10 poke per 20-minute window), the first customer may not notice until submit — or worse, two simultaneous submits can overbook the slot because capacity checks are client-side only.

Today:

- `PokeSlotSummary` shows capacity, but `canAddPokeToSlot` **hard-blocks** adding poke when the slot is full or overbooked.
- Realtime on `orders` reloads occupancy (300 ms debounce), but there is no listener on `order_items`.
- `resolvePokeSubmitSlot()` **auto-shifts** to the next available slot when the chosen slot is full — the customer never explicitly consents to a different pickup time.
- Submit inserts directly into Supabase with no atomic capacity check; concurrent submits can exceed `MAX_POKE_PER_SLOT`.

## Goals

1. **Soft warning during composition** — customer can keep adding poke to the cart even when the slot is full or overbooked; the banner warns them in real time.
2. **Hard block at submit** — if the chosen slot cannot fit all poke in the cart, reject the order with a clear message (no auto-shift).
3. **Suggest alternatives at submit** — when blocked, show the next available slots with remaining capacity so the customer can pick a new time quickly.
4. **Server-side atomic enforcement** — a Supabase RPC validates slot capacity and inserts the order in one transaction, preventing concurrent overbooking.
5. **Zero additional Supabase cost** — reuse existing plan; RPC runs inside PostgreSQL, Realtime already in use.

## Non-goals

- Temporary slot reservations / holds (5–10 min soft lock).
- Per-ingredient inventory (salmone, tonno, etc.).
- Interactive submit dialog ("Vuoi spostarti alle 13:10?").
- Auto-shift to next slot at submit (customer must change time manually).
- KDS workflow changes.
- Offline overbooking prevention (localStorage fallback keeps existing best-effort behavior).
- Edge Functions or new Supabase products.

## Decisions (from brainstorming)

| Question | Choice |
|----------|--------|
| What "esaurito" means | Slot capacity (10 poke / 20 min), not ingredients |
| During composition | Soft warning — allow continue |
| At submit | Block with clear error |
| Enforcement | Client realtime + RPC atomica (approach C) |
| Submit error UX | Error + list of next available slots |

## UX — Composition (soft warning)

### Remove hard block on add-to-cart

- `canAddPokeToSlot()` is **removed from the add-to-cart guard** in `PokeBuilder.handleSavePokeToOrder()`. The function itself is deleted (no remaining callers).
- The "Aggiungi al carrello" button stays enabled regardless of slot capacity (name/format validations unchanged).
- `pokeAddBlocked` derived from `canAddPokeToSlot` is removed.

### PokeSlotSummary variants

Extend `SlotSummaryVariant` with a new `warning` state:

| Variant | Condition | Styling | Copy |
|---------|-----------|---------|------|
| `available` | `remaining >= cartPokeCount` and `remaining > 2` | green | `Fascia 12:30–12:50 · 3 poke rimaste` |
| `low` | `remaining >= cartPokeCount` and `remaining <= 2` | orange | same as available |
| `warning` | `cartPokeCount > remaining` (including `remaining === 0` with items in cart) | orange/red | `Attenzione: la fascia ha solo N posti, hai M poke nel carrello. Potresti dover cambiare orario.` |
| `full` | `remaining === 0` and `cartPokeCount === 0` | red | `Fascia 12:30–12:50 · Esaurito (10/10) — puoi continuare, ma l'ordine potrebbe non andare a buon fine` |
| `unavailable` | no slot fits cart (ASAP) | red | unchanged |
| `loading` | occupancy not loaded | muted | unchanged |

When cart has poke, append `· N nel tuo ordine` to meta line (unchanged).

`aria-live="polite"` on the banner ensures screen readers announce capacity changes when another customer books.

### Realtime refresh

Keep existing Realtime channel on `orders` (debounced 300 ms). **Add** listener on `order_items` (`INSERT`, `UPDATE`, `DELETE`) so occupancy updates immediately when items are attached to a new order — not only when the parent order row changes.

Reload trigger points (unchanged): mount, day change, pre-submit, Realtime events.

## UX — Submit (block + alternatives)

### Replace auto-shift with validate-only

Rename/refactor `resolvePokeSubmitSlot()` → `validatePokeSubmitSlot()`:

- **Preset or custom time:** validate the **chosen** slot only. If `booked + cartPokeCount > MAX_POKE_PER_SLOT`, return error — do **not** search for the next slot.
- **Prima possibile:** resolve to `findFirstAvailableSlot(minSeats: cartPokeCount)` at submit time. If none exists, return error.
- **No poke in cart:** skip slot validation (fritti/pesce-only orders unchanged).

### Error message format

When validation fails (client pre-check or RPC rejection):

```
Fascia 12:30–12:50 esaurita per 2 poke.
Prossime fasce disponibili:
· 13:10–13:30 · 4 posti
· 13:30–13:50 · 7 posti
Scegli un altro orario e riprova.
```

- Show up to **3** next available slots on the same day with `remaining >= cartPokeCount`.
- If no slots fit the cart size, omit the alternatives list and show: `Nessuna fascia con abbastanza posti per N poke. Scegli un altro giorno o riduci le poke.`
- Display via existing `triggerValidationError()` targeting the time picker section.

### Submit flow (client)

```
1. Validate phone, address, cart (unchanged)
2. If cart has poke:
   a. loadOccupancy() — best-effort pre-check
   b. validatePokeSubmitSlot() — fast reject before RPC round-trip
   c. supabase.rpc('submit_poke_order', payload)
   d. On SLOT_FULL error → show message + alternatives from RPC payload
3. If cart has no poke:
   a. Direct insert into orders + order_items (unchanged)
4. On success → saveLocalOrder mirror + redirect /ordine/:id
```

## Architecture — RPC atomica

### New SQL file

`docs/supabase/submit_poke_order.sql` — deploy manually to Supabase.

### Function: `submit_poke_order`

Single PostgreSQL function callable by `anon` role. Runs in one transaction:

1. Parse target slot from `p_notes` (same regex as client: `Orario: HH:MM (Oggi|Domani)`).
2. Compute `date_key` from `p_created_at` + day label (mirror `slotDateKeyForOrder` logic).
3. Count poke in slot: sum `order_items.quantity` (default 1) for orders where:
   - `status IN ('RICEVUTO', 'IN_PREPARAZIONE')`
   - parsed slot matches target slot
   - `item_type = 'poke'`
4. If `booked + p_poke_count > 10` → return JSON error:
   ```json
   {
     "ok": false,
     "code": "SLOT_FULL",
     "slot": "12:30",
     "slot_end": "12:50",
     "requested": 2,
     "remaining": 0,
     "alternatives": [
       { "time": "13:10", "end": "13:30", "remaining": 4 },
       { "time": "13:30", "end": "13:50", "remaining": 7 }
     ]
   }
   ```
5. Otherwise → `INSERT INTO orders (...) RETURNING id` + `INSERT INTO order_items (...)` for each item in `p_items` JSON array.
6. Return success:
   ```json
   { "ok": true, "order_id": "uuid", "friendly_id": "#1234" }
   ```

Use `SELECT ... FOR UPDATE` on relevant order rows (or advisory lock keyed by `date_key|slot_start`) inside the transaction to serialize concurrent submits for the same slot.

### RPC parameters

| Param | Type | Description |
|-------|------|-------------|
| `p_friendly_id` | text | e.g. `#1234` |
| `p_customer_name` | text | |
| `p_customer_phone` | text | |
| `p_order_type` | text | `RITIRO` / `CONSEGNA` |
| `p_status` | text | `RICEVUTO` |
| `p_total_price` | numeric | |
| `p_notes` | text | includes `Orario: ...` |
| `p_delivery_address` | text | nullable |
| `p_poke_count` | int | poke items in cart (for capacity check) |
| `p_items` | jsonb | array of `{ item_type, name, price, quantity, details, person_name }` |

Pricing is trusted from the client (same as today). The RPC validates capacity only — not menu prices.

### Client integration

In `PokeBuilder.handleDirectOrderSubmit()`:

- Build payload from existing order data.
- Replace direct `supabase.from('orders').insert()` + `order_items.insert()` with `supabase.rpc('submit_poke_order', ...)` when `pokeCount > 0`.
- Map RPC `SLOT_FULL` response to the error message format above.
- On RPC network/unknown error, show a generic submit error and **do not** fall back to direct insert (prevents silent overbooking when the server is reachable but RPC fails). Offline/localStorage-only path remains for environments without Supabase connectivity (unchanged pre-existing behavior).

## Components and files

| Unit | Location | Change |
|------|----------|--------|
| `submit_poke_order` RPC | `docs/supabase/submit_poke_order.sql` | New |
| `validatePokeSubmitSlot()` | `src/utils/pokeSlotCapacity.ts` | New — validate-only, no auto-shift |
| `findNextAvailableSlots()` | `src/utils/pokeSlotCapacity.ts` | New — up to 3 alternatives |
| `buildSlotSummary()` | `src/utils/pokeSlotCapacity.ts` | Add `warning` variant logic |
| `formatSlotFullError()` | `src/utils/pokeSlotCapacity.ts` | New — shared error copy |
| `PokeSlotSummary` | `src/components/PokeSlotSummary.tsx` | `warning` styling + copy |
| `PokeBuilder` | `src/components/PokeBuilder.tsx` | Remove add-block, RPC submit, Realtime on `order_items` |
| Tests | `src/utils/pokeSlotCapacity.test.ts` | Validate-only, alternatives, warning variant |

### Deprecate / remove

- `resolvePokeSubmitSlot()` — replaced by `validatePokeSubmitSlot()` (update all callers and tests).
- `canAddPokeToSlot()` — deleted along with its tests.
- `overbooked` variant — replaced by `warning` in `SlotSummaryVariant`; update `PokeSlotSummary` styles accordingly.

## Error handling and edge cases

| Case | Behavior |
|------|----------|
| Two clients submit simultaneously, 1 seat left | RPC serializes; one succeeds, one gets `SLOT_FULL` with alternatives |
| Occupancy stale during composition | Warning may lag slightly; RPC is authoritative at submit |
| Client pre-check passes, RPC rejects | Show RPC error + alternatives (expected race window closed) |
| Order with 0 poke | Bypass RPC; direct insert unchanged |
| Cart > 10 poke | Client rejects immediately; RPC not called |
| Status `PRONTO` / `COMPLETATO` | Do not count toward capacity (unchanged rule via `countsTowardSlotCapacity`) |
| Offline / RPC unreachable | Fall back to direct insert + localStorage (existing behavior; overbooking possible offline) |
| Mixed order (poke + fritti) | RPC counts only poke items toward slot; all items inserted together |
| Closed day / no slots | `CLOSED_DAY_ERROR` unchanged |

## Testing

### Unit tests (`pokeSlotCapacity.test.ts`)

- `validatePokeSubmitSlot` rejects full slot without auto-shift.
- `validatePokeSubmitSlot` accepts slot with enough remaining.
- `validatePokeSubmitSlot` ASAP resolves first available, rejects if none.
- `findNextAvailableSlots` returns up to 3 slots with correct remaining counts.
- `buildSlotSummary` returns `warning` when cart exceeds remaining.
- `buildSlotSummary` returns soft `full` copy (not blocking language).
- `formatSlotFullError` produces expected multi-line message.

### Manual test plan

1. Open two browser tabs on `/componi-poke`, same slot, fill to 9/10 in tab A.
2. Tab B adds 2 poke — banner shows `warning`, add-to-cart still works.
3. Tab A submits 1 poke → succeeds.
4. Tab B submits → blocked with error + alternatives listing next slots.
5. Tab B changes to suggested slot → submit succeeds.
6. Two tabs submit simultaneously for last seat → exactly one succeeds.

## Migration / deploy

1. Deploy `docs/supabase/submit_poke_order.sql` to Supabase (SQL editor or CLI).
2. Deploy frontend changes.
3. No data migration required.

## Cost impact

None beyond existing Supabase usage. One RPC call per poke order submit; Realtime listener on `order_items` adds negligible message volume for a single-location fish shop.

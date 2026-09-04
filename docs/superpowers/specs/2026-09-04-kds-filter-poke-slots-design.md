# KDS status filter, poke slot capacity, fried-on-arrival

**Date:** 2026-09-04  
**Status:** Approved for implementation

## Problem

Kitchen staff cannot click the KDS status chips to see only waiting, in-prep, or ready orders. Customers can book unlimited poke at the same pickup time, which overloads a 20-minute production window. Fried cones are cooked to order on arrival, but the order flow does not say so.

## Goals

1. On the active KDS board, clicking **In Attesa / In Prep / Pronti** filters the order list to that status.
2. At most **10 poke bowls** may be booked across all customers in each **20-minute** pickup slot.
3. If an order includes fried cones, tell the customer (and the kitchen) that they are fried on arrival / at departure.

## Non-goals

- New Supabase columns or RPC.
- Capacity limits on fried cones or fresh fish.
- Multi-select of several KDS statuses at once.
- Status filter on the KDS history view.
- Changing order status workflow, WhatsApp alerts, or focus mode.

## Feature 1 — KDS status filter

Existing chips `In Attesa` (`RICEVUTO`), `In Prep` (`IN_PREPARAZIONE`), `Pronti` (`PRONTO`) become buttons. They stay in the header of the **Attivi** view, same colors.

- Click a chip → show only that status.
- Click the same chip again → show all statuses (`ALL`).
- Click a different chip → replace the status filter (one at a time).
- `Tutti / Solo Ritiro / Solo Consegne` still apply and combine with the status filter (AND).
- Chip counts stay the totals of **all** active orders, not the filtered subset.
- History view is unchanged (chips already hidden).
- If the focused order is hidden by the filter, drop focus (existing behavior for fulfillment filters).
- Empty list copy depends on the status filter:
  - `ALL`: existing “Nessun Ordine Attivo al Momento!”
  - `RICEVUTO`: “Nessun ordine in attesa”
  - `IN_PREPARAZIONE`: “Nessun ordine in preparazione”
  - `PRONTO`: “Nessun ordine pronto”

Filter helpers live in `src/utils/kdsFilters.ts` so `KdsBoard.tsx` does not grow another inline predicate.

## Feature 2 — 10 poke per 20-minute slot

**Capacity:** kitchen-wide. Sum poke bowls from every non-`COMPLETATO` order that targets that slot. Fritti and pesce do not count. Each poke line item counts as `quantity` (default 1).

**Slot grid:** 20-minute starts from each opening-hour start, not rounded to :00/:30.

Examples:

- Tue–Thu morning: 08:30, 08:50, 09:10 … last start `<= 14:30`
- Fri/Sat evening: 17:45, 18:05 … last start `<= 20:30`
- Sunday morning: 09:00, 09:20 …

Past starts are hidden when the picker date is today (same as today’s 30-minute picker).

**Picker UI** (only if the cart has at least one poke):

- Each slot button shows remaining seats: `12:20 · 3 posti`
- Full slot (`booked >= 10`): visible, `disabled`, label `Esaurito (10/10)`
- Slot with remaining `> 0` but `< cart poke count`: visible, `disabled`, still shows remaining seats
- `Prima possibile` stays selectable
- Without poke in the cart: current picker, no occupancy labels

**Prima possibile:** on submit, if the cart has poke, assign the first slot on the chosen day with `remaining >= cart poke count`. Persist the resolved clock time, never the string `Prima possibile`, in order notes.

**Custom time:** maps into the 20-minute slot that contains it (greatest slot start `<=` that time). If that slot cannot fit the cart, treat it as unavailable (same as a disabled preset).

**Hard cart cap:** an order cannot contain more than 10 poke (no slot can fit 11).

**Submit re-check:** reload occupancy. If the chosen slot no longer fits, assign the next fitting slot on that day. If none remain, block submit with: `Non ci sono più fasce con abbastanza posti per le poke. Scegli un altro orario o riduci il numero di poke.`

**Persistence:** notes keep the existing shape `Orario: 12:20 (Oggi)` or `Orario: 12:20 (Domani)`. Occupancy parses `HH:MM` plus Oggi/Domani. Slot calendar date for an existing order: `created_at` date if Oggi (or unspecified), `created_at + 1 day` if Domani.

**Data:** merge non-completed Supabase orders (`*, order_items(*)`) with `getLocalOrders()`, same id-map as the KDS. Logic in `src/utils/pokeSlotCapacity.ts`.

## Feature 3 — Fried cones cooked on arrival

If the order (or the fritti tab) involves fried cones, show this copy:

- Ritiro: `I coni fritti si preparano all'arrivo: presentati al banco e li friggiamo al momento, caldi.`
- Consegna: `I coni fritti si friggono al momento della partenza, così arrivano caldi.`
- KDS fried line: `Friggere all'arrivo`

Surfaces:

1. Fritti tab intro (under the existing subtitle).
2. Cart, when at least one `fritto` is in the list (ritiro vs consegna from current `orderType`).
3. Order tracker, when the loaded order has a fried item (ritiro vs consegna from `order_type`).
4. KDS, on each fried item row.

Copy constants live in `src/utils/friedArrival.ts`. No change to cooking workflow or status machine.

## Architecture

```
KdsBoard  --uses-->  kdsFilters (status + fulfillment predicates)
                  \-> friedArrival (badge on fried rows)

PokeBuilder --uses--> AlarmTimePicker (slot buttons + occupancy)
                    \-> pokeSlotCapacity (grid, occupancy, ASAP assign)
                    \-> openingHours.getQuickTimeOptionsForDate (20 min)
                    \-> friedArrival (tab + cart)

OrderTracking --uses--> friedArrival (banner)
```

No new database fields. Time source of truth remains order notes.

## Error handling

- Occupancy fetch failure: fall back to local orders only (same as KDS). If both fail and the cart has poke, still allow `Prima possibile` assignment against local occupancy; if local is empty, treat remaining as 10.
- Invalid custom time (closed / past): existing AlarmTimePicker validation; do not submit.
- Over-capacity at submit: next slot or blocking message above.

## Testing

Add Vitest. Cover:

- `kdsFilters`: toggle, AND with ritiro/consegna, empty copy
- `pokeSlotCapacity`: 20-min grid from 08:30 and 17:45, occupancy 10, remaining vs cart size, ASAP first-fit, custom time containment, Oggi/Domani date, ignore fritti/pesce, ignore `COMPLETATO`
- `friedArrival`: pickup vs delivery message

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Poke cap | Kitchen capacity, 10 per 20 min, all customers |
| ASAP | First slot with enough remaining seats |
| Full slots | Visible, disabled, `Esaurito (10/10)` |
| KDS click | One status at a time; second click clears |
| Storage | Notes `Orario: HH:MM (Oggi\|Domani)` |
| Fried copy | On arrival (pickup) / at departure (delivery) |

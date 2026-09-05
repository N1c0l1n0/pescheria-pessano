# KDS WhatsApp ready button

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

After starting preparation (`IN_PREPARAZIONE`), kitchen staff must tap "Segnala pronto" and then separately open WhatsApp from the ready strip to notify the customer. This is two steps for what is always a single intent: the order is ready and the customer should be told.

## Goals

1. **Replace "Segnala pronto" with a WhatsApp action** on `IN_PREPARAZIONE` cards — one tap marks the order `PRONTO` and opens WhatsApp with the pre-filled message.
2. **Fallback when phone is missing:** show a disabled WhatsApp button plus a working "Segnala pronto" button that only updates status.
3. **Keep re-send on ready strip:** the secondary WhatsApp icon on `PRONTO` cards in the bottom strip remains for re-sending if the first message failed or the customer did not respond.

## Non-goals

- Changes to Supabase schema or order status enum.
- Changes to WhatsApp message content or phone normalization logic.
- Changes to OrderTracking customer alerts (still triggered on `PRONTO`).
- Changes to "Inizia preparazione" flow, slot groups, checklist, or ready strip archive behavior.
- WhatsApp Business API / automated sending — still opens `wa.me` in a new tab.

## Operational flow

```
RICEVUTO
  └─ [▶ INIZIA PREPARAZIONE]          ← unchanged

IN_PREPARAZIONE
  └─ [💬 AVVISA CLIENTE]              ← replaces "Segnala pronto"
       tap → status PRONTO + opens wa.me with pre-filled message
       order moves to "Pronti per ritiro" strip

PRONTO (bottom strip)
  └─ [Archivia] + [WhatsApp re-send]  ← unchanged
```

### Tap behavior (WhatsApp button on card)

1. Update status → `PRONTO` (optimistic UI + Supabase, existing `handleUpdateStatus`).
2. Open WhatsApp via `openOrderReadyWhatsApp(order)` (existing helper).
3. Exit fullscreen if active (existing logic in `openOrderReadyWhatsApp`).
4. Order leaves main grid and appears in ready strip.

Customer OrderTracking: unchanged — transitions to `PRONTO` and triggers alert/notification as today.

## UI

### Footer button — phone available

Single full-width button (~54px height), same footprint as current "Segnala pronto":

- Background: WhatsApp green `#25D366`, white bold text ~1.05rem
- Icon: `MessageCircle` from Lucide (already used in OrderTracking)
- Label: **AVVISA CLIENTE**
- `aria-label`: "Segna pronto e invia WhatsApp a {customer_name}"

### Footer button — phone missing or invalid

Two stacked elements:

1. **AVVISA CLIENTE** — disabled (grey, opacity ~0.4, `cursor: not-allowed`), tooltip "Telefono non disponibile"
2. **SEGNALA PRONTO** — active green button (`#10B981`), calls `handleUpdateStatus(orderId, 'PRONTO')` only

Phone validity: reuse existing `buildOrderReadyWhatsAppUrl(ord)` — returns `null` when phone cannot be normalized.

### Ready strip

No changes. Primary **Archivia** button and secondary WhatsApp icon for re-send remain as implemented.

## Implementation

**Scope:** `src/components/KdsBoard.tsx` only.

### New handler

```typescript
const handleMarkReadyAndNotify = (order: KdsOrder) => {
  handleUpdateStatus(order.id, 'PRONTO');
  openOrderReadyWhatsApp(order);
};
```

### Card footer change

Replace the `ord.status === 'IN_PREPARAZIONE'` block (~lines 1439–1467):

| Condition | Render |
|---|---|
| `buildOrderReadyWhatsAppUrl(ord)` is truthy | Single "AVVISA CLIENTE" button → `handleMarkReadyAndNotify(ord)` |
| Phone unavailable | Disabled "AVVISA CLIENTE" + active "SEGNALA PRONTO" fallback |

### Imports

Add `MessageCircle` from `lucide-react`.

### Reused helpers (no changes)

- `normalizePhoneForWhatsApp`
- `buildOrderReadyWhatsAppMessage`
- `buildOrderReadyWhatsAppUrl`
- `openOrderReadyWhatsApp`
- `handleUpdateStatus`
- `ReadyStrip` / `onWhatsApp={openOrderReadyWhatsApp}`

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Tap WhatsApp with valid phone | Status → `PRONTO`, chat opens, order in strip |
| Popup blocked by browser | Status → `PRONTO` anyway; re-send available from strip |
| Missing/invalid phone | WhatsApp disabled; "Segnala pronto" fallback works |
| Fullscreen active | Exits fullscreen before opening WhatsApp |
| Delivery vs pickup order | Different pre-filled message (unchanged) |
| Customer OrderTracking | "Ordine pronto" alert on `PRONTO` transition (unchanged) |

## Manual test plan

1. Pickup order with phone → Inizia prep → Avvisa cliente → verify WhatsApp opens with pickup message and order appears in strip.
2. Delivery order with phone → same flow, verify delivery message text.
3. Order without phone → WhatsApp button disabled, "Segnala pronto" marks ready without opening chat.
4. From ready strip → re-send WhatsApp and Archivia both work.

## Decisions log

| Question | Decision |
|---|---|
| No valid phone number? | Disabled WhatsApp + "Segnala pronto" fallback (option A) |
| Keep WhatsApp on ready strip? | Yes, for re-send if message failed or customer unresponsive (option A) |
| Approach | Single WhatsApp button replacing "Segnala pronto" (approach A) |

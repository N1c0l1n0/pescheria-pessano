# Remove order tracking phone verification gate

**Date:** 2026-09-06  
**Status:** Approved for implementation

## Problem

Task 5 of the GDPR remediation added a phone suffix verification gate on `/ordine/:id`. Customers must enter the last 4 digits of their phone before seeing order status and personal data. This adds friction to the live tracking UX.

The Pescheria wants to restore immediate access via the personal order link only.

## Goals

1. Remove phone verification UI and logic from `OrderTracking`.
2. Show full tracker content as soon as the order is loaded (valid ID).
3. Update Privacy Policy to document link-based access model (replacing phone verification claim).
4. Delete unused `orderAccess` helper and tests.

## Non-goals

- Change KDS staff PIN auth (`/admin/kds`).
- Change PokeBuilder privacy checkbox or cookie consent.
- Add server-side RLS or signed URL tokens.
- Reintroduce mock order fallback (removed in F-016; stays removed).

## Decisions

| Question | Choice |
| --- | --- |
| Scope | Customer tracker only (`/ordine/:id`) |
| Approach | Full removal of gate (not env-flag optional) |
| Privacy copy | Update Security paragraph to describe personal link model |
| Dead code | Delete `orderAccess.ts` and `orderAccess.test.ts` |

## UX — Customer flow

### Before (current)

```
/ordine/:id → load order → phone gate (4 digits) → tracker
```

### After

```
/ordine/:id → load order → tracker immediately
```

Invalid or missing order ID: unchanged error state (`Ordine non trovato...`).

All other tracker behaviour unchanged: Realtime, polling, PRONTO alert, WhatsApp help.

## Privacy Policy copy change

In `PrivacyPolicyModal.tsx`, replace the **Sicurezza** paragraph closing sentence.

**From:**

> tracking ordine protetto da verifica parziale del telefono.

**To:**

> il tracking dell'ordine è accessibile tramite link personale fornito al cliente dopo l'ordine; la riservatezza dei dati dipende dalla custodia del link — non condividerlo con terzi.

Keep the first clause about staff KDS credentials unchanged.

## Architecture

Single-component revert in `OrderTracking.tsx`:

- Remove state: `phoneVerified`, `phoneInput`, `phoneGateError`
- Remove `useEffect` reset on `[id]` for phone state
- Remove phone gate JSX block (~lines 515–565)
- Change main content condition from `phoneVerified` to `order` only
- Remove `verifyOrderPhoneAccess` import

Delete files no longer referenced:

- `src/utils/orderAccess.ts`
- `src/utils/orderAccess.test.ts`

## GDPR note

Finding **F-015** (order tracking security) reverts to **accepted risk**: protection relies on URL opacity (order ID in link). Documented transparently in Privacy Policy. KDS PIN and other P1 remediations remain in place.

## Files

| File | Action |
| --- | --- |
| `src/components/OrderTracking.tsx` | **Modify** — remove phone gate |
| `src/components/PrivacyPolicyModal.tsx` | **Modify** — update Sicurezza copy |
| `src/utils/orderAccess.ts` | **Delete** |
| `src/utils/orderAccess.test.ts` | **Delete** |

## Testing

- `npm test` — full suite (4 fewer tests after deleting orderAccess tests; expect 94 passing)
- `npm run build` — must pass
- Manual: open `/ordine/:valid-id` → tracker visible immediately, no phone prompt
- Manual: invalid ID → error message, no mock data

## Accessibility

Removing the gate removes one form step; no new a11y concerns.

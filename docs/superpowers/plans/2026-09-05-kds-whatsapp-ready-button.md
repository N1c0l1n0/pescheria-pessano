# KDS WhatsApp Ready Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the KDS "Segnala pronto" button with a single-tap WhatsApp action that marks orders `PRONTO` and opens the pre-filled customer chat.

**Architecture:** Move existing WhatsApp URL helpers from `KdsBoard.tsx` into a testable util module (zero logic change). Add `handleMarkReadyAndNotify` in `KdsBoard` that chains `handleUpdateStatus('PRONTO')` + `openOrderReadyWhatsApp`. Replace the `IN_PREPARAZIONE` footer with "AVVISA CLIENTE" (WhatsApp green) or disabled WhatsApp + "SEGNALA PRONTO" fallback when phone is invalid. Ready strip unchanged.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Lucide React (`MessageCircle`), inline styles (existing KDS pattern).

## Global Constraints

- Do not change Supabase schema or order status enum.
- Do not change WhatsApp message content or phone normalization logic (move only, no edits).
- Do not change OrderTracking customer alerts.
- Do not change "Inizia preparazione", slot groups, checklist, or ready strip archive behavior.
- WhatsApp still opens via `wa.me` in a new tab (no Business API).
- Button label on card: **AVVISA CLIENTE**; background `#25D366`; min height ~54px.
- Fallback when phone invalid: disabled AVVISA CLIENTE (opacity ~0.4, `cursor: not-allowed`, title "Telefono non disponibile") + active **SEGNALA PRONTO** (`#10B981`).
- Ready strip keeps Archivia + WhatsApp re-send icon unchanged.
- `aria-label` on active WhatsApp button: `Segna pronto e invia WhatsApp a {customer_name}`.

## File Structure

- Create: `src/utils/kdsWhatsApp.ts` — pure WhatsApp URL/message helpers (moved verbatim from KdsBoard)
- Create: `src/utils/kdsWhatsApp.test.ts` — unit tests for URL building and phone normalization
- Modify: `src/components/KdsBoard.tsx` — import helpers, add handler, replace IN_PREPARAZIONE footer

---

### Task 1: WhatsApp helper module (extract + tests)

**Files:**
- Create: `src/utils/kdsWhatsApp.ts`
- Create: `src/utils/kdsWhatsApp.test.ts`
- Modify: `src/components/KdsBoard.tsx:87-152` — remove inline helpers; add import

**Interfaces:**
- Consumes: `KdsOrder` from `src/utils/orderMappers.ts`
- Produces:
  - `normalizePhoneForWhatsApp(phone: string): string | null`
  - `buildOrderReadyWhatsAppMessage(order: KdsOrder): string`
  - `buildOrderReadyWhatsAppUrl(order: KdsOrder): string | null`
  - `openOrderReadyWhatsApp(order: KdsOrder): void`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/kdsWhatsApp.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import type { KdsOrder } from './orderMappers';
import {
  buildOrderReadyWhatsAppMessage,
  buildOrderReadyWhatsAppUrl,
  normalizePhoneForWhatsApp,
} from './kdsWhatsApp';

const baseOrder = (overrides: Partial<KdsOrder> = {}): KdsOrder => ({
  id: 'ord-1',
  display_id: '#42',
  status: 'IN_PREPARAZIONE',
  created_at: '2026-09-05T10:00:00.000Z',
  customer_name: 'Mario Rossi',
  phone: '333 1234567',
  order_type: 'Ritiro',
  total_price: 15,
  order_items: [],
  ...overrides,
});

describe('normalizePhoneForWhatsApp', () => {
  it('normalizes Italian mobile without country code', () => {
    expect(normalizePhoneForWhatsApp('333 1234567')).toBe('393331234567');
  });

  it('returns null for empty phone', () => {
    expect(normalizePhoneForWhatsApp('')).toBeNull();
    expect(normalizePhoneForWhatsApp('   ')).toBeNull();
  });

  it('returns null for too-short numbers', () => {
    expect(normalizePhoneForWhatsApp('123')).toBeNull();
  });
});

describe('buildOrderReadyWhatsAppMessage', () => {
  it('uses pickup copy for ritiro orders', () => {
    const msg = buildOrderReadyWhatsAppMessage(baseOrder({ order_type: 'Ritiro' }));
    expect(msg).toContain('Puoi passare a ritirarlo');
    expect(msg).toContain('Mario Rossi');
    expect(msg).toContain('#42');
  });

  it('uses delivery copy for consegna orders', () => {
    const msg = buildOrderReadyWhatsAppMessage(baseOrder({ order_type: 'Consegna a domicilio' }));
    expect(msg).toContain('Stiamo preparando la consegna');
  });
});

describe('buildOrderReadyWhatsAppUrl', () => {
  it('returns wa.me URL when phone is valid', () => {
    const url = buildOrderReadyWhatsAppUrl(baseOrder());
    expect(url).toMatch(/^https:\/\/wa\.me\/393331234567\?text=/);
  });

  it('returns null when phone is missing', () => {
    expect(buildOrderReadyWhatsAppUrl(baseOrder({ phone: undefined }))).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/kdsWhatsApp.test.ts`

Expected: FAIL — cannot find module `./kdsWhatsApp`

- [ ] **Step 3: Create helper module**

Create `src/utils/kdsWhatsApp.ts` — move these functions verbatim from `KdsBoard.tsx` lines 87–152 and export them:

```typescript
import type { KdsOrder } from './orderMappers';

export const normalizePhoneForWhatsApp = (phone: string): string | null => {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('39')) {
    let national = digits.slice(2);
    if (national.startsWith('0')) national = national.slice(1);
    if (national.length >= 8 && national.length <= 11) return `39${national}`;
    return digits.length >= 11 ? digits : null;
  }

  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length >= 8 && digits.length <= 11) return `39${digits}`;

  return digits.length >= 9 ? digits : null;
};

export const buildOrderReadyWhatsAppMessage = (order: KdsOrder): string => {
  const displayId = order.display_id || `#${order.id}`;
  const isDelivery = order.order_type?.toLowerCase().includes('consegna');
  return isDelivery
    ? `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Stiamo preparando la consegna. — Pescheria Pessano`
    : `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Puoi passare a ritirarlo. — Pescheria Pessano`;
};

export const buildOrderReadyWhatsAppUrl = (order: KdsOrder): string | null => {
  const phone = normalizePhoneForWhatsApp(order.phone || '');
  if (!phone) return null;

  const message = buildOrderReadyWhatsAppMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

export const openOrderReadyWhatsApp = (order: KdsOrder): void => {
  const url = buildOrderReadyWhatsAppUrl(order);
  if (!url) return;

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => undefined);
  }

  const popup = window.open(url, '_blank');
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      // ignore: some browsers block touching opener across origins
    }
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
```

In `src/components/KdsBoard.tsx`, delete lines 87–152 and add:

```typescript
import {
  buildOrderReadyWhatsAppUrl,
  openOrderReadyWhatsApp,
} from '../utils/kdsWhatsApp';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/kdsWhatsApp.test.ts`

Expected: PASS (4 tests)

- [ ] **Step 5: Run full test suite**

Run: `npm test`

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/kdsWhatsApp.ts src/utils/kdsWhatsApp.test.ts src/components/KdsBoard.tsx
git commit -m "refactor(kds): extract WhatsApp helpers for testability"
```

---

### Task 2: WhatsApp ready button on IN_PREPARAZIONE cards

**Files:**
- Modify: `src/components/KdsBoard.tsx:1-24` — add `MessageCircle` import
- Modify: `src/components/KdsBoard.tsx:622-665` — add handler after `handleUpdateStatus`
- Modify: `src/components/KdsBoard.tsx:1439-1467` — replace footer block

**Interfaces:**
- Consumes: `buildOrderReadyWhatsAppUrl`, `openOrderReadyWhatsApp` from `src/utils/kdsWhatsApp.ts`; `handleUpdateStatus` from same component
- Produces: `handleMarkReadyAndNotify(order: KdsOrder): void` (component-local callback)

- [ ] **Step 1: Add MessageCircle import**

In `src/components/KdsBoard.tsx`, add `MessageCircle` to the lucide-react import list:

```typescript
import {
  Clock,
  CheckCircle2,
  Play,
  Check,
  Maximize2,
  Minimize2,
  Volume2,
  ShoppingBag,
  Truck,
  User,
  Phone,
  RefreshCw,
  Sparkles,
  Focus,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';
```

- [ ] **Step 2: Add handleMarkReadyAndNotify**

Immediately after the closing `};` of `handleUpdateStatus` (~line 665), add:

```typescript
  const handleMarkReadyAndNotify = useCallback(
    (order: KdsOrder) => {
      handleUpdateStatus(order.id, 'PRONTO');
      openOrderReadyWhatsApp(order);
    },
    [handleUpdateStatus]
  );
```

Note: `handleUpdateStatus` is not wrapped in `useCallback` today — either wrap `handleUpdateStatus` in `useCallback` first (with its existing deps) or omit the dependency array and define `handleMarkReadyAndNotify` as a plain function after `handleUpdateStatus`. Prefer wrapping `handleUpdateStatus` in `useCallback` if eslint/react-hooks warns.

- [ ] **Step 3: Replace IN_PREPARAZIONE footer**

Replace the block `{ord.status === 'IN_PREPARAZIONE' && ( ... )}` (~lines 1439–1467) with:

```tsx
                    {ord.status === 'IN_PREPARAZIONE' && (() => {
                      const whatsAppUrl = buildOrderReadyWhatsAppUrl(ord);
                      const canNotify = Boolean(whatsAppUrl);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={!canNotify}
                            title={canNotify ? undefined : 'Telefono non disponibile'}
                            aria-label={
                              canNotify
                                ? `Segna pronto e invia WhatsApp a ${ord.customer_name}`
                                : 'Telefono non disponibile per WhatsApp'
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canNotify) handleMarkReadyAndNotify(ord);
                            }}
                            style={{
                              width: '100%',
                              minHeight: '54px',
                              borderRadius: '12px',
                              backgroundColor: canNotify ? '#25D366' : '#334155',
                              color: 'white',
                              border: 'none',
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              cursor: canNotify ? 'pointer' : 'not-allowed',
                              opacity: canNotify ? 1 : 0.4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              boxShadow: canNotify ? '0 4px 15px rgba(37, 211, 102, 0.4)' : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <MessageCircle size={22} />
                            AVVISA CLIENTE
                          </button>

                          {!canNotify && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(ord.id, 'PRONTO');
                              }}
                              style={{
                                width: '100%',
                                minHeight: '54px',
                                borderRadius: '12px',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                                transition: 'all 0.2s',
                              }}
                            >
                              <CheckCircle2 size={22} />
                              SEGNALA PRONTO
                            </button>
                          )}
                        </div>
                      );
                    })()}
```

- [ ] **Step 4: Typecheck and build**

Run: `npm run build`

Expected: PASS with no TypeScript errors

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

1. Open KDS route in browser.
2. Find or create an order in `IN_PREPARAZIONE` with a valid phone → verify green **AVVISA CLIENTE** button (no **SEGNALA PRONTO**).
3. Tap **AVVISA CLIENTE** → order moves to bottom strip as `PRONTO`; WhatsApp tab opens with pre-filled message.
4. From strip → **Archivia** and WhatsApp re-send still work.

- [ ] **Step 6: Commit**

```bash
git add src/components/KdsBoard.tsx
git commit -m "feat(kds): replace Segnala pronto with WhatsApp notify button"
```

---

### Task 3: Manual QA (edge cases)

**Files:** none (verification only)

- [ ] **Step 1: Delivery order message**

Create or use a consegna order with phone → Avvisa cliente → verify WhatsApp text contains "Stiamo preparando la consegna".

- [ ] **Step 2: Order without phone**

Create or use an order with no/invalid phone in `IN_PREPARAZIONE` → verify disabled AVVISA CLIENTE + active SEGNALA PRONTO → tap fallback → order in strip, no WhatsApp opened.

- [ ] **Step 3: Full test suite**

Run: `npm test`

Expected: all PASS

- [ ] **Step 4: Final commit (if any fixups)**

Only if QA required small fixes:

```bash
git add -A
git commit -m "fix(kds): address WhatsApp ready button QA findings"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| Replace Segnala pronto with WhatsApp on IN_PREPARAZIONE | Task 2 |
| One tap → PRONTO + open WhatsApp | Task 2 (`handleMarkReadyAndNotify`) |
| Disabled WhatsApp + Segnala pronto fallback | Task 2 footer |
| Ready strip unchanged | No code change (verify Task 3) |
| No schema / OrderTracking changes | Global constraints |
| Message content unchanged | Task 1 (verbatim move) |
| AVVISA CLIENTE label, #25D366, MessageCircle | Task 2 |
| aria-label with customer name | Task 2 |

## Self-Review Notes

- Helpers extracted to enable Vitest (project has no React Testing Library). Logic is verbatim — satisfies spec non-goal "no changes to message/normalization".
- `handleMarkReadyAndNotify` calls status update before `openOrderReadyWhatsApp` so popup opens in same user gesture (existing fullscreen/popup behavior preserved).
- When phone is valid, only one button shown (not disabled + fallback) — matches approved design section 2.

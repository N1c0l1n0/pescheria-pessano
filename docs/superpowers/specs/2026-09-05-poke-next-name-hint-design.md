# Poke next-name hint — dynamic copy after first bowl

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

On `/componi-poke`, the name field serves two roles: order referent (first poke) and per-bowl label (subsequent pokes). After the first poke is added, the form resets and scrolls to the name input, but the hint still reads *"Referente principale per il ritiro o la consegna."* — the same copy as for the first poke. Users have no persistent, visible cue that they should enter a **different** name to distinguish the next bowl.

The success toast mentions this but disappears after 6 seconds.

## Goals

1. After at least one poke is in the cart, change the name field hint to communicate that the next name identifies **this poke**, not the order referent.
2. Highlight the hint subtly so it reads as a deliberate prompt, not passive helper text.
3. Keep the change scoped to the name field label + hint — no new fields, no changes to submit logic or the top callout.

## Non-goals

- Splitting referent and per-poke into two separate inputs.
- Changing the top info callout (*"Il telefono è unico…"*).
- Changing toast copy, sidebar cart, or KDS item naming.
- Animating or restyling the input itself beyond existing focus styles.

## Design direction (frontend)

**Subject:** Pescheria Pessano poke builder — group/family orders where each bowl gets a name at the banco, like a kitchen tag.

**Token system (existing — no new palette):**

| Role | Token | Value |
|------|-------|-------|
| Hint text | `--color-ocean-dark` | `#0A2342` |
| Hint background | gold @ 8% | `rgba(201, 162, 39, 0.08)` |
| Hint border | gold @ 22% | `rgba(201, 162, 39, 0.22)` |
| Accent bar | `--color-gold` | `#C9A227` |

**Typography:** Plus Jakarta Sans (existing body). Hint weight 600 when in “next poke” state; label weight stays 700.

**Signature element:** A 3px left accent bar in gold on the hint pill — evokes a banco name tag / order slip tab. This is the single visual risk; everything else stays quiet.

**Motion:** On transition to “next poke” state, hint fades in over 150ms (`opacity` + `translateY(4px → 0)`). Disabled when `prefers-reduced-motion: reduce`.

**Copy principle:** Each element does one job. Label names the field; hint explains what to do; placeholder shows format — no overlap.

## UX

### Trigger condition

Show “next poke” styling when:

```typescript
const isNextPokeName = cartPokeCount > 0 && editingPokeId === null;
```

Where `cartPokeCount = orderList.filter((item) => item.itemType === 'poke').length` (already computed in `PokeBuilder`).

### Copy states

| State | Label | Hint | Hint class |
|-------|-------|------|------------|
| First poke (empty cart or no poke in cart) | Nome e cognome | Referente principale per il ritiro o la consegna. | `.order-hint` |
| Next poke (≥ 1 poke in cart, not editing) | Nome per questa poke | Inserisci un nome diverso per distinguere la poke successiva. | `.order-hint.order-hint--next-poke` |
| Editing existing poke | Nome e cognome | Referente principale per il ritiro o la consegna. | `.order-hint` |

Edit mode keeps the existing banner *"Stai modificando la poke di …"* — the hint does not switch to “next poke” while editing.

Placeholder stays `Es. Marco Rossi` in all states (format example, not semantic).

### Visual — `.order-hint--next-poke`

```css
.order-hint--next-poke {
  margin-top: 0.5rem;
  padding: 0.55rem 0.75rem 0.55rem 0.85rem;
  border-radius: 10px;
  background: rgba(201, 162, 39, 0.08);
  border: 1px solid rgba(201, 162, 39, 0.22);
  border-left: 3px solid var(--color-gold);
  color: var(--color-ocean-dark);
  font-weight: 600;
  line-height: 1.45;
  animation: order-hint-enter 0.15s ease-out;
}

@keyframes order-hint-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .order-hint--next-poke {
    animation: none;
  }
}
```

Do not nest `.order-hint--next-poke` rules inside `.order-hint` in a way that causes specificity conflicts — both classes on the same element, modifier overrides base muted color only.

## Architecture

### Files changed

| File | Change |
|------|--------|
| `src/components/PokeBuilder.tsx` | Conditional label + hint class/text from `isNextPokeName` |
| `src/index.css` | Add `.order-hint--next-poke` + `@keyframes order-hint-enter` |

No new components. No new state variables — derive from existing `cartPokeCount` and `editingPokeId`.

### JSX sketch

```tsx
<label htmlFor="customerNameInput" className="order-label">
  {isNextPokeName ? 'Nome per questa poke' : 'Nome e cognome'}{' '}
  <span className="req">*</span>
</label>
{/* ... input unchanged ... */}
<p className={isNextPokeName ? 'order-hint order-hint--next-poke' : 'order-hint'}>
  {isNextPokeName
    ? 'Inserisci un nome diverso per distinguere la poke successiva.'
    : 'Referente principale per il ritiro o la consegna.'}
</p>
```

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Cart empty | Referent hint (default) |
| 1 poke added, form reset | Next-poke hint appears immediately |
| User deletes all poke from cart | Reverts to referent hint |
| Cart has only fritti/pesce | Referent hint (no poke in cart) |
| User clicks Edit on a poke | Referent hint; edit banner shown |
| User cancels edit | If cart still has poke → next-poke hint returns |
| User submits with one poke | N/A (leaves page) |

## Testing

Manual verification on `/componi-poke`:

1. Empty cart → referent label + muted hint.
2. Add first poke → scroll to name; label *"Nome per questa poke"*; gold-accent hint visible and persists (not toast-dependent).
3. Add second poke with different name → both appear in sidebar as *"Poke di …"*.
4. Edit first poke → hint reverts; edit banner visible.
5. Delete all poke from cart → hint reverts to referent.
6. Mobile viewport (~375px) → hint pill wraps cleanly, no overflow.
7. `prefers-reduced-motion` → no animation, styling still applied.

No unit tests required (presentational copy/CSS only).

## Success criteria

- After adding the first poke, the name field permanently shows differentiated copy until the cart has no poke or the user enters edit mode.
- The hint is visually distinct from the default muted helper text without competing with primary CTAs.
- Order referent semantics for submit (`first poke name`) are unchanged.

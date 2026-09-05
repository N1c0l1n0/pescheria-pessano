# Poke Next-Name Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the first poke is in the cart, show a highlighted hint and updated label on the name field so users know to enter a different name for the next bowl.

**Architecture:** Derive `isNextPokeName` from existing `cartPokeCount` and `editingPokeId` in `PokeBuilder.tsx`. Conditionally render label/hint copy and apply a new `.order-hint--next-poke` CSS modifier with gold accent bar and subtle enter animation.

**Tech Stack:** React 18, TypeScript, Vite, existing CSS token system in `index.css`.

## Global Constraints

- Do not split referent and per-poke into two inputs.
- Do not change the top info callout, toast copy, sidebar cart, or submit logic.
- Trigger: `isNextPokeName = cartPokeCount > 0 && editingPokeId === null`.
- First poke label: `Nome e cognome`; next poke label: `Nome per questa poke`.
- First poke hint: `Referente principale per il ritiro o la consegna.`
- Next poke hint: `Inserisci un nome diverso per distinguere la poke successiva.`
- Placeholder stays `Es. Marco Rossi` in all states.
- Gold accent bar: `3px solid var(--color-gold)` on hint left border.
- Animation: 150ms fade+slide; disabled with `prefers-reduced-motion: reduce`.
- No unit tests required (presentational only).

## File Structure

- Modify: `src/index.css` — add `.order-hint--next-poke` + `@keyframes order-hint-enter`
- Modify: `src/components/PokeBuilder.tsx` — derive `isNextPokeName`, conditional label + hint

Spec reference: `docs/superpowers/specs/2026-09-05-poke-next-name-hint-design.md`

---

### Task 1: Next-poke hint CSS

**Files:**
- Modify: `src/index.css` (after `.order-hint` block ~line 1743)

**Interfaces:**
- Produces: CSS class `.order-hint--next-poke` usable as `className="order-hint order-hint--next-poke"`

- [ ] **Step 1: Add CSS modifier and keyframes**

Append after the existing `.order-hint` rule in `src/index.css`:

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

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add next-poke hint pill styling"
```

---

### Task 2: Conditional label and hint in PokeBuilder

**Files:**
- Modify: `src/components/PokeBuilder.tsx` (~line 352 and ~lines 1149-1166)

**Interfaces:**
- Consumes: existing `cartPokeCount` (line ~352), `editingPokeId` (line ~364)
- Produces: `const isNextPokeName = cartPokeCount > 0 && editingPokeId === null`

- [ ] **Step 1: Add derived flag**

After `cartPokeCount` definition (~line 352), add:

```tsx
const isNextPokeName = cartPokeCount > 0 && editingPokeId === null;
```

Note: `editingPokeId` is declared on line ~364 — move the flag after both declarations, or declare `isNextPokeName` after `editingPokeId`.

- [ ] **Step 2: Update label and hint JSX**

Replace the static label and hint (~lines 1149-1166):

```tsx
<label htmlFor="customerNameInput" className="order-label">
  {isNextPokeName ? 'Nome per questa poke' : 'Nome e cognome'}{' '}
  <span className="req">*</span>
</label>
```

```tsx
<p className={isNextPokeName ? 'order-hint order-hint--next-poke' : 'order-hint'}>
  {isNextPokeName
    ? 'Inserisci un nome diverso per distinguere la poke successiva.'
    : 'Referente principale per il ritiro o la consegna.'}
</p>
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`

Check on `/componi-poke`:
1. Empty cart → referent label + muted hint
2. Add first poke → label changes to "Nome per questa poke", gold hint pill visible
3. Edit poke → reverts to referent hint
4. Delete all poke → reverts to referent hint

- [ ] **Step 4: Commit**

```bash
git add src/components/PokeBuilder.tsx
git commit -m "feat: show next-poke name hint after first bowl added"
```

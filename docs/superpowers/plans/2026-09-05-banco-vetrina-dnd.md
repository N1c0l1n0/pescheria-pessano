# Banco Vetrina Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff reorder the `/admin/banco` vetrina by dragging a left handle, persist `sort_order` on drop, and show the ⋯ overflow menu above the list instead of clipped under the header.

**Architecture:** Pure `reorderFishItems` / `changedSortOrders` rewrite indexes `0…n-1`. `updateFishSortOrders` patches only `sort_order` in parallel. The list is a lazy-loaded `@dnd-kit` sortable (handle-only, 8px activation). The ⋯ panel portals to `document.body` with `position: fixed`.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase JS, `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`.

## Global Constraints

- No Supabase migration, RPC, or new columns. `fish_items.sort_order` stays the source of truth.
- Hidden and visible fish stay in one list and can be mixed.
- Persist immediately on drop. No “Salva ordine” button.
- Drag source is the left handle only. Photo, name, pencil, price stepper, and switch must not start a drag.
- Pointer activation distance is 8px.
- `@dnd-kit` loads only after admin login, on the list screen. Login and editor must not import it.
- Reorder updates write **only** `sort_order`. Price/toggle keep full-row `upsertFishItem`, but flush the current `itemsRef` row (latest `sortOrder`).
- Remove the editor field “Ordine in vetrina”. New fish still append (`sortOrder = items.length`).
- Do not refactor existing `lucide-react` barrel imports.
- Do not add keyboard-only reorder or E2E gesture tests.
- Do not `git push` unless the user asks.

## File Structure

- Modify: `src/utils/fishAdmin.ts` — `reorderFishItems`, `changedSortOrders`, drop `sortOrder` from `isFishEditorDirty`
- Modify: `src/utils/fishAdmin.test.ts` — reorder, changed ids, dirty-check
- Modify: `src/utils/fishCatalog.ts` — `updateFishSortOrders`
- Modify: `src/hooks/useFishCatalog.ts` — `replaceAll`
- Modify: `src/components/FishCatalogAdmin.tsx` — lazy list, drop persist, `persistRow` reads `itemsRef`
- Modify: `src/components/fish-admin/FishAdminRow.tsx` — handle slot
- Modify: `src/components/fish-admin/FishAdminEditor.tsx` — remove order field
- Modify: `src/components/fish-admin/FishAdminHeader.tsx` — portaled ⋯ panel
- Modify: `src/index.css` — handle column, `touch-action: none` on handle, fixed menu panel
- Create: `src/components/fish-admin/FishAdminSortableList.tsx` — `DndContext`, `FishAdminSortableRow`

Do not modify `FishMenuCatalog.tsx`. It already sorts via `fetchFishCatalog`.

---

### Task 1: Reorder helpers and editor dirty check

**Files:**
- Modify: `src/utils/fishAdmin.ts`
- Test: `src/utils/fishAdmin.test.ts`

**Interfaces:**
- Consumes: `FishItem` from `src/types/fishCatalog.ts`
- Produces:
  - `export function reorderFishItems(items: FishItem[], activeId: string, overId: string): FishItem[]`
  - `export function changedSortOrders(previous: FishItem[], next: FishItem[]): { id: string; sortOrder: number }[]`
  - `isFishEditorDirty` ignores `sortOrder`

- [ ] **Step 1: Write the failing tests**

In `src/utils/fishAdmin.test.ts`, add `reorderFishItems` and `changedSortOrders` to the import from `./fishAdmin`.

Inside the existing `describe('fish editor draft')` block, add this assertion after the current ones:

```typescript
expect(isFishEditorDirty({ ...sample, sortOrder: 9 }, sample)).toBe(false);
```

Then append at the end of the file:

```typescript
const catalog = (
  ['orata', 'branzino', 'seppia'] as const
).map((id, sortOrder) => ({ ...sample, id, name: id, sortOrder }));

describe('reorderFishItems', () => {
  it('moves a middle item to the top and rewrites 0…n-1', () => {
    const next = reorderFishItems(catalog, 'branzino', 'orata');
    expect(next.map((item) => item.id)).toEqual(['branzino', 'orata', 'seppia']);
    expect(next.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it('moves the first item to the last slot', () => {
    const next = reorderFishItems(catalog, 'orata', 'seppia');
    expect(next.map((item) => item.id)).toEqual(['branzino', 'seppia', 'orata']);
    expect(next.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it('moves the last item to the first slot', () => {
    const next = reorderFishItems(catalog, 'seppia', 'orata');
    expect(next.map((item) => item.id)).toEqual(['seppia', 'orata', 'branzino']);
    expect(next.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it('returns the same array when an id is missing or both ids match', () => {
    expect(reorderFishItems(catalog, 'orata', 'orata')).toBe(catalog);
    expect(reorderFishItems(catalog, 'missing', 'orata')).toBe(catalog);
    expect(reorderFishItems(catalog, 'orata', 'missing')).toBe(catalog);
  });
});

describe('changedSortOrders', () => {
  it('returns only ids whose sortOrder changed', () => {
    const swapped = reorderFishItems(catalog, 'orata', 'branzino');
    expect(changedSortOrders(catalog, swapped)).toEqual([
      { id: 'branzino', sortOrder: 0 },
      { id: 'orata', sortOrder: 1 },
    ]);
    expect(changedSortOrders(catalog, catalog)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/fishAdmin.test.ts`

Expected: FAIL — `reorderFishItems` / `changedSortOrders` are not exported, and `isFishEditorDirty({ ...sample, sortOrder: 9 }, sample)` is `true`.

- [ ] **Step 3: Implement the helpers**

In `src/utils/fishAdmin.ts`, remove the `sortOrder` comparison from `isFishEditorDirty`:

```typescript
export function isFishEditorDirty(draft: FishItem, original: FishItem | null): boolean {
  if (!original) {
    return draft.name.trim().length > 0 || draft.image !== EMPTY_FISH_ITEM.image;
  }

  return (
    draft.name !== original.name ||
    draft.origin !== original.origin ||
    draft.image !== original.image
  );
}
```

Append:

```typescript
export function reorderFishItems(
  items: FishItem[],
  activeId: string,
  overId: string
): FishItem[] {
  if (activeId === overId) return items;
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1) return items;

  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, index) => (item.sortOrder === index ? item : { ...item, sortOrder: index }));
}

export function changedSortOrders(
  previous: FishItem[],
  next: FishItem[]
): { id: string; sortOrder: number }[] {
  const previousOrder = new Map(previous.map((item) => [item.id, item.sortOrder ?? 0]));
  return next
    .filter((item) => (item.sortOrder ?? 0) !== (previousOrder.get(item.id) ?? 0))
    .map((item) => ({ id: item.id, sortOrder: item.sortOrder ?? 0 }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/fishAdmin.test.ts`

Expected: PASS (all describes).

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishAdmin.ts src/utils/fishAdmin.test.ts
git commit -m "feat(banco): add vetrina reorder helpers and stop dirty-checking sortOrder."
```

---

### Task 2: Persist sort_order and keep price upsert current

**Files:**
- Modify: `src/utils/fishCatalog.ts`
- Modify: `src/hooks/useFishCatalog.ts`
- Modify: `src/components/FishCatalogAdmin.tsx`

**Interfaces:**
- Consumes: `changedSortOrders` from Task 1 (used in Task 5). This task only adds the persist/list APIs.
- Produces:
  - `export async function updateFishSortOrders(updates: { id: string; sortOrder: number }[]): Promise<void>`
  - `replaceAll: (next: FishItem[]) => void` on `useFishCatalog`
  - `persistRow` upserts `itemsRef.current` for that id, not the scheduled snapshot

- [ ] **Step 1: Add `updateFishSortOrders`**

In `src/utils/fishCatalog.ts`, add after `upsertFishItem`:

```typescript
export async function updateFishSortOrders(
  updates: { id: string; sortOrder: number }[]
): Promise<void> {
  if (updates.length === 0) return;

  const results = await Promise.all(
    updates.map(({ id, sortOrder }) =>
      supabase.from('fish_items').update({ sort_order: sortOrder }).eq('id', id)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}
```

- [ ] **Step 2: Add `replaceAll`**

In `src/hooks/useFishCatalog.ts`, add next to `replaceItem`:

```typescript
  const replaceAll = useCallback((next: FishItem[]) => {
    setItems(next);
  }, []);
```

Return it:

```typescript
  return { items, loading, error, reload, replaceItem, replaceAll, removeItem };
```

- [ ] **Step 3: Flush the current row from `itemsRef`**

In `src/components/FishCatalogAdmin.tsx`, change the `try` body of `persistRow` so the upsert uses the live row:

```typescript
      try {
        const latest = itemsRef.current.find((item) => item.id === next.id) ?? next;
        const saved = await upsertFishItem(latest);
        if (saveGeneration.current[next.id] !== generation) return;
        itemsRef.current = itemsRef.current.map((item) => (item.id === saved.id ? saved : item));
        replaceItem(saved);
        flashRowStatus(next.id, 'Salvato.');
```

Leave the rest of `persistRow` unchanged (generation, busy, reload on error).

- [ ] **Step 4: Destructure `replaceAll` and typecheck**

In `src/components/FishCatalogAdmin.tsx` change the hook call to:

```typescript
  const { items, loading, error, reload, replaceItem, replaceAll, removeItem } = useFishCatalog({
    includeInactive: true,
  });
```

`replaceAll` is unused until Task 5. Prefix the binding if `tsc` reports it: keep the name `replaceAll` (do not rename to `_replaceAll`).

Run: `npx tsc --noEmit`

Expected: PASS. If the only error is unused `replaceAll`, add this line immediately after the hook call and re-run:

```typescript
  void replaceAll;
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishCatalog.ts src/hooks/useFishCatalog.ts src/components/FishCatalogAdmin.tsx
git commit -m "feat(banco): persist sort_order patches and flush the latest catalog row."
```

---

### Task 3: Remove “Ordine in vetrina” from the editor

**Files:**
- Modify: `src/components/fish-admin/FishAdminEditor.tsx`

**Interfaces:**
- Consumes: `FishAdminEditor` still receives `draft` / `onChange` (unchanged)
- Produces: editor UI with no sort-order field. `startCreate` in `FishCatalogAdmin` still sets `sortOrder: itemsRef.current.length` — do not change that.

- [ ] **Step 1: Delete the field**

In `src/components/fish-admin/FishAdminEditor.tsx`, remove this block (it sits between the origin fieldset and the status paragraph):

```tsx
        <label className="fish-admin-field">
          Ordine in vetrina
          <input
            type="number"
            inputMode="numeric"
            value={draft.sortOrder ?? 0}
            onChange={(e) => onChange({ sortOrder: Number(e.target.value) })}
          />
        </label>
```

Do not add a replacement control.

- [ ] **Step 2: Confirm create still appends**

In `src/components/FishCatalogAdmin.tsx`, leave `startCreate` as:

```typescript
    setDraft({ ...EMPTY_FISH_ITEM, sortOrder: itemsRef.current.length });
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/fish-admin/FishAdminEditor.tsx
git commit -m "feat(banco): remove numeric vetrina order field from the editor."
```

---

### Task 4: Drag handle on the row

**Files:**
- Modify: `src/components/fish-admin/FishAdminRow.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: none from `@dnd-kit` (no import in this file)
- Produces: `FishAdminRow` always renders a left handle button. Optional `dragHandle` prop:

```typescript
export type FishAdminDragHandle = {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners?: React.HTMLAttributes<HTMLButtonElement>;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};
```

`dragHandle?: FishAdminDragHandle`

- [ ] **Step 1: Add the handle to `FishAdminRow`**

Replace `src/components/fish-admin/FishAdminRow.tsx` with:

```tsx
import React from 'react';
import { GripVertical, Pencil } from 'lucide-react';
import type { FishItem } from '../../types/fishCatalog';
import { FishPriceStepper } from './FishPriceStepper';

export type FishAdminDragHandle = {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners?: React.HTMLAttributes<HTMLButtonElement>;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

interface FishAdminRowProps {
  item: FishItem;
  busy: boolean;
  status: string | null;
  onStep: (direction: 1 | -1) => void;
  onPriceCommit: (price: number) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  dragHandle?: FishAdminDragHandle;
}

export const FishAdminRow: React.FC<FishAdminRowProps> = ({
  item,
  busy,
  status,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
  dragHandle,
}) => {
  const hidden = item.isActive === false;
  const statusError = Boolean(status?.toLowerCase().includes('errore'));

  return (
    <article className={`fish-admin-row${hidden ? ' fish-admin-row--hidden' : ''}`}>
      <button
        type="button"
        className="fish-admin-row__handle"
        aria-label={`Riordina ${item.name}`}
        ref={dragHandle?.setActivatorNodeRef}
        {...dragHandle?.attributes}
        {...dragHandle?.listeners}
      >
        <GripVertical size={18} />
      </button>

      <button type="button" className="fish-admin-row__photo" onClick={onEdit} aria-label={`Modifica ${item.name}`}>
        <img
          src={item.image}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/hero_pescheria.jpg';
          }}
        />
      </button>

      <div className="fish-admin-row__body">
        <div className="fish-admin-row__top">
          <button type="button" className="fish-admin-row__name" onClick={onEdit}>
            {item.name}
          </button>
          <button
            type="button"
            className="fish-admin-icon-btn fish-admin-icon-btn--quiet"
            aria-label={`Scheda ${item.name}`}
            onClick={onEdit}
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="fish-admin-row__controls">
          <FishPriceStepper
            price={item.pricePerKg}
            disabled={busy}
            onStep={onStep}
            onCommit={onPriceCommit}
          />
          <button
            type="button"
            className={`fish-admin-switch${hidden ? '' : ' fish-admin-switch--on'}`}
            role="switch"
            aria-checked={!hidden}
            aria-label={hidden ? `Mostra ${item.name}` : `Nascondi ${item.name}`}
            disabled={busy}
            onClick={onToggleActive}
          />
        </div>

        {status ? (
          <p className={`fish-admin-status${statusError ? ' fish-admin-status--error' : ''}`}>{status}</p>
        ) : null}
      </div>
    </article>
  );
};
```

- [ ] **Step 2: Add handle CSS**

In `src/index.css`, change `.fish-admin-row` columns:

```css
.fish-admin-row {
  display: grid;
  grid-template-columns: 48px 64px 1fr;
  gap: 0.7rem;
  padding: 0.7rem;
  border: 1px solid var(--banco-line);
  border-radius: 18px;
  background: var(--banco-card);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
}
```

Insert immediately after `.fish-admin-row--hidden`:

```css
.fish-admin-row__handle {
  width: 48px;
  height: 48px;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--banco-foam);
  cursor: grab;
  touch-action: none;
}

.fish-admin-row__handle:active {
  cursor: grabbing;
}
```

`.fish-admin-shell button { touch-action: manipulation; }` stays. The handle rule must come later in the file so `touch-action: none` wins (it already will — this new rule is more specific).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS. The list still renders rows without `dragHandle`; the grip is visible but inert until Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/components/fish-admin/FishAdminRow.tsx src/index.css
git commit -m "feat(banco): add a left drag handle to catalog rows."
```

---

### Task 5: Sortable list and drop persist

**Files:**
- Create: `src/components/fish-admin/FishAdminSortableList.tsx`
- Modify: `src/components/FishCatalogAdmin.tsx`
- Modify: `package.json` / `package-lock.json` via npm

**Interfaces:**
- Consumes:
  - `reorderFishItems(items, activeId, overId)`
  - `changedSortOrders(previous, next)`
  - `updateFishSortOrders(updates)`
  - `replaceAll(next)`
  - `FishAdminRow` + `FishAdminDragHandle`
- Produces:
  - `export function FishAdminSortableList(props: FishAdminSortableListProps): JSX.Element`
  - `onReorder(activeId: string, overId: string)` called from `onDragEnd`

- [ ] **Step 1: Install `@dnd-kit`**

Run:

```bash
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
```

Expected: `package.json` lists those three dependencies. Do not install the newer multi-framework `dnd-kit` rewrite.

- [ ] **Step 2: Create `FishAdminSortableList.tsx`**

Create `src/components/fish-admin/FishAdminSortableList.tsx` with this exact file (module-level `FishAdminSortableRow`, not nested inside the list):

```tsx
import React from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FishItem } from '../../types/fishCatalog';
import { FishAdminRow } from './FishAdminRow';

interface FishAdminSortableListProps {
  items: FishItem[];
  busyIds: Record<string, boolean>;
  rowStatus: Record<string, string | null>;
  onStep: (id: string, direction: 1 | -1) => void;
  onPriceCommit: (id: string, price: number) => void;
  onToggleActive: (id: string) => void;
  onEdit: (item: FishItem) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function FishAdminSortableList({
  items,
  busyIds,
  rowStatus,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
  onReorder,
}: FishAdminSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    if (overId == null) return;
    onReorder(String(event.active.id), String(overId));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <FishAdminSortableRow
            key={item.id}
            item={item}
            busy={Boolean(busyIds[item.id])}
            status={rowStatus[item.id] ?? null}
            onStep={onStep}
            onPriceCommit={onPriceCommit}
            onToggleActive={onToggleActive}
            onEdit={onEdit}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function FishAdminSortableRow({
  item,
  busy,
  status,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
}: {
  item: FishItem;
  busy: boolean;
  status: string | null;
  onStep: (id: string, direction: 1 | -1) => void;
  onPriceCommit: (id: string, price: number) => void;
  onToggleActive: (id: string) => void;
  onEdit: (item: FishItem) => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
        boxShadow: isDragging ? '0 12px 28px rgba(26, 36, 40, 0.16)' : undefined,
      }}
    >
      <FishAdminRow
        item={item}
        busy={busy}
        status={status}
        onStep={(direction) => onStep(item.id, direction)}
        onPriceCommit={(price) => onPriceCommit(item.id, price)}
        onToggleActive={() => onToggleActive(item.id)}
        onEdit={() => onEdit(item)}
        dragHandle={{
          attributes: attributes as React.HTMLAttributes<HTMLButtonElement>,
          listeners: listeners as React.HTMLAttributes<HTMLButtonElement> | undefined,
          setActivatorNodeRef,
        }}
      />
    </div>
  );
}
```

Do not import `@dnd-kit` from `FishAdminRow.tsx` or `FishAdminEditor.tsx`.

- [ ] **Step 3: Wire drop persist in `FishCatalogAdmin`**

At the top of `src/components/FishCatalogAdmin.tsx`:

1. Add `lazy` and `Suspense` to the React import:

```typescript
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
```

2. Add imports (do **not** import `FishAdminSortableList` statically):

```typescript
import {
  deleteFishItem,
  isAdminAuthenticated,
  logoutAdmin,
  seedFishCatalogFromDefaults,
  slugifyFishId,
  updateFishSortOrders,
  uploadFishImage,
  upsertFishItem,
} from '../utils/fishCatalog';
import {
  EMPTY_FISH_ITEM,
  canSaveFishDraft,
  changedSortOrders,
  patchFishItem,
  reorderFishItems,
  stepFishPrice,
} from '../utils/fishAdmin';
```

3. After the existing component imports, add:

```typescript
const FishAdminSortableList = lazy(() =>
  import('./fish-admin/FishAdminSortableList').then((module) => ({
    default: module.FishAdminSortableList,
  }))
);
```

4. Ensure the hook destructure includes `replaceAll` (from Task 2).

5. After `saveGeneration`, add:

```typescript
  const reorderGeneration = useRef(0);
```

6. After `handleToggle`, add:

```typescript
  const handleReorder = (activeId: string, overId: string) => {
    const current = itemsRef.current;
    const next = reorderFishItems(current, activeId, overId);
    if (next === current) return;

    const generation = reorderGeneration.current + 1;
    reorderGeneration.current = generation;
    itemsRef.current = next;
    replaceAll(next);

    const updates = changedSortOrders(current, next);
    void (async () => {
      try {
        await updateFishSortOrders(updates);
        if (reorderGeneration.current !== generation) return;
        flashRowStatus(activeId, 'Salvato.');
      } catch (err) {
        if (reorderGeneration.current !== generation) return;
        await reload({ silent: true });
        flashRowStatus(
          activeId,
          err instanceof Error ? err.message : 'Errore durante il salvataggio.'
        );
      }
    })();
  };
```

7. Replace the `items.map` block inside `<main className="fish-admin-list">` with:

```tsx
          {items.length > 0 ? (
            <Suspense fallback={<p className="fish-admin-note">Caricamento…</p>}>
              <FishAdminSortableList
                items={items}
                busyIds={busyIds}
                rowStatus={rowStatus}
                onStep={handleStep}
                onPriceCommit={handlePriceCommit}
                onToggleActive={handleToggle}
                onEdit={startEdit}
                onReorder={handleReorder}
              />
            </Suspense>
          ) : null}
```

Keep the loading / error / empty / `_catalog` status paragraphs above it. Do not change `startCreate`.

`handleToggle` today is `(id: string) => void` already — it matches `onToggleActive`. `handleStep` is `(id, direction)` — matches. `startEdit` is `(item: FishItem) => void` — matches.

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npx vitest run src/utils/fishAdmin.test.ts
npx tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/fish-admin/FishAdminSortableList.tsx src/components/FishCatalogAdmin.tsx
git commit -m "feat(banco): reorder vetrina with handle drag-and-drop."
```

---

### Task 6: Portal the ⋯ menu so it is not clipped

**Files:**
- Modify: `src/components/fish-admin/FishAdminHeader.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: existing header callbacks (`onRefresh`, `onImport`, `onLogout`)
- Produces: same menu items, rendered with `createPortal` on `document.body`, `position: fixed`, `z-index: 40`

- [ ] **Step 1: Replace `FishAdminHeader` menu positioning**

Replace `src/components/fish-admin/FishAdminHeader.tsx` with:

```tsx
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';

interface FishAdminHeaderProps {
  count: number;
  busy: boolean;
  onRefresh: () => void;
  onImport: () => void;
  onLogout: () => void;
  onCreate: () => void;
}

export const FishAdminHeader: React.FC<FishAdminHeaderProps> = ({
  count,
  busy,
  onRefresh,
  onImport,
  onLogout,
  onCreate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePanelPos = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPanelPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  };

  useEffect(() => {
    if (!menuOpen) return;

    updatePanelPos();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const onReposition = () => updatePanelPos();

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [menuOpen]);

  const panel = menuOpen
    ? createPortal(
        <div
          ref={panelRef}
          className="fish-admin-menu__panel"
          id={menuId}
          role="menu"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          <Link to="/" role="menuitem" onClick={() => setMenuOpen(false)}>
            Sito
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setMenuOpen(false);
              onRefresh();
            }}
          >
            Aggiorna
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setMenuOpen(false);
              onImport();
            }}
          >
            Importa catalogo
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Esci
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <header className="fish-admin-header">
      <div>
        <h1>Banco</h1>
        <p>
          {count} {count === 1 ? 'pesce' : 'pesci'}
        </p>
      </div>
      <div className="fish-admin-header__actions">
        <div className="fish-admin-menu">
          <button
            ref={buttonRef}
            type="button"
            className="fish-admin-icon-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={20} />
          </button>
          {panel}
        </div>
        <button
          type="button"
          className="fish-admin-icon-btn fish-admin-icon-btn--accent"
          aria-label="Nuovo pesce"
          onClick={onCreate}
        >
          <Plus size={20} />
        </button>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Make the panel `fixed`**

In `src/index.css`, replace `.fish-admin-menu__panel` with:

```css
.fish-admin-menu__panel {
  position: fixed;
  z-index: 40;
  min-width: 12.5rem;
  display: grid;
  padding: 0.35rem;
  border: 1px solid var(--banco-line);
  border-radius: 14px;
  background: var(--banco-card);
  box-shadow: 0 16px 40px rgba(26, 36, 40, 0.12);
}
```

Remove `top: calc(100% + 0.4rem)` and `right: 0` from that rule — those come from inline style.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Manual check (phone-width)**

Run: `npm run dev`

Open `/admin/banco` at 390px width:

- ⋯ menu is fully visible above the first rows, not clipped by the header.
- Drag the handle: rows swap, status flashes “Salvato.” (or error + list reloads if Supabase fails).
- Scroll starting on the row body still scrolls.
- Price, switch, and pencil do not start a drag.
- Editor has no “Ordine in vetrina” field.

- [ ] **Step 5: Commit**

```bash
git add src/components/fish-admin/FishAdminHeader.tsx src/index.css
git commit -m "fix(banco): portal the overflow menu above the catalog list."
```

---

## Spec coverage

| Spec requirement | Task |
|---|---|
| Handle-only drag, 48px, left of photo | 4, 5 |
| Hidden + visible in one list | 5 (same `items` array) |
| Persist on drop, `sort_order` only, `Promise.all` | 2, 5 |
| Optimistic + generation + reload on error | 5 |
| `persistRow` uses live `itemsRef` | 2 |
| Remove editor order field; new fish append | 3 |
| `isFishEditorDirty` ignores `sortOrder` | 1 |
| Lazy `@dnd-kit` after login | 5 |
| 8px activation | 5 |
| Unit tests for reorder / changed / dirty | 1 |
| Portaled ⋯ menu, z-index 40, remeasure on scroll/resize | 6 |
| No schema / RPC / E2E / lucide barrel refactor | Global constraints |

No remaining spec items without a task.

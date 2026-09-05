# Banco vetrina drag-and-drop and overflow menu

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

On `/admin/banco`, vetrina order is a numeric `sortOrder` field inside the fish editor. Staff at the counter use a phone or tablet; typing an index is slow and easy to get wrong. The public catalog already sorts by `sort_order`, then `name`.

The header overflow menu (⋯) opens a dropdown that is clipped or painted under the list. The sticky header uses `backdrop-filter`, which clips overflowing descendants.

## Goals

1. Reorder the full banco list (active and hidden) by dragging a dedicated handle.
2. Persist the new order immediately on drop.
3. Remove the numeric “Ordine in vetrina” field from the editor.
4. Keep price stepper, visibility switch, and edit actions working; they must not start a drag.
5. Load `@dnd-kit` only after admin login, not on the public site.
6. Fix the ⋯ menu so the panel sits above the list and is not clipped.

## Non-goals

- Keyboard-only reorder (touch is the primary input).
- A “Salva ordine” button or deferred/batched save after several moves.
- Separating hidden fish into their own list or pinning them at the bottom.
- Schema changes, new Supabase RPC, or realtime reorder sync across devices.
- E2E tests of pointer gestures.
- Refactoring existing `lucide-react` barrel imports.

## UX

### List

After login, the list is sortable. Each row layout is `handle | photo | body`.

- Handle: grip icon, 48×48 tap target, left of the photo. This is the only drag source.
- Photo, name, pencil, price stepper, and switch keep today’s tap behavior.
- Hidden rows stay in the same list, still dimmed, and can be mixed with visible rows.
- While dragging, the active row lifts slightly; other rows shift to show the drop gap.
- A new fish still appends at the end (`sortOrder = items.length`).

### Editor

Remove the “Ordine in vetrina” number input. Creating or editing a fish no longer changes order except by appending a new item.

`isFishEditorDirty` no longer treats `sortOrder` as a dirty catalog field.

### Overflow menu

Same items: Sito, Aggiorna, Importa catalogo, Esci.

The panel renders in a React portal on `document.body` with `position: fixed`, aligned to the ⋯ button (`getBoundingClientRect`), `z-index` above the sticky header (header is `8`; panel is `40`). Close on outside pointerdown (button and panel are both “inside”). Close or remeasure on viewport resize and on list scroll so the panel cannot detach from the button.

## Architecture

No database migration. `fish_items.sort_order` stays the source of truth. `fetchFishCatalog` already orders by `sort_order`, then `name`.

| Unit | Location | Role |
|------|----------|------|
| `reorderFishItems` | `src/utils/fishAdmin.ts` | Pure: move `activeId` onto `overId`, rewrite `sortOrder` to `0…n-1` |
| `changedSortOrders` | `src/utils/fishAdmin.ts` | Pure: `{ id, sortOrder }[]` for items whose index changed |
| `updateFishSortOrders` | `src/utils/fishCatalog.ts` | Persist those rows; update **only** `sort_order` |
| `replaceAll` | `src/hooks/useFishCatalog.ts` | Replace the in-memory list after a reorder |
| `FishAdminSortableList` | `src/components/fish-admin/FishAdminSortableList.tsx` | `DndContext` + `SortableContext`; lazy-loaded |
| `FishAdminSortableRow` | same file as the list | Module-level wrapper: `useSortable` + handle bindings. Not defined inside another component. |
| `FishAdminRow` | existing | Adds handle slot; does not call `useSortable` |
| `FishAdminHeader` | existing | Portal the ⋯ panel |

`reorderFishItems(items, activeId, overId)`:

- If either id is missing, or both are the same, return `items` unchanged (same array reference).
- Otherwise splice the active item to the over index and map `sortOrder` to the new array index.

`FishAdminSortableList` is a module-level component (not defined inside `FishCatalogAdmin`). `FishCatalogAdmin` loads it with `import()` / `React.lazy` only on the authenticated list screen. Login and editor do not import `@dnd-kit`. Import `DndContext`, sensors, and sortable helpers from `@dnd-kit/core` and `@dnd-kit/sortable` package entries, not from a local barrel.

Pointer sensor is bound to the handle via `useSortable` listeners. Use a small activation distance (8px) so a tap on the handle does not start a drag. Do not make the whole row draggable.

### Persistence

On drop:

1. Compute `next = reorderFishItems(items, activeId, overId)`.
2. If `next === items`, do nothing.
3. Optimistic: `replaceAll(next)` and keep `itemsRef` in sync.
4. `updates = changedSortOrders(items, next)`.
5. `updateFishSortOrders(updates)` issues one Supabase `.update({ sort_order })` per id, started together with `Promise.all`. Do **not** upsert the full row.

A reorder generation token (same pattern as `persistRow`) ignores stale responses if another drop happens before the first persist finishes. The latest drop wins.

If one of the parallel updates fails, `Promise.all` rejects and the client reloads. The server may have applied a prefix of the batch; the next successful drop rewrites every index `0…n-1` and heals. No extra transaction or RPC.

Price debounce and visibility toggle keep using full-row `upsertFishItem`. Reorder never writes `price_per_kg` or `is_active`. When a pending price/toggle flush runs, `persistRow` must upsert the **current** `itemsRef` row for that id (latest `sortOrder` included), not the object captured when the timer was scheduled. That way a drop during the 400ms price debounce cannot be overwritten by the late price upsert.

New dependency: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## Data flow

1. `useFishCatalog({ includeInactive: true })` loads the list already sorted by `sort_order`.
2. User drags a handle and drops on another row.
3. Local list becomes the new order immediately.
4. Only changed `sort_order` values are written.
5. Public `FishMenuCatalog` picks up the order on the next catalog fetch (no live subscription in this work).

## Error handling

If `updateFishSortOrders` rejects:

- Silent `reload({ silent: true })` restores server order.
- Flash the moved row with the existing error status style (`Errore…`), same as a failed price or toggle save.

No retry button. No partial local order left on screen after a failed persist.

## Testing

Extend `src/utils/fishAdmin.test.ts`:

- Middle, first, and last drop rewrite contiguous `sortOrder` values.
- Unknown `activeId` or `overId` returns the same array reference.
- Same id for active and over is a no-op.
- `changedSortOrders` returns only ids whose `sortOrder` changed (a swap of two neighbors yields two ids; an already-ordered no-op yields `[]`).
- `isFishEditorDirty` is false when only `sortOrder` differs from `original`.

Manual check on a phone:

- Vertical scroll still works when the finger starts on the row body.
- Price, switch, and pencil do not start a drag.
- ⋯ menu is fully visible above the first rows and is not clipped by the header.

## Success criteria

- Staff can change vetrina order on `/admin/banco` by dragging the left handle; the public catalog follows that `sort_order` after refresh.
- The editor has no order number field.
- A failed persist rolls back to the server list and shows an error on the moved row.
- The ⋯ menu panel is fully visible above the list on a phone-width viewport.

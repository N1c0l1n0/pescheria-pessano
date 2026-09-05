# Fish Catalog Schema Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and seed `public.fish_items` on the live Supabase project, then make `/admin/banco` fail loudly with Italian errors instead of showing a fake local catalog when the table or a write is missing.

**Architecture:** Pure helpers map Supabase errors and decide fetch fallback. Admin fetch never falls back to defaults. Writes keep the existing full-row upsert and throw mapped messages. The table/bucket/seed live in `docs/supabase/fish_items.sql` and must be run once in the SQL Editor (the anon key cannot `CREATE TABLE`).

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase JS v2.

## Global Constraints

- Do not init `supabase/` or add CLI migrations.
- Do not create the table from the browser.
- Do not tighten RLS or replace the PIN login.
- Do not add editor fields for description, cooking tip, wine pairing, location detail, or in-editor price.
- Do not merge local defaults with remote rows on the public catalog.
- Public fetch keeps `fallbackToDefaults: true`. Admin (`includeInactive: true`) always uses `fallbackToDefaults: false`.
- Seed SQL uses `ON CONFLICT (id) DO NOTHING` so a re-run does not reset live prices.
- Do not `git push` unless the user asks.

## File Structure

- Create: `src/utils/fishCatalogErrors.ts` — map Supabase errors to Italian copy; error-style helper
- Create: `src/utils/fishCatalogErrors.test.ts`
- Modify: `src/utils/fishAdmin.ts` — `normalizeSortOrder`
- Modify: `src/utils/fishAdmin.test.ts`
- Modify: `src/utils/fishCatalog.ts` — fetch options, `resolveFetchedFishCatalog`, mapped write errors
- Create: `src/utils/fishCatalog.test.ts`
- Modify: `src/hooks/useFishCatalog.ts` — pass `fallbackToDefaults: !includeInactive`; clear items on error
- Modify: `src/components/FishCatalogAdmin.tsx` — disable writes on load error; normalize sort on save
- Modify: `src/components/fish-admin/FishAdminHeader.tsx` — `writesDisabled` for create/import
- Modify: `src/components/fish-admin/FishAdminRow.tsx` — `isFishCatalogErrorStatus`
- Modify: `src/components/fish-admin/FishAdminEditor.tsx` — `isFishCatalogErrorStatus`
- Modify: `docs/supabase/fish_items.sql` — idempotent policies + seed of 11 defaults

Do not modify `FishMenuCatalog.tsx`. Public catalog keeps the hook default.

---

### Task 1: Fish catalog error mapper

**Files:**
- Create: `src/utils/fishCatalogErrors.ts`
- Create: `src/utils/fishCatalogErrors.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export const FISH_CATALOG_SETUP_ERROR = 'Catalogo non trovato su Supabase. Esegui docs/supabase/fish_items.sql nel SQL Editor.'`
  - `export const FISH_CATALOG_INVALID_VALUE_ERROR = 'Valore non valido. Controlla prezzo, origine o ordine.'`
  - `export const FISH_CATALOG_STORAGE_ERROR = 'Impossibile caricare la foto. Controlla il bucket fish-images.'`
  - `export const FISH_CATALOG_NETWORK_ERROR = 'Connessione a Supabase non riuscita. Riprova.'`
  - `export type FishCatalogErrorInput = { code?: string | null; message?: string | null; status?: number | null }`
  - `export function mapFishCatalogError(error: FishCatalogErrorInput, kind?: 'table' | 'storage'): string`
  - `export function isFishCatalogErrorStatus(message: string | null | undefined): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/fishCatalogErrors.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  FISH_CATALOG_INVALID_VALUE_ERROR,
  FISH_CATALOG_NETWORK_ERROR,
  FISH_CATALOG_SETUP_ERROR,
  FISH_CATALOG_STORAGE_ERROR,
  isFishCatalogErrorStatus,
  mapFishCatalogError,
} from './fishCatalogErrors';

describe('mapFishCatalogError', () => {
  it('maps schema-cache and PGRST205 to the setup copy', () => {
    expect(
      mapFishCatalogError({
        code: 'PGRST205',
        message: "Could not find the table 'public.fish_items' in the schema cache",
      })
    ).toBe(FISH_CATALOG_SETUP_ERROR);
    expect(
      mapFishCatalogError({
        message: "Could not find the table 'public.fish_items' in the schema cache",
      })
    ).toBe(FISH_CATALOG_SETUP_ERROR);
  });

  it('maps check and invalid-input codes to the invalid-value copy', () => {
    expect(mapFishCatalogError({ code: '23514', message: 'check constraint' })).toBe(
      FISH_CATALOG_INVALID_VALUE_ERROR
    );
    expect(mapFishCatalogError({ code: '22P02', message: 'invalid input syntax' })).toBe(
      FISH_CATALOG_INVALID_VALUE_ERROR
    );
  });

  it('maps network failures', () => {
    expect(mapFishCatalogError({ message: 'Failed to fetch' })).toBe(FISH_CATALOG_NETWORK_ERROR);
    expect(mapFishCatalogError({ status: 503, message: 'Service unavailable' })).toBe(
      FISH_CATALOG_NETWORK_ERROR
    );
  });

  it('prefixes unknown table errors', () => {
    expect(mapFishCatalogError({ message: 'permission denied' })).toBe(
      'Errore database: permission denied'
    );
  });

  it('maps storage failures to the photo copy', () => {
    expect(mapFishCatalogError({ message: 'Bucket not found' }, 'storage')).toBe(
      FISH_CATALOG_STORAGE_ERROR
    );
  });
});

describe('isFishCatalogErrorStatus', () => {
  it('treats an English schema-cache message as an error', () => {
    expect(
      isFishCatalogErrorStatus("Could not find the table 'public.fish_items' in the schema cache")
    ).toBe(true);
  });

  it('treats mapped Italian errors as errors and success copy as not', () => {
    expect(isFishCatalogErrorStatus(FISH_CATALOG_SETUP_ERROR)).toBe(true);
    expect(isFishCatalogErrorStatus('Errore database: permission denied')).toBe(true);
    expect(isFishCatalogErrorStatus('Salvato.')).toBe(false);
    expect(isFishCatalogErrorStatus('Foto caricata.')).toBe(false);
    expect(isFishCatalogErrorStatus('Importati 11 prodotti predefiniti.')).toBe(false);
    expect(isFishCatalogErrorStatus(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/fishCatalogErrors.test.ts`

Expected: FAIL — cannot find module `./fishCatalogErrors`

- [ ] **Step 3: Write the implementation**

Create `src/utils/fishCatalogErrors.ts`:

```typescript
export const FISH_CATALOG_SETUP_ERROR =
  'Catalogo non trovato su Supabase. Esegui docs/supabase/fish_items.sql nel SQL Editor.';

export const FISH_CATALOG_INVALID_VALUE_ERROR =
  'Valore non valido. Controlla prezzo, origine o ordine.';

export const FISH_CATALOG_STORAGE_ERROR =
  'Impossibile caricare la foto. Controlla il bucket fish-images.';

export const FISH_CATALOG_NETWORK_ERROR = 'Connessione a Supabase non riuscita. Riprova.';

export type FishCatalogErrorInput = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

function isNetworkError(error: FishCatalogErrorInput): boolean {
  const status = error.status ?? 0;
  const lower = (error.message ?? '').toLowerCase();
  return (
    status >= 500 ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('timeout')
  );
}

export function mapFishCatalogError(
  error: FishCatalogErrorInput,
  kind: 'table' | 'storage' = 'table'
): string {
  const code = error.code ?? '';
  const message = error.message ?? '';
  const lower = message.toLowerCase();

  if (kind === 'storage') {
    if (isNetworkError(error)) return FISH_CATALOG_NETWORK_ERROR;
    return FISH_CATALOG_STORAGE_ERROR;
  }

  if (
    code === 'PGRST205' ||
    lower.includes('schema cache') ||
    lower.includes('could not find the table')
  ) {
    return FISH_CATALOG_SETUP_ERROR;
  }

  if (code === '23514' || code === '22P02' || lower.includes('check constraint')) {
    return FISH_CATALOG_INVALID_VALUE_ERROR;
  }

  if (isNetworkError(error)) return FISH_CATALOG_NETWORK_ERROR;

  return `Errore database: ${message || 'operazione non riuscita'}`;
}

export function isFishCatalogErrorStatus(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.startsWith('salvato') || lower.startsWith('foto caricata') || lower.startsWith('importati')) {
    return false;
  }
  return (
    lower.includes('errore') ||
    lower.includes('schema cache') ||
    lower.includes('catalogo non trovato') ||
    lower.includes('valore non valido') ||
    lower.includes('impossibile caricare') ||
    lower.includes('connessione a supabase')
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/fishCatalogErrors.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishCatalogErrors.ts src/utils/fishCatalogErrors.test.ts
git commit -m "$(cat <<'EOF'
feat(fish): map Supabase catalog errors to Italian copy.

EOF
)"
```

---

### Task 2: Normalize editor sort order

**Files:**
- Modify: `src/utils/fishAdmin.ts`
- Modify: `src/utils/fishAdmin.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `export function normalizeSortOrder(value: unknown): number` — `NaN` / empty / negative → `0`; `4.8` → `4`

- [ ] **Step 1: Write the failing test**

Append to `src/utils/fishAdmin.test.ts` imports:

```typescript
  normalizeSortOrder,
```

Add it to the existing import from `./fishAdmin`. Then append:

```typescript
describe('normalizeSortOrder', () => {
  it('clamps empty, NaN, and negative values to 0 and floors decimals', () => {
    expect(normalizeSortOrder('')).toBe(0);
    expect(normalizeSortOrder(Number.NaN)).toBe(0);
    expect(normalizeSortOrder(-3)).toBe(0);
    expect(normalizeSortOrder(4.8)).toBe(4);
    expect(normalizeSortOrder(2)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/fishAdmin.test.ts`

Expected: FAIL — `normalizeSortOrder` is not exported

- [ ] **Step 3: Write the implementation**

Append to `src/utils/fishAdmin.ts`:

```typescript
export function normalizeSortOrder(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/fishAdmin.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishAdmin.ts src/utils/fishAdmin.test.ts
git commit -m "$(cat <<'EOF'
feat(fish): clamp admin sort order before save.

EOF
)"
```

---

### Task 3: Split public vs admin fetch fallback

**Files:**
- Modify: `src/utils/fishCatalog.ts`
- Create: `src/utils/fishCatalog.test.ts`
- Modify: `src/hooks/useFishCatalog.ts`

**Interfaces:**
- Consumes: `mapFishCatalogError` from `./fishCatalogErrors`; `FISH_CATALOG_DEFAULTS`; `rowToFishItem`
- Produces:
  - `export interface FetchFishCatalogOptions { includeInactive?: boolean; fallbackToDefaults?: boolean }`
  - `export function resolveFetchedFishCatalog(params: { error: FishCatalogErrorInput | null; data: FishItemRow[] | null; includeInactive: boolean; fallbackToDefaults: boolean }): FishItem[]`
  - `export async function fetchFishCatalog(options?: FetchFishCatalogOptions): Promise<FishItem[]>`
  - Hook calls `fetchFishCatalog({ includeInactive, fallbackToDefaults: !includeInactive })` and `setItems([])` on catch

- [ ] **Step 1: Write the failing tests**

Create `src/utils/fishCatalog.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { FISH_CATALOG_DEFAULTS } from '../data/fishCatalogDefaults';
import { FISH_CATALOG_SETUP_ERROR } from './fishCatalogErrors';
import { resolveFetchedFishCatalog } from './fishCatalog';
import type { FishItemRow } from '../types/fishCatalog';

const branzinoRow: FishItemRow = {
  id: 'branzino',
  name: 'Branzino',
  origin: 'Mar Ligure',
  location_detail: '',
  price_per_kg: 50,
  image_url: '/pesce/branzino.jpg',
  description: '',
  cooking_tip: '',
  wine_pairing: '',
  is_popular: true,
  is_active: true,
  sort_order: 7,
};

describe('resolveFetchedFishCatalog', () => {
  it('returns defaults when fallback is on and the query errors', () => {
    const items = resolveFetchedFishCatalog({
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.fish_items' in the schema cache",
      },
      data: null,
      includeInactive: false,
      fallbackToDefaults: true,
    });
    expect(items).toEqual(FISH_CATALOG_DEFAULTS.filter((item) => item.isActive !== false));
  });

  it('returns defaults when fallback is on and data is empty', () => {
    const items = resolveFetchedFishCatalog({
      error: null,
      data: [],
      includeInactive: true,
      fallbackToDefaults: true,
    });
    expect(items).toEqual(FISH_CATALOG_DEFAULTS);
  });

  it('throws a mapped setup error when fallback is off and the query errors', () => {
    expect(() =>
      resolveFetchedFishCatalog({
        error: {
          code: 'PGRST205',
          message: "Could not find the table 'public.fish_items' in the schema cache",
        },
        data: null,
        includeInactive: true,
        fallbackToDefaults: false,
      })
    ).toThrow(FISH_CATALOG_SETUP_ERROR);
  });

  it('returns an empty list when fallback is off and data is empty', () => {
    expect(
      resolveFetchedFishCatalog({
        error: null,
        data: [],
        includeInactive: true,
        fallbackToDefaults: false,
      })
    ).toEqual([]);
  });

  it('maps remote rows when the query succeeds', () => {
    const items = resolveFetchedFishCatalog({
      error: null,
      data: [branzinoRow],
      includeInactive: true,
      fallbackToDefaults: false,
    });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('branzino');
    expect(items[0].pricePerKg).toBe(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/fishCatalog.test.ts`

Expected: FAIL — `resolveFetchedFishCatalog` is not exported

- [ ] **Step 3: Implement resolve + fetch options + hook**

Replace the top of `src/utils/fishCatalog.ts` (imports through `fetchFishCatalog`) with:

```typescript
import { supabase } from '../lib/supabase';
import { FISH_CATALOG_DEFAULTS } from '../data/fishCatalogDefaults';
import {
  type FishItem,
  type FishItemRow,
  fishItemToRow,
  rowToFishItem,
} from '../types/fishCatalog';
import {
  type FishCatalogErrorInput,
  mapFishCatalogError,
} from './fishCatalogErrors';

const FISH_STORAGE_BUCKET = 'fish-images';

export interface FetchFishCatalogOptions {
  includeInactive?: boolean;
  fallbackToDefaults?: boolean;
}

export function resolveFetchedFishCatalog(params: {
  error: FishCatalogErrorInput | null;
  data: FishItemRow[] | null;
  includeInactive: boolean;
  fallbackToDefaults: boolean;
}): FishItem[] {
  const { error, data, includeInactive, fallbackToDefaults } = params;

  if (error) {
    if (!fallbackToDefaults) {
      throw new Error(mapFishCatalogError(error));
    }
    return FISH_CATALOG_DEFAULTS.filter((item) => includeInactive || item.isActive !== false);
  }

  if (!data || data.length === 0) {
    if (!fallbackToDefaults) return [];
    return FISH_CATALOG_DEFAULTS.filter((item) => includeInactive || item.isActive !== false);
  }

  return data.map(rowToFishItem);
}

export async function fetchFishCatalog(
  options: FetchFishCatalogOptions = {}
): Promise<FishItem[]> {
  const includeInactive = options.includeInactive ?? false;
  const fallbackToDefaults = options.fallbackToDefaults ?? true;

  let query = supabase
    .from('fish_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  return resolveFetchedFishCatalog({
    error,
    data: data as FishItemRow[] | null,
    includeInactive,
    fallbackToDefaults,
  });
}
```

Leave `upsertFishItem` and the rest of the file unchanged in this task.

In `src/hooks/useFishCatalog.ts` replace the `reload` callback body:

```typescript
  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const catalog = await fetchFishCatalog({
        includeInactive,
        fallbackToDefaults: !includeInactive,
      });
      setItems(catalog);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'Errore caricamento catalogo pesce');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/fishCatalog.test.ts src/utils/fishCatalogErrors.test.ts src/utils/fishAdmin.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishCatalog.ts src/utils/fishCatalog.test.ts src/hooks/useFishCatalog.ts
git commit -m "$(cat <<'EOF'
feat(fish): stop admin catalog fallback on fetch errors.

EOF
)"
```

---

### Task 4: Map write and upload errors

**Files:**
- Modify: `src/utils/fishCatalog.ts`
- Modify: `src/components/FishCatalogAdmin.tsx`

**Interfaces:**
- Consumes: `mapFishCatalogError`, `normalizeSortOrder`
- Produces: `upsertFishItem`, `deleteFishItem`, and `seedFishCatalogFromDefaults` throw `mapFishCatalogError(error)`; `uploadFishImage` throws `mapFishCatalogError(uploadError, 'storage')`; editor save writes `sortOrder: normalizeSortOrder(draft.sortOrder)`

- [ ] **Step 1: Replace raw `error.message` throws in `fishCatalog.ts`**

In `upsertFishItem`:

```typescript
  if (error) {
    throw new Error(mapFishCatalogError(error));
  }
```

In `deleteFishItem`:

```typescript
  if (error) {
    throw new Error(mapFishCatalogError(error));
  }
```

In `seedFishCatalogFromDefaults`:

```typescript
  if (error) {
    throw new Error(mapFishCatalogError(error));
  }
```

In `uploadFishImage`:

```typescript
  if (uploadError) {
    throw new Error(mapFishCatalogError(uploadError, 'storage'));
  }
```

`mapFishCatalogError` is already imported from Task 3.

- [ ] **Step 2: Normalize sort order on editor save**

In `src/components/FishCatalogAdmin.tsx` add `normalizeSortOrder` to the `fishAdmin` import. In `handleEditorSave` pass:

```typescript
      const saved = await upsertFishItem({
        ...draft,
        id,
        name: draft.name.trim(),
        sortOrder: normalizeSortOrder(draft.sortOrder),
      });
```

- [ ] **Step 3: Run unit tests**

Run: `npx vitest run src/utils/fishCatalog.test.ts src/utils/fishCatalogErrors.test.ts src/utils/fishAdmin.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/utils/fishCatalog.ts src/components/FishCatalogAdmin.tsx
git commit -m "$(cat <<'EOF'
feat(fish): surface mapped errors on catalog writes.

EOF
)"
```

---

### Task 5: Admin UI fail-loud

**Files:**
- Modify: `src/components/fish-admin/FishAdminHeader.tsx`
- Modify: `src/components/fish-admin/FishAdminRow.tsx`
- Modify: `src/components/fish-admin/FishAdminEditor.tsx`
- Modify: `src/components/FishCatalogAdmin.tsx`

**Interfaces:**
- Consumes: `isFishCatalogErrorStatus`
- Produces: `FishAdminHeader` accepts `writesDisabled?: boolean` and disables Import + Nuovo when true. List hides the empty-create hint when `error` is set. Status lines use `isFishCatalogErrorStatus`.

- [ ] **Step 1: Add `writesDisabled` to the header**

Change the props interface and destructure:

```typescript
interface FishAdminHeaderProps {
  count: number;
  busy: boolean;
  writesDisabled?: boolean;
  onRefresh: () => void;
  onImport: () => void;
  onLogout: () => void;
  onCreate: () => void;
}

export const FishAdminHeader: React.FC<FishAdminHeaderProps> = ({
  count,
  busy,
  writesDisabled = false,
  onRefresh,
  onImport,
  onLogout,
  onCreate,
}) => {
```

Import button: `disabled={busy || writesDisabled}`

Create button: `disabled={writesDisabled}` and keep `onClick={onCreate}`

Refresh and logout stay enabled.

- [ ] **Step 2: Use the error-style helper in row, editor, and catalog banner**

`FishAdminRow.tsx` — import `isFishCatalogErrorStatus` from `../../utils/fishCatalogErrors` and replace:

```typescript
  const statusError = isFishCatalogErrorStatus(status);
```

`FishAdminEditor.tsx` — import `isFishCatalogErrorStatus` from `../../utils/fishCatalogErrors` and replace:

```typescript
  const statusError = isFishCatalogErrorStatus(status);
```

In `FishCatalogAdmin.tsx` import `isFishCatalogErrorStatus`. Pass `writesDisabled={Boolean(error)}` to `FishAdminHeader`. Guard `startCreate` and `handleImport`:

```typescript
  const startCreate = () => {
    if (error) return;
    setCreating(true);
    setOriginal(null);
    setDraft({ ...EMPTY_FISH_ITEM, sortOrder: itemsRef.current.length });
    setEditorStatus(null);
    setScreen('edit');
  };
```

```typescript
  const handleImport = async () => {
    if (error) return;
    if (!window.confirm('Importare il catalogo predefinito? I prodotti con lo stesso nome verranno sovrascritti.')) {
      return;
    }
```

Replace the `_catalog` className check and the empty-list condition:

```typescript
          {rowStatus._catalog ? (
            <p
              className={`fish-admin-status${isFishCatalogErrorStatus(rowStatus._catalog) ? ' fish-admin-status--error' : ''}`}
            >
              {rowStatus._catalog}
            </p>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <p className="fish-admin-empty">Nessun pesce. Tocca + per aggiungerne uno.</p>
          ) : null}
```

The existing `{error ? <p className="fish-admin-status fish-admin-status--error">{error}</p> : null}` stays.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/fish-admin/FishAdminHeader.tsx src/components/fish-admin/FishAdminRow.tsx src/components/fish-admin/FishAdminEditor.tsx src/components/FishCatalogAdmin.tsx
git commit -m "$(cat <<'EOF'
feat(fish): disable banco writes when catalog load fails.

EOF
)"
```

---

### Task 6: Idempotent SQL + default seed

**Files:**
- Modify: `docs/supabase/fish_items.sql`

**Interfaces:**
- Consumes: the 11 rows in `src/data/fishCatalogDefaults.ts`
- Produces: re-runnable script that creates `public.fish_items`, `fish-images`, policies, and seeds defaults with `ON CONFLICT (id) DO NOTHING`

- [ ] **Step 1: Replace `docs/supabase/fish_items.sql` with this exact file**

```sql
-- Supabase setup for fish catalog management
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Project: amerjacymzhmnmzulakt

create table if not exists public.fish_items (
  id text primary key,
  name text not null,
  origin text not null check (origin in ('Mar Ligure', 'Medit. Occ.')),
  location_detail text not null default '',
  price_per_kg numeric(10, 2) not null check (price_per_kg >= 0),
  image_url text not null,
  description text not null default '',
  cooking_tip text not null default '',
  wine_pairing text not null default '',
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists fish_items_active_sort_idx
  on public.fish_items (is_active, sort_order, name);

alter table public.fish_items enable row level security;

drop policy if exists "Public read active fish items" on public.fish_items;
drop policy if exists "Public read all fish items for admin" on public.fish_items;
drop policy if exists "Public insert fish items" on public.fish_items;
drop policy if exists "Public update fish items" on public.fish_items;
drop policy if exists "Public delete fish items" on public.fish_items;

create policy "Public read active fish items"
  on public.fish_items
  for select
  using (is_active = true);

create policy "Public read all fish items for admin"
  on public.fish_items
  for select
  using (true);

create policy "Public insert fish items"
  on public.fish_items
  for insert
  with check (true);

create policy "Public update fish items"
  on public.fish_items
  for update
  using (true)
  with check (true);

create policy "Public delete fish items"
  on public.fish_items
  for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('fish-images', 'fish-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read fish images" on storage.objects;
drop policy if exists "Public upload fish images" on storage.objects;
drop policy if exists "Public update fish images" on storage.objects;
drop policy if exists "Public delete fish images" on storage.objects;

create policy "Public read fish images"
  on storage.objects
  for select
  using (bucket_id = 'fish-images');

create policy "Public upload fish images"
  on storage.objects
  for insert
  with check (bucket_id = 'fish-images');

create policy "Public update fish images"
  on storage.objects
  for update
  using (bucket_id = 'fish-images')
  with check (bucket_id = 'fish-images');

create policy "Public delete fish images"
  on storage.objects
  for delete
  using (bucket_id = 'fish-images');

insert into public.fish_items (
  id, name, origin, location_detail, price_per_kg, image_url,
  description, cooking_tip, wine_pairing, is_popular, is_active, sort_order
) values
  ('acciughe', 'Acciughe del Golfo', 'Mar Ligure', '', 18.00, '/pesce/acciughe.jpg', '', '', '', true, true, 0),
  ('tonno-pinna-gialla', 'Tonno Pinna Gialla', 'Mar Ligure', '', 44.00, '/pesce/tonno_pinna_gialla.jpg', '', '', '', true, true, 1),
  ('pescatrice', 'Rana Pescatrice (Coda di Rospo)', 'Mar Ligure', '', 28.00, '/pesce/pescatrice.jpg', '', '', '', true, true, 2),
  ('polpo', 'Polpo Verace del Golfo', 'Mar Ligure', '', 34.00, '/pesce/polpo.jpg', '', '', '', true, true, 3),
  ('triglia', 'Triglia di Scoglio Nostrana', 'Mar Ligure', '', 34.00, '/pesce/triglia.jpg', '', '', '', false, true, 4),
  ('nasello', 'Nasello Fresco di Paranza', 'Mar Ligure', '', 38.00, '/pesce/nasello.jpg', '', '', '', false, true, 5),
  ('calamari', 'Calamari Veraci Nostrani', 'Medit. Occ.', '', 42.00, '/pesce/calamari.jpg', '', '', '', true, true, 6),
  ('branzino', 'Branzino Selvaggio del Golfo', 'Mar Ligure', '', 50.00, '/pesce/branzino.jpg', '', '', '', true, true, 7),
  ('pesce-spada', 'Pesce Spada del Golfo', 'Mar Ligure', '', 50.00, '/pesce/pesce_spada.jpg', '', '', '', true, true, 8),
  ('orata', 'Orata di Mare Nostrana', 'Mar Ligure', '', 56.00, '/pesce/orata.jpg', '', '', '', true, true, 9),
  ('rombo', 'Rombo Chiodato del Mediterraneo', 'Medit. Occ.', '', 58.00, '/pesce/rombo.jpg', '', '', '', true, true, 10)
on conflict (id) do nothing;
```

- [ ] **Step 2: Confirm the seed has 11 ids matching defaults**

Run:

```bash
node -e "const {FISH_CATALOG_DEFAULTS}=require('./src/data/fishCatalogDefaults.ts')"
```

Do not use that (TS). Instead run:

```bash
python3 - <<'PY'
from pathlib import Path
sql = Path('docs/supabase/fish_items.sql').read_text()
defaults = Path('src/data/fishCatalogDefaults.ts').read_text()
ids = ['acciughe','tonno-pinna-gialla','pescatrice','polpo','triglia','nasello','calamari','branzino','pesce-spada','orata','rombo']
missing_sql = [i for i in ids if f"('{i}'" not in sql]
missing_ts = [i for i in ids if f"id: '{i}'" not in defaults]
print('missing_sql', missing_sql)
print('missing_ts', missing_ts)
print('sql_seed_ok', 'on conflict (id) do nothing' in sql.lower())
print('drops', sql.count('drop policy if exists'))
PY
```

Expected:

```
missing_sql []
missing_ts []
sql_seed_ok True
drops 9
```

- [ ] **Step 3: Commit**

```bash
git add docs/supabase/fish_items.sql
git commit -m "$(cat <<'EOF'
docs(supabase): seed fish_items and make policies re-runnable.

EOF
)"
```

- [ ] **Step 4: Manual apply (human, required for the price save to work)**

In Supabase Dashboard → SQL → New query, paste the whole file and run it on project `amerjacymzhmnmzulakt`. Then: open `/admin/banco`, confirm 11 pesci load from the network (no setup banner), change one price, reload admin and the public catalog — the new price stays.

If the script was not run, `/admin/banco` must show `FISH_CATALOG_SETUP_ERROR` and refuse writes.

---

## Self-review

1. Spec coverage: setup SQL + seed (Task 6); fetch split + clear items (Task 3); mapped writes (Task 4); admin fail-loud UI (Task 5); mapper + style helper (Task 1); sort clamp (Task 2). Public fallback unchanged. Non-goals not scheduled.
2. No TBD/TODO placeholders. SQL seed lists all 11 rows. Signatures are named once in Task 1/3 and reused.
3. Types: `FishCatalogErrorInput`, `FetchFishCatalogOptions`, `resolveFetchedFishCatalog`, `mapFishCatalogError(error, kind?)`, `normalizeSortOrder`, `isFishCatalogErrorStatus` stay consistent across tasks.

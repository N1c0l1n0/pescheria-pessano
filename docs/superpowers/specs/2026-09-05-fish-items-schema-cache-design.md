# Fish catalog admin: missing `fish_items` table

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

Changing a price on `/admin/banco` fails with `Could not find the table 'public.fish_items' in the schema cache` (`PGRST205`). The table does not exist on project `amerjacymzhmnmzulakt` (`orders` / `order_items` do). Admin still shows a full list because `fetchFishCatalog` swallows errors and empty results and returns `FISH_CATALOG_DEFAULTS`. The first successful single-row upsert, if the table were created empty, would make the public catalog show only that one fish.

## Goals

1. Create `public.fish_items` and bucket `fish-images` on the live project, then seed the 11 default catalog rows immediately.
2. After that, price, visibility, editor save, delete, import, and photo upload persist and survive reload.
3. `/admin/banco` never shows the local default catalog when the remote read fails. It shows a clear Italian error and disables writes.
4. Every Supabase read/write error on the fish catalog is mapped to a readable Italian message and styled as an error (not only when the text contains `errore`).

## Non-goals

- Tighter RLS or replacing the PIN login.
- New editor fields (description, cooking tip, wine pairing, location detail, price-in-editor).
- Merging local defaults with remote rows on every public fetch.
- Supabase CLI migrations / `supabase/` project init.
- Creating the table from the browser (anon key cannot `CREATE TABLE`).

## Database setup (manual, once)

Run the updated `docs/supabase/fish_items.sql` in the Supabase SQL Editor of `amerjacymzhmnmzulakt`.

The script must:

- `CREATE TABLE IF NOT EXISTS public.fish_items` with the current columns (`id`, `name`, `origin` check `Mar Ligure` | `Medit. Occ.`, `location_detail`, `price_per_kg >= 0`, `image_url`, `description`, `cooking_tip`, `wine_pairing`, `is_popular`, `is_active`, `sort_order`, `updated_at`).
- Index, RLS, and the existing four DML policies plus storage policies for `fish-images`.
- Be re-runnable: `DROP POLICY IF EXISTS` before each `CREATE POLICY`.
- `INSERT` the 11 rows from `FISH_CATALOG_DEFAULTS` with `ON CONFLICT (id) DO NOTHING` so a re-run does not reset live prices.
- Create/update the public `fish-images` bucket as today.

No app deploy can replace this step.

## Fetch split

`fetchFishCatalog` gains `fallbackToDefaults` (default `true`).

`useFishCatalog` always passes `fallbackToDefaults: !includeInactive`. Public (`includeInactive` false) keeps defaults. Admin (`includeInactive` true) never does.

| Caller | `includeInactive` | `fallbackToDefaults` | On error or empty |
| --- | --- | --- | --- |
| Public catalog (`useFishCatalog()`) | `false` | `true` | Return active defaults. No banner. |
| Admin (`useFishCatalog({ includeInactive: true })`) | `true` | `false` | Throw. Hook `error` is set. No defaults. |

Empty admin list after a successful read (table exists, 0 rows) is not a throw. Admin shows the empty-catalog copy and the existing Import action.

## Writes

Keep one full-row `upsert` on `id` for price stepper, visibility toggle, and editor save. `fishItemToRow` / `rowToFishItem` stay as they are. Fields not in the editor remain on the draft and are written through.

Before upsert from the editor, `sortOrder` is normalized to an integer `>= 0` (`NaN`, empty, negative → `0`; `4.8` → `4`).

Photo upload still writes to Storage first; the public URL stays on the draft until Salva.

## Error mapping

One helper maps Supabase errors for fetch (admin), upsert, delete, seed, and upload:

| Signal | Admin copy |
| --- | --- |
| `PGRST205`, message contains `schema cache`, or table missing | Catalogo non trovato su Supabase. Esegui `docs/supabase/fish_items.sql` nel SQL Editor. |
| Check / invalid input (`23514`, `22P02`, origin or price check) | Valore non valido. Controlla prezzo, origine o ordine. |
| Storage bucket missing or upload failure | Impossibile caricare la foto. Controlla il bucket `fish-images`. |
| Network / 5xx / timeout | Connessione a Supabase non riuscita. Riprova. |
| Anything else | `Errore database: ` + original `message` |

UI rules:

- Load failure: red banner, empty list, disable stepper, toggle, editor, create, import.
- Write failure: red status on the row or editor (helper, not `includes('errore')`), then silent reload to resync.
- Write success: `Salvato.` as today.

## Testing

Vitest only, next to `fishAdmin.test.ts`:

- Mapper covers schema-cache, check-constraint, and generic prefix cases.
- `fetchFishCatalog` with `fallbackToDefaults: false` propagates errors; with `true` and error/empty data returns defaults.
- `normalizeSortOrder` as specified above.
- Error-style helper treats an English schema-cache message as an error.

No E2E of the SQL Editor. Manual check after the script: change a price, reload `/admin/banco` and the public catalog, the new price stays.

## Files

- `docs/supabase/fish_items.sql` — idempotent policies + seed.
- `src/utils/fishCatalog.ts` — fetch option + mapped write errors.
- `src/utils/fishAdmin.ts` — `normalizeSortOrder`.
- `src/utils/fishCatalogErrors.ts` — Supabase → Italian copy and error-style helper.
- `src/hooks/useFishCatalog.ts` — pass `fallbackToDefaults: !includeInactive`.
- `src/components/FishCatalogAdmin.tsx` — disable writes on load error; pass mapped messages.
- `src/components/fish-admin/FishAdminRow.tsx` / `FishAdminEditor.tsx` — error styling helper.
- Tests beside the helpers.

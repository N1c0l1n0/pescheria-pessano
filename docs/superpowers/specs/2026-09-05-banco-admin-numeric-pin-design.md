# Banco admin numeric PIN

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Problem

`/admin/banco` login uses `inputMode="numeric"`, so phones show a number keypad. The PIN fallback is `pessano2026` (letters + digits). Staff on a phone cannot type the letters.

## Goals

1. Accept only digits in the PIN field. Letters, spaces, and symbols never appear in the value.
2. Keep the number keypad on mobile (`inputMode="numeric"`) and keep the value masked (`type="password"`).
3. Change the code fallback PIN from `pessano2026` to `2134`.
4. Keep Entra, the `PIN non valido` error, session storage, and logout as they are.

## Non-goals

- On-screen digit pad.
- Fixed PIN length or auto-submit.
- Different PINs for desktop and mobile.
- Lockout after failed attempts.
- Supabase / RLS changes.
- E2E tests of the login screen.

## PIN source

`getAdminPin()` stays: `VITE_FISH_ADMIN_PIN` if set, otherwise the code fallback.

Fallback changes from `pessano2026` to `2134`.

If production or local env still has `VITE_FISH_ADMIN_PIN` set to the old value, that value wins. Update it to `2134` wherever it is set. There is no `.env` in the repo today.

## Login behavior

The login screen layout does not change: lock mark, title Banco, PIN field, Entra.

| Action | Result |
| --- | --- |
| Type or paste | Keep digits only (`"21a 34"` → `2134`) |
| Length | Unbounded |
| Submit | Existing form + Entra. No auto-submit |
| Wrong PIN | `PIN non valido` |
| Right PIN | Existing `authenticateAdmin` + `sessionStorage` `fish_admin_auth=1` |

Empty submit is a wrong PIN (`PIN non valido`).

## Implementation

**Touch:**

- `src/components/fish-admin/FishAdminLogin.tsx` — strip non-digits in `onChange`; keep `type="password"` and `inputMode="numeric"`.
- `src/utils/fishCatalog.ts` — fallback `'2134'`; add `digitsOnly(value: string): string` next to the PIN helpers.
- `src/utils/fishCatalog.test.ts` — unit tests for `digitsOnly` only.

Do not change `authenticateAdmin` comparison, `isAdminAuthenticated`, or `logoutAdmin`.

## Testing

Unit test `digitsOnly`:

- `"2134"` → `"2134"`
- `"21a 34"` → `"2134"`
- `""` → `""`

Manual check on a phone: number keypad, Entra with `2134` opens the banco list.

## Success

Staff on a phone can sign in to `/admin/banco` with `2134` using only the number keypad. Desktop uses the same PIN and the same digit-only field.

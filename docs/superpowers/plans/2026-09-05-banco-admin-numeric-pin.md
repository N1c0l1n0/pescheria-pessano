# Banco Admin Numeric PIN Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff sign in to `/admin/banco` with numeric PIN `2134` using the phone number keypad.

**Architecture:** Add a pure `digitsOnly` helper next to the existing PIN helpers in `fishCatalog.ts`. The login field keeps `type="password"` and `inputMode="numeric"`, and runs `digitsOnly` on every `onChange`. Change the code fallback from `pessano2026` to `2134`. Do not change `authenticateAdmin`, session storage, or logout.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest.

## Global Constraints

- PIN field stays `type="password"` and `inputMode="numeric"`.
- Code fallback PIN is `2134` (replaces `pessano2026`).
- `VITE_FISH_ADMIN_PIN` still wins when set — update it to `2134` wherever it exists outside the repo.
- Login layout unchanged: lock mark, title Banco, PIN field, Entra.
- Wrong / empty PIN still shows `PIN non valido`.
- No auto-submit, no fixed length, no on-screen digit pad, no lockout.
- Do not change `authenticateAdmin` comparison, `isAdminAuthenticated`, or `logoutAdmin`.
- No E2E tests. No Supabase / RLS changes.

## File Structure

- Create: `src/utils/fishCatalog.test.ts` — unit tests for `digitsOnly` only
- Modify: `src/utils/fishCatalog.ts` — add `digitsOnly`; change `getAdminPin` fallback to `'2134'`
- Modify: `src/components/fish-admin/FishAdminLogin.tsx` — import `digitsOnly`; strip non-digits in `onChange`

---

### Task 1: `digitsOnly` helper

**Files:**
- Create: `src/utils/fishCatalog.test.ts`
- Modify: `src/utils/fishCatalog.ts:110-113` — insert `digitsOnly` immediately above `getAdminPin`

**Interfaces:**
- Consumes: nothing
- Produces: `digitsOnly(value: string): string` — returns only ASCII digits `0-9`, in order; empty string stays empty

- [ ] **Step 1: Write the failing test**

Create `src/utils/fishCatalog.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { digitsOnly } from './fishCatalog';

describe('digitsOnly', () => {
  it('keeps an already numeric PIN', () => {
    expect(digitsOnly('2134')).toBe('2134');
  });

  it('strips letters and spaces', () => {
    expect(digitsOnly('21a 34')).toBe('2134');
  });

  it('returns empty string for empty input', () => {
    expect(digitsOnly('')).toBe('');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/utils/fishCatalog.test.ts`

Expected: FAIL — `digitsOnly` is not exported from `./fishCatalog`.

- [ ] **Step 3: Write the minimal implementation**

In `src/utils/fishCatalog.ts`, insert this function immediately above `getAdminPin`:

```typescript
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
```

Do not change `getAdminPin`, `authenticateAdmin`, `isAdminAuthenticated`, or `logoutAdmin` in this task.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/utils/fishCatalog.test.ts`

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishCatalog.ts src/utils/fishCatalog.test.ts
git commit -m "feat(banco): add digitsOnly helper for admin PIN"
```

---

### Task 2: Fallback PIN and login field

**Files:**
- Modify: `src/utils/fishCatalog.ts` — `getAdminPin` fallback only
- Modify: `src/components/fish-admin/FishAdminLogin.tsx`

**Interfaces:**
- Consumes: `digitsOnly(value: string): string` from Task 1
- Produces: login `onChange` stores `digitsOnly(e.target.value)`; `getAdminPin()` fallback is `'2134'`

- [ ] **Step 1: Change the fallback PIN**

In `src/utils/fishCatalog.ts`, change only the fallback string in `getAdminPin`:

```typescript
export function getAdminPin(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.VITE_FISH_ADMIN_PIN || '2134';
}
```

Leave the env read and the rest of the function unchanged.

- [ ] **Step 2: Wire the login field**

In `src/components/fish-admin/FishAdminLogin.tsx`, change the import to:

```typescript
import { authenticateAdmin, digitsOnly } from '../../utils/fishCatalog';
```

Change only the input `onChange` (keep `type="password"`, `inputMode="numeric"`, `autoFocus`, `autoComplete`, submit handler, and error copy):

```tsx
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(digitsOnly(e.target.value))}
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
            />
```

`handleLogin` stays:

```typescript
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (authenticateAdmin(pin.trim())) {
      onSuccess();
      return;
    }
    setPinError('PIN non valido');
  };
```

- [ ] **Step 3: Run unit tests**

Run: `npm test -- src/utils/fishCatalog.test.ts`

Expected: PASS — 3 tests. `digitsOnly` behavior unchanged.

- [ ] **Step 4: Manual check**

If the app is not running: `npm run dev`

Open `/admin/banco` at a phone width (~390px) or on a phone:

1. The PIN field is still masked.
2. Typing or pasting `21a 34` leaves `2134` in the field (four masked dots).
3. Entra with `2134` opens the banco list (unless `VITE_FISH_ADMIN_PIN` is set to something else — then that value is the PIN, and it must be updated to `2134` outside the repo).
4. Entra with a wrong PIN or empty field shows `PIN non valido`.
5. Desktop uses the same field and the same PIN.

- [ ] **Step 5: Commit**

```bash
git add src/utils/fishCatalog.ts src/components/fish-admin/FishAdminLogin.tsx
git commit -m "feat(banco): accept numeric-only PIN on banco login"
```

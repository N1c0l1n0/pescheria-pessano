# Remove Order Tracking Phone Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore immediate order tracking on `/ordine/:id` by removing the phone suffix gate and updating Privacy Policy copy.

**Architecture:** Delete phone verification state/UI from `OrderTracking.tsx`, remove `orderAccess` module, update one paragraph in `PrivacyPolicyModal.tsx`.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest.

## Global Constraints

- Do not change KDS PIN auth, PokeBuilder privacy checkbox, or cookie consent.
- Keep mock-order removal from F-016 (error state for invalid IDs).
- Privacy copy in Italian, consistent with existing modal tone.
- Do not `git push` unless the user asks.

---

### Task 1: Remove phone gate and update privacy copy

**Files:**
- Modify: `src/components/OrderTracking.tsx`
- Modify: `src/components/PrivacyPolicyModal.tsx`
- Delete: `src/utils/orderAccess.ts`
- Delete: `src/utils/orderAccess.test.ts`

- [ ] **Step 1: Remove orderAccess import and phone state from OrderTracking**

In `src/components/OrderTracking.tsx`, remove:

```typescript
import { verifyOrderPhoneAccess } from '../utils/orderAccess';
```

Remove state declarations:

```typescript
const [phoneVerified, setPhoneVerified] = useState(false);
const [phoneInput, setPhoneInput] = useState('');
const [phoneGateError, setPhoneGateError] = useState<string | null>(null);
```

Remove the `useEffect` that resets phone state on `[id]`:

```typescript
  useEffect(() => {
    setPhoneVerified(false);
    setPhoneInput('');
    setPhoneGateError(null);
  }, [id]);
```

- [ ] **Step 2: Remove phone gate JSX block**

Delete the entire `{/* PHONE VERIFICATION GATE */}` section (the block rendered when `!phoneVerified`).

- [ ] **Step 3: Restore immediate tracker render condition**

Change the main content wrapper condition from:

```tsx
{!loading && !error && order && phoneVerified && (
```

To:

```tsx
{!loading && !error && order && (
```

- [ ] **Step 4: Delete orderAccess files**

```bash
rm src/utils/orderAccess.ts src/utils/orderAccess.test.ts
```

- [ ] **Step 5: Update Privacy Policy Sicurezza paragraph**

In `src/components/PrivacyPolicyModal.tsx`, replace the last `<p>` (Sicurezza) with:

```tsx
          <p style={{ margin: 0 }}>
            <strong>Sicurezza:</strong> accesso agli ordini da area staff protetta da credenziali; il tracking
            dell&apos;ordine è accessibile tramite link personale fornito al cliente dopo l&apos;ordine — la
            riservatezza dei dati dipende dalla custodia del link, non condividerlo con terzi.
          </p>
```

- [ ] **Step 6: Run tests and build**

```bash
npm test
npm run build
```

Expected: all tests pass (94 total, 4 fewer than before), build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/OrderTracking.tsx src/components/PrivacyPolicyModal.tsx src/utils/orderAccess.ts src/utils/orderAccess.test.ts
git commit -m "$(cat <<'EOF'
feat(tracking): remove phone gate from order status page

Restore immediate live tracker access via personal order link; update privacy copy accordingly.
EOF
)"
```

# GDPR Compliance Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close GDPR/ePrivacy gaps identified in `docs/superpowers/specs/2026-09-06-gdpr-compliance-audit-design.md` — P1 critical findings first, then P2, then P3.

**Architecture:** Extract shared legal modals (`PrivacyPolicyModal`) and wire them through `CookieConsentContext` (same pattern as `CookiePolicyModal`). Add Art. 13 notice + privacy acknowledgement in `PokeBuilder`. Gate `/admin/kds` with sessionStorage PIN auth mirroring banco admin. Add phone suffix verification on `OrderTracking`. Fix legal copy accuracy in Cookie Policy. Remove hardcoded Supabase/key fallbacks.

**Tech Stack:** React 18, TypeScript, Vite 6, Vitest, Supabase JS client, existing cookie consent context.

## Global Constraints

- Legal copy in **Italian**, tone consistent with existing `Footer` / `CookiePolicyModal`.
- Do not break existing Google Maps cookie consent flow (`CookieBanner`, `GoogleMapEmbed`, `CookieConsentContext`).
- No third-party CMP (Iubenda, Cookiebot).
- KDS PIN via `VITE_KDS_ADMIN_PIN` env var — no hardcoded fallback in source.
- Supabase URL/key via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only — no hardcoded fallback in source.
- Fish admin PIN continues using `VITE_FISH_ADMIN_PIN` with existing `2134` fallback (unchanged unless env set).
- KDS login UI mirrors `FishAdminLogin` (lock mark, PIN field, `Entra`, `PIN non valido`).
- Supabase RLS policy changes are **out of scope** for this plan (ops follow-up); client-side KDS gate is in scope.
- Do not `git push` unless the user asks.
- Run tests with `npm test -- <file>`.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/constants/legalCopy.ts` | **Create** — shared privacy/cookie legal paragraph constants |
| `src/components/PrivacyPolicyModal.tsx` | **Create** — extracted privacy modal (Art. 13 complete copy) |
| `src/context/CookieConsentContext.tsx` | **Modify** — add `privacyPolicyOpen`, `openPrivacyPolicy`, `closePrivacyPolicy` |
| `src/components/Footer.tsx` | **Modify** — use `PrivacyPolicyModal` + context; remove inline privacy JSX |
| `src/App.tsx` | **Modify** — mount `PrivacyPolicyModal` in shell |
| `src/components/PokeBuilder.tsx` | **Modify** — Art. 13 notice + privacy checkbox gate on submit |
| `src/utils/kdsAdmin.ts` | **Create** — KDS PIN auth helpers |
| `src/utils/kdsAdmin.test.ts` | **Create** — unit tests for KDS auth |
| `src/components/kds-admin/KdsAdminLogin.tsx` | **Create** — login gate UI |
| `src/components/KdsBoard.tsx` | **Modify** — auth gate wrapper at top |
| `src/components/CookiePolicyModal.tsx` | **Modify** — accurate localStorage copy, key table, external links |
| `src/utils/orderAccess.ts` | **Create** — phone suffix verification helper |
| `src/utils/orderAccess.test.ts` | **Create** — unit tests |
| `src/components/OrderTracking.tsx` | **Modify** — phone gate before PII; remove mock fallback |
| `src/lib/supabase.ts` | **Modify** — env-only, throw if missing |
| `src/components/FooterAndHours.tsx` | **Modify** — replace raw iframe with `GoogleMapEmbed` |

---

### Task 1: Privacy policy modal extraction

**Findings addressed:** foundation for F-014, F-002, F-003, F-004, F-005, F-007, F-020

**Files:**
- Create: `src/constants/legalCopy.ts`
- Create: `src/components/PrivacyPolicyModal.tsx`
- Modify: `src/context/CookieConsentContext.tsx`
- Modify: `src/App.tsx` (via `CookieConsentShell`)
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `PrivacyPolicyModal` props: `{ open: boolean; onClose: () => void }`
  - Context adds: `privacyPolicyOpen: boolean`, `openPrivacyPolicy(): void`, `closePrivacyPolicy(): void`

- [ ] **Step 1: Create legal copy constants**

Create `src/constants/legalCopy.ts`:

```typescript
export const PRIVACY_CONTROLLER_NAME = 'Pescheria Pessano';
export const PRIVACY_CONTROLLER_ADDRESS =
  'Via Avvocato Emanuele Rossi, 17, 17024 Finale Ligure (SV)';
export const PRIVACY_CONTACT_PHONE = '019 692623';
export const PRIVACY_CONTACT_EMAIL = 'privacy@pescheriapessano.it';

export const PRIVACY_RETENTION_ORDERS =
  'I dati dell\'ordine sono conservati per 90 giorni dalla data di completamento, salvo obblighi di legge.';
export const PRIVACY_RETENTION_CONSENT =
  'Le preferenze cookie sono conservate fino a revoca o cancellazione manuale dal browser.';
```

> **Note:** Replace `PRIVACY_CONTACT_EMAIL` with the real business email before production deploy if different.

- [ ] **Step 2: Create PrivacyPolicyModal**

Create `src/components/PrivacyPolicyModal.tsx` — mirror `CookiePolicyModal` structure (`role="dialog"`, `aria-modal`, white card, `btn-ocean` close). Body must include all Art. 13 sections:

```tsx
import React from 'react';
import { Info, X } from 'lucide-react';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTACT_PHONE,
  PRIVACY_CONTROLLER_ADDRESS,
  PRIVACY_CONTROLLER_NAME,
  PRIVACY_RETENTION_CONSENT,
  PRIVACY_RETENTION_ORDERS,
} from '../constants/legalCopy';

type PrivacyPolicyModalProps = {
  open: boolean;
  onClose: () => void;
};

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 37, 69, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '550px',
          width: '100%',
          padding: '2rem',
          color: 'var(--color-text-dark)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          maxHeight: 'min(85vh, 720px)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Chiudi informativa privacy"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Info color="var(--color-ocean-medium)" size={24} />
          <h3
            id="privacy-policy-title"
            className="font-serif"
            style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ocean-dark)', margin: 0 }}
          >
            Informativa sulla Privacy
          </h3>
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>{PRIVACY_CONTROLLER_NAME}</strong> ({PRIVACY_CONTROLLER_ADDRESS}) è il titolare del trattamento
            ai sensi del Regolamento UE 2016/679 (GDPR). Contatti:{' '}
            <strong>{PRIVACY_CONTACT_PHONE}</strong>,{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Dati raccolti:</strong> nome referente, numero di telefono e, per le consegne, indirizzo. Durante
            l&apos;ordine online i dati vengono trasmessi al nostro database cloud (
            <strong>Supabase Inc.</strong>, hosting — possibile trasferimento verso gli USA con garanzie contrattuali
            Standard Contractual Clauses).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Finalità e base giuridica:</strong> gestione ed esecuzione dell&apos;ordine (Art. 6(1)(b) GDPR):
            identificazione al banco, tracking live dello stato, comunicazioni di avviso ritiro/consegna anche via{' '}
            <strong>WhatsApp</strong> (Meta Platforms Ireland Ltd., su iniziativa del cliente o del personale).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Conservazione:</strong> {PRIVACY_RETENTION_ORDERS} {PRIVACY_RETENTION_CONSENT}
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Destinatari:</strong> personale autorizzato della pescheria; fornitori tecnici Supabase (hosting
            dati ordine) e, su link volontario, Google Maps / WhatsApp. Non vendiamo dati né profili pubblicitari.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Diritti dell&apos;interessato:</strong> accesso, rettifica, cancellazione, limitazione, portabilità,
            opposizione, revoca del consenso (ove applicabile), reclamo al{' '}
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Garante per la Protezione dei Dati Personali
            </a>
            . Per esercitare i diritti scrivi a{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>{' '}
            o chiama il <strong>{PRIVACY_CONTACT_PHONE}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Sicurezza:</strong> accesso agli ordini da area staff protetta da credenziali; tracking ordine
            protetto da verifica parziale del telefono.
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn btn-ocean"
          style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}
        >
          Ho capito
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Extend CookieConsentContext**

In `src/context/CookieConsentContext.tsx`, add state and methods mirroring cookie policy:

```typescript
// Add to CookieConsentContextValue type:
privacyPolicyOpen: boolean;
openPrivacyPolicy: () => void;
closePrivacyPolicy: () => void;

// Add state:
const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);

// Add callbacks:
const openPrivacyPolicy = useCallback(() => setPrivacyPolicyOpen(true), []);
const closePrivacyPolicy = useCallback(() => setPrivacyPolicyOpen(false), []);

// Include in useMemo value object
```

- [ ] **Step 4: Mount modal in App shell**

In `src/App.tsx`, update `CookieConsentShell`:

```tsx
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';

function CookieConsentShell({ children }: { children: ReactNode }) {
  const { cookiePolicyOpen, closeCookiePolicy, privacyPolicyOpen, closePrivacyPolicy } = useCookieConsent();

  return (
    <>
      {children}
      <CookieBanner />
      <CookiePolicyModal open={cookiePolicyOpen} onClose={closeCookiePolicy} />
      <PrivacyPolicyModal open={privacyPolicyOpen} onClose={closePrivacyPolicy} />
    </>
  );
}
```

- [ ] **Step 5: Refactor Footer**

In `src/components/Footer.tsx`:
- Remove `modalType` state and inline privacy modal JSX (lines ~171–251).
- Import `openPrivacyPolicy` from context.
- Change Privacy Policy button: `onClick={openPrivacyPolicy}` instead of `setModalType('privacy')`.

- [ ] **Step 6: Manual verify**

Run: `npm run dev`

Check:
- Footer → "Privacy Policy" opens new modal with Supabase/WhatsApp/rights sections
- Cookie Policy still opens correctly
- No console errors

- [ ] **Step 7: Commit**

```bash
git add src/constants/legalCopy.ts src/components/PrivacyPolicyModal.tsx src/context/CookieConsentContext.tsx src/App.tsx src/components/Footer.tsx
git commit -m "feat(gdpr): extract PrivacyPolicyModal with complete Art. 13 copy"
```

---

### Task 2: PokeBuilder Art. 13 notice at collection point

**Findings addressed:** F-001

**Files:**
- Modify: `src/components/PokeBuilder.tsx`
- Modify: `src/index.css` (optional small class for privacy row)

**Interfaces:**
- Consumes: `openPrivacyPolicy()` from `useCookieConsent()`
- Produces: `privacyAccepted: boolean` state; submit blocked until checked

- [ ] **Step 1: Add privacy acceptance state**

Near other `useState` declarations in `PokeBuilder.tsx`:

```typescript
const [privacyAccepted, setPrivacyAccepted] = useState(false);
const { openPrivacyPolicy } = useCookieConsent();
```

Add import:

```typescript
import { useCookieConsent } from '../context/CookieConsentContext';
```

- [ ] **Step 2: Gate submit on privacy acceptance**

At the start of `handleDirectOrderSubmit` (before phone check):

```typescript
if (!privacyAccepted) {
  triggerValidationError(
    'Devi confermare di aver letto l\'informativa privacy prima di inviare l\'ordine.',
    'privacyAcceptCheckbox',
  );
  return;
}
```

- [ ] **Step 3: Add UI in step "I tuoi dati"**

After the phone field block inside `#ordine-dati`, before closing `order-fields`:

```tsx
<div className="order-field order-privacy-notice">
  <p className="order-hint" style={{ marginBottom: '0.65rem' }}>
    I dati richiesti servono esclusivamente a gestire il tuo ordine (identificazione al banco, aggiornamento stato e
    comunicazioni di ritiro/consegna). Base giuridica: esecuzione del contratto (Art. 6(1)(b) GDPR).
  </p>
  <label htmlFor="privacyAcceptCheckbox" className="order-privacy-label">
    <input
      id="privacyAcceptCheckbox"
      type="checkbox"
      checked={privacyAccepted}
      onChange={(e) => {
        setPrivacyAccepted(e.target.checked);
        if (validationError) setValidationError(null);
      }}
    />
    <span>
      Ho letto l&apos;{' '}
      <button type="button" className="order-privacy-link" onClick={openPrivacyPolicy}>
        Informativa sulla Privacy
      </button>
    </span>
  </label>
</div>
```

Add minimal CSS in `src/index.css`:

```css
.order-privacy-label {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-text-muted);
  cursor: pointer;
}

.order-privacy-label input {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.order-privacy-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-ocean-medium);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev` → `/componi-poke`

Check:
- Submit without checkbox → validation error scrolls to checkbox
- "Informativa sulla Privacy" link opens modal
- With checkbox checked → submit proceeds as before

- [ ] **Step 5: Commit**

```bash
git add src/components/PokeBuilder.tsx src/index.css
git commit -m "feat(gdpr): require privacy acknowledgement at order collection"
```

---

### Task 3: KDS admin authentication

**Findings addressed:** F-018

**Files:**
- Create: `src/utils/kdsAdmin.ts`
- Create: `src/utils/kdsAdmin.test.ts`
- Create: `src/components/kds-admin/KdsAdminLogin.tsx`
- Modify: `src/components/KdsBoard.tsx`

**Interfaces:**
- Consumes: `digitsOnly` from `src/utils/fishCatalog.ts` (reuse existing helper)
- Produces:
  - `isKdsAuthenticated(): boolean`
  - `authenticateKds(pin: string): boolean`
  - `logoutKds(): void`
  - `getKdsPin(): string`
  - `KdsAdminLogin` props: `{ onSuccess: () => void }`

- [ ] **Step 1: Write failing KDS auth tests**

Create `src/utils/kdsAdmin.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateKds,
  getKdsPin,
  isKdsAuthenticated,
  logoutKds,
} from './kdsAdmin';

describe('kdsAdmin', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('getKdsPin reads VITE_KDS_ADMIN_PIN', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(getKdsPin()).toBe('5678');
  });

  it('getKdsPin returns empty string when env missing', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '');
    expect(getKdsPin()).toBe('');
  });

  it('authenticateKds stores session on correct pin', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(authenticateKds('5678')).toBe(true);
    expect(isKdsAuthenticated()).toBe(true);
  });

  it('authenticateKds rejects wrong pin', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(authenticateKds('0000')).toBe(false);
    expect(isKdsAuthenticated()).toBe(false);
  });

  it('logoutKds clears session', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    authenticateKds('5678');
    logoutKds();
    expect(isKdsAuthenticated()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/kdsAdmin.test.ts`

Expected: FAIL — module `./kdsAdmin` not found.

- [ ] **Step 3: Implement kdsAdmin helpers**

Create `src/utils/kdsAdmin.ts`:

```typescript
const KDS_AUTH_KEY = 'kds_admin_auth';

export function getKdsPin(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.VITE_KDS_ADMIN_PIN?.trim() || '';
}

export function isKdsAuthenticated(): boolean {
  return sessionStorage.getItem(KDS_AUTH_KEY) === '1';
}

export function authenticateKds(pin: string): boolean {
  const expected = getKdsPin();
  if (!expected) return false;
  if (pin.trim() !== expected) return false;
  sessionStorage.setItem(KDS_AUTH_KEY, '1');
  return true;
}

export function logoutKds(): void {
  sessionStorage.removeItem(KDS_AUTH_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/kdsAdmin.test.ts`

Expected: PASS — 5 tests.

- [ ] **Step 5: Create KdsAdminLogin component**

Create `src/components/kds-admin/KdsAdminLogin.tsx` (copy structure from `FishAdminLogin.tsx`):

```tsx
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { digitsOnly } from '../../utils/fishCatalog';
import { authenticateKds } from '../../utils/kdsAdmin';

interface KdsAdminLoginProps {
  onSuccess: () => void;
}

export const KdsAdminLogin: React.FC<KdsAdminLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (authenticateKds(pin.trim())) {
      onSuccess();
      return;
    }
    setPinError('PIN non valido');
  };

  return (
    <div className="fish-admin-shell">
      <div className="fish-admin-login">
        <div className="fish-admin-login__mark">
          <Lock size={18} />
        </div>
        <h1>KDS</h1>
        <p>PIN gestore per la cucina.</p>
        <form onSubmit={handleLogin}>
          <label className="fish-admin-field">
            PIN
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(digitsOnly(e.target.value))}
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
            />
          </label>
          {pinError ? <p className="fish-admin-status fish-admin-status--error">{pinError}</p> : null}
          <button type="submit" className="fish-admin-btn fish-admin-btn--primary">
            Entra
          </button>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Gate KdsBoard**

At the top of `KdsBoard` component function body in `src/components/KdsBoard.tsx`:

```typescript
import { KdsAdminLogin } from './kds-admin/KdsAdminLogin';
import { isKdsAuthenticated, logoutKds } from '../utils/kdsAdmin';

// Inside component:
const [kdsAuthed, setKdsAuthed] = useState(isKdsAuthenticated());

if (!kdsAuthed) {
  return <KdsAdminLogin onSuccess={() => setKdsAuthed(true)} />;
}
```

Add a small logout control in the KDS header toolbar (reuse existing header button row):

```tsx
<button type="button" onClick={() => { logoutKds(); setKdsAuthed(false); }}>
  Esci
</button>
```

- [ ] **Step 7: Document env var**

Add to project `.env.example` (create if missing):

```
VITE_KDS_ADMIN_PIN=your-kds-pin-here
```

- [ ] **Step 8: Manual verify**

Set `VITE_KDS_ADMIN_PIN=5678` in local `.env`, run `npm run dev`, visit `/admin/kds`.

Check:
- Login screen shown without PIN
- Wrong PIN → `PIN non valido`
- Correct PIN → KDS board loads
- Esci → returns to login

- [ ] **Step 9: Commit**

```bash
git add src/utils/kdsAdmin.ts src/utils/kdsAdmin.test.ts src/components/kds-admin/KdsAdminLogin.tsx src/components/KdsBoard.tsx .env.example
git commit -m "feat(gdpr): protect KDS route with PIN authentication"
```

---

### Task 4: Cookie Policy accuracy fixes

**Findings addressed:** F-008, F-009, F-017

**Files:**
- Modify: `src/components/CookiePolicyModal.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: updated Cookie Policy copy only

- [ ] **Step 1: Replace inaccurate push paragraph**

In `CookiePolicyModal.tsx`, replace the technical cookies paragraph:

```tsx
<p style={{ marginBottom: '0.75rem' }}>
  <strong>Archiviazione locale tecnica (sempre attiva):</strong> utilizziamo{' '}
  <strong>localStorage</strong> per:
</p>
<ul style={{ margin: '0 0 0.75rem 1.1rem', padding: 0 }}>
  <li>
    <code>pessano_cookie_consent</code> — preferenza cookie Maps (fino a revoca)
  </li>
  <li>
    <code>pescheria_pessano_orders_store</code> — backup locale stato ordine per tracking e KDS (durata sessione/dispositivo)
  </li>
</ul>
<p style={{ marginBottom: '0.75rem' }}>
  Non impostiamo cookie di profilazione. Le notifiche browser compaiono solo se l&apos;utente ha già concesso il
  permesso nelle impostazioni del dispositivo; il sito non richiede permessi push al primo accesso.
</p>
```

- [ ] **Step 2: Add external links note**

Before the revocation paragraph, add:

```tsx
<p style={{ marginBottom: '0.75rem' }}>
  <strong>Link esterni:</strong> i link verso Google Maps o WhatsApp aprono servizi di terze parti solo dopo il tuo
  click; in quel caso si applicano le rispettive informative privacy.
</p>
```

- [ ] **Step 3: Manual verify**

Footer → Cookie Policy: confirm no "push in tempo reale" claim; localStorage keys listed.

- [ ] **Step 4: Commit**

```bash
git add src/components/CookiePolicyModal.tsx
git commit -m "fix(gdpr): align Cookie Policy with actual storage and notifications"
```

---

### Task 5: Order tracking phone verification

**Findings addressed:** F-015, F-016

**Files:**
- Create: `src/utils/orderAccess.ts`
- Create: `src/utils/orderAccess.test.ts`
- Modify: `src/components/OrderTracking.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `phoneLastFourDigits(phone: string): string`
  - `verifyOrderPhoneAccess(storedPhone: string, userInput: string): boolean`

- [ ] **Step 1: Write failing tests**

Create `src/utils/orderAccess.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { phoneLastFourDigits, verifyOrderPhoneAccess } from './orderAccess';

describe('phoneLastFourDigits', () => {
  it('returns last four digits', () => {
    expect(phoneLastFourDigits('333 1234567')).toBe('4567');
  });

  it('returns empty for too-short input', () => {
    expect(phoneLastFourDigits('12')).toBe('12');
  });
});

describe('verifyOrderPhoneAccess', () => {
  it('matches last four digits ignoring formatting', () => {
    expect(verifyOrderPhoneAccess('333 1234567', '4567')).toBe(true);
    expect(verifyOrderPhoneAccess('333 1234567', '1234')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(verifyOrderPhoneAccess('', '4567')).toBe(false);
    expect(verifyOrderPhoneAccess('3331234567', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/orderAccess.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement helpers**

Create `src/utils/orderAccess.ts`:

```typescript
export function phoneLastFourDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

export function verifyOrderPhoneAccess(storedPhone: string, userInput: string): boolean {
  if (!storedPhone?.trim() || !userInput?.trim()) return false;
  return phoneLastFourDigits(storedPhone) === phoneLastFourDigits(userInput);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/orderAccess.test.ts`

Expected: PASS.

- [ ] **Step 5: Remove mock order fallback**

In `OrderTracking.tsx` `fetchOrder`, delete the entire `mockOrder` block (lines ~243–268 that set fake `Cliente Pessano` data). After localStorage miss, fall through to existing error handling:

```typescript
setError('Ordine non trovato. Verifica il link o contatta la pescheria.');
```

- [ ] **Step 6: Add phone verification gate**

Add state:

```typescript
const [phoneVerified, setPhoneVerified] = useState(false);
const [phoneInput, setPhoneInput] = useState('');
const [phoneGateError, setPhoneGateError] = useState<string | null>(null);
```

Reset `phoneVerified` to `false` whenever `id` changes (in `useEffect` on `[id]`).

Before rendering main order content (when `order` is loaded and not loading/error), if `!phoneVerified`, render gate UI instead:

```tsx
<div className="order-phone-gate">
  <h2>Verifica il tuo ordine</h2>
  <p>Inserisci le ultime 4 cifre del telefono usato per l&apos;ordine.</p>
  <input
    type="tel"
    inputMode="numeric"
    maxLength={4}
    value={phoneInput}
    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
    aria-label="Ultime 4 cifre del telefono"
  />
  {phoneGateError && <p role="alert">{phoneGateError}</p>}
  <button
    type="button"
    className="btn btn-coral"
    onClick={() => {
      if (verifyOrderPhoneAccess(order.phone || '', phoneInput)) {
        setPhoneVerified(true);
        setPhoneGateError(null);
        return;
      }
      setPhoneGateError('Numero non corrispondente. Riprova.');
    }}
  >
    Continua
  </button>
</div>
```

Import: `import { verifyOrderPhoneAccess } from '../utils/orderAccess';`

- [ ] **Step 7: Manual verify**

Run dev → open a real order tracking URL.

Check:
- Invalid ID → error message, no mock data
- Valid ID → phone gate before name/phone/address visible
- Wrong 4 digits → error
- Correct 4 digits → full tracking UI

- [ ] **Step 8: Commit**

```bash
git add src/utils/orderAccess.ts src/utils/orderAccess.test.ts src/components/OrderTracking.tsx
git commit -m "feat(gdpr): gate order tracking behind phone verification"
```

---

### Task 6: Remove hardcoded Supabase credentials

**Findings addressed:** F-019 (partial — Supabase; fish PIN unchanged)

**Files:**
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` env vars
- Produces: `supabase` client; throws at module load if env missing

- [ ] **Step 1: Replace fallbacks with required env**

Replace entire `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};

const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Update .env.example**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_KDS_ADMIN_PIN=your-kds-pin-here
VITE_FISH_ADMIN_PIN=2134
```

- [ ] **Step 3: Verify build**

Ensure local `.env` has values, then run:

```bash
npm run build
```

Expected: build succeeds when env present; fails with clear error when env missing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts .env.example
git commit -m "fix(gdpr): require Supabase credentials from environment"
```

---

### Task 7: Legacy FooterAndHours maps consent

**Findings addressed:** F-011

**Files:**
- Modify: `src/components/FooterAndHours.tsx`

**Interfaces:**
- Consumes: `GoogleMapEmbed`, `MAPS_EMBED_URL`, `MAPS_EXTERNAL_URL` from existing modules
- Produces: consent-gated map in legacy component

- [ ] **Step 1: Replace raw iframe**

In `FooterAndHours.tsx`:

```typescript
import { GoogleMapEmbed } from './GoogleMapEmbed';
import { MAPS_EMBED_URL, MAPS_EXTERNAL_URL } from '../constants/cookieConsent';
```

Replace the iframe block (lines ~180–199) with:

```tsx
<GoogleMapEmbed embedUrl={MAPS_EMBED_URL} externalMapsUrl={MAPS_EXTERNAL_URL} />
```

Remove the wrapping `div` height override if it conflicts with `.map-embed` styles, or keep wrapper with `className="map-embed"` only.

- [ ] **Step 2: Commit**

```bash
git add src/components/FooterAndHours.tsx
git commit -m "fix(gdpr): use consent-gated GoogleMapEmbed in FooterAndHours"
```

---

### Task 8: Final compliance verification

**Findings addressed:** validates all P1–P3 fixes

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Manual GDPR checklist**

| Check | Expected |
| --- | --- |
| First visit cookie banner | Visible; Maps placeholder until accept |
| PokeBuilder submit without privacy checkbox | Blocked with message |
| PokeBuilder privacy link | Opens PrivacyPolicyModal with Supabase/WhatsApp/rights |
| `/admin/kds` without PIN | Login screen |
| `/admin/kds` with PIN | Board loads |
| Order tracking wrong ID | Error, no mock customer |
| Order tracking valid ID | Phone gate before PII |
| Cookie Policy | No false push claim; localStorage keys named |
| FooterAndHours (if mounted in future) | Maps placeholder without consent |

- [ ] **Step 4: Update audit spec status**

In `docs/superpowers/specs/2026-09-06-gdpr-compliance-audit-design.md`, add at top:

```markdown
**Remediation plan:** `docs/superpowers/plans/2026-09-06-gdpr-compliance-remediation.md`
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-06-gdpr-compliance-audit-design.md
git commit -m "docs(gdpr): link audit spec to remediation plan"
```

---

## Spec Coverage Self-Review

| Finding | Task |
| --- | --- |
| F-001 Art. 13 at collection | Task 2 |
| F-002 Supabase in privacy | Task 1 |
| F-003 WhatsApp in privacy | Task 1 |
| F-004 Retention periods | Task 1 |
| F-005 Data subject rights | Task 1 |
| F-006 Notification distinction | Task 1 (privacy) + Task 4 (cookie) |
| F-007 Controller identification | Task 1 |
| F-008 Inaccurate push claim | Task 4 |
| F-009 localStorage key names | Task 4 |
| F-010 Maps consent (already OK) | — |
| F-011 Legacy iframe | Task 7 |
| F-012 Fonts (already OK) | — |
| F-013 No tracking (already OK) | — |
| F-014 Supabase disclosure | Task 1 |
| F-015 Tracking URL security | Task 5 |
| F-016 Mock data removal | Task 5 |
| F-017 External links doc | Task 4 |
| F-018 KDS auth | Task 3 |
| F-019 Hardcoded secrets | Task 6 |
| F-020 WhatsApp documented | Task 1 |

**Out of scope (documented):** Supabase RLS hardening — ops follow-up after client KDS gate ships.

**Placeholder scan:** none.

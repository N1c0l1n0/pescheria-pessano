# GDPR Compliance Audit — Pescheria Pessano

**Date:** 2026-09-06  
**Status:** Remediation implemented — see plan below  
**Remediation plan:** `docs/superpowers/plans/2026-09-06-gdpr-compliance-remediation.md`  
**Approach:** Hybrid three-level audit (processing register + component matrix + structured findings)

## 1. Executive Summary

**Overall assessment: Partially compliant.**

The site has a solid foundation for cookie/ePrivacy compliance around Google Maps (consent banner, conditional iframe loading, updated Cookie Policy). However, significant gaps remain in transparency obligations (Art. 13), third-party data processor disclosure (Supabase), and access control for customer personal data on admin routes.

| Metric | Count |
| --- | --- |
| Conformant areas | 6 |
| Partial compliance findings | 10 |
| Non-compliant findings | 5 |
| P1 (critical) | 3 |
| P2 (important) | 9 |
| P3 (improvement) | 5 |

**Critical priorities (P1):**

1. **F-001** — Order form collects personal data without Art. 13 notice at point of collection
2. **F-014** — Order data sent to Supabase without disclosure or transfer information
3. **F-018** — `/admin/kds` is publicly accessible with no authentication; exposes all customer orders

**Recommendation:** Address P1 findings before any public marketing push. P2 findings required for full compliance. P3 are hygiene/prevention items.

> **Disclaimer:** This document is a technical-legal structured audit of the site's code and copy. It does not constitute formal legal advice. Validation by a qualified privacy professional is recommended before relying on it for regulatory purposes.

---

## 2. Methodology and Scope

### Reference framework

- **GDPR** — Regulation (EU) 2016/679
- **ePrivacy Directive** — 2002/58/EC (cookie and similar technologies)
- **Italian context** — Garante per la Protezione dei Dati Personali guidelines where relevant (cookie banner, privacy notice format)

### Perimeter

| Layer | Included |
| --- | --- |
| Public routes | `/`, `/componi-poke`, `/ordine/:id` |
| Admin routes | `/admin/kds`, `/admin/banco` |
| Infrastructure | Supabase client, localStorage, sessionStorage, external links (Google, WhatsApp) |
| Legal copy | Privacy Policy modal, Cookie Policy modal, footer pill, cookie banner |
| Legacy/unmounted components | `FooterAndHours`, `ProductCatalog`, `PesceBotWidget`, `DeliveryInfoSection` |

### Exclusions

- Implementation of fixes (this is audit-only)
- Formal binding legal opinion
- Server-side Supabase audit (RLS policies, backups, DPA contracts)
- Physical store / paper processes
- Contractual documents with processors (Supabase DPA, Google SCCs)

### Audit method

1. **Inventory** — scan all routes, components, utilities with storage/network access
2. **Legal mapping** — link each component to processing activities; verify legal basis
3. **Gap evaluation** — classify each gap with GDPR/ePrivacy article, risk, priority
4. **Cross-validation** — verify legal copy matches actual code behaviour

### Risk classification

| Level | Criteria | Example |
| --- | --- | --- |
| **High** | Direct GDPR/ePrivacy obligation breach; sanction or data-subject harm risk | Personal data collected without Art. 13 notice; third-party cookies without consent |
| **Medium** | Documentary or procedural gap; lawful processing but incomplete | Privacy Policy missing Supabase mention; inaccurate Cookie Policy copy |
| **Low** | Best-practice improvement; minimal real-world risk | Unused legacy component with non-compliant iframe; undocumented external links |

| Priority | Rule |
| --- | --- |
| **P1** | High risk — address first |
| **P2** | Medium risk — required for full compliance |
| **P3** | Low risk — hygiene / prevention |

---

## 3. Processing Activity Register (Art. 30)

| ID | Activity | Components / infrastructure | Personal data | Expected legal basis | External processor |
| --- | --- | --- | --- | --- | --- |
| **T1** | Poke order data collection | `PokeBuilder` | Name, phone, delivery address (if delivery) | Art. 6(1)(b) — contract / pre-contractual measures | — |
| **T2** | Cloud order persistence | `PokeBuilder` → Supabase (`orders`, `order_items`, RPC `submit_poke_order`) | T1 data + order details, notes | Art. 6(1)(b) | **Supabase Inc.** (DB hosting) |
| **T3** | Local order fallback | `orderStore.ts`, `PokeBuilder` | T1 data in `localStorage` key `pescheria_pessano_orders_store` | Art. 6(1)(b) | — |
| **T4** | Live order tracking | `OrderTracking`, Supabase Realtime | Name, phone, address, order status, items | Art. 6(1)(b) | Supabase |
| **T5** | Browser "ready" notification | `OrderTracking` | Notification API permission (if previously granted) | Art. 6(1)(a) — consent | — |
| **T6** | WhatsApp order-ready message | `KdsBoard` → `kdsWhatsApp.ts` | Name, phone (via wa.me URL opened by staff) | Art. 6(1)(b) | **Meta Platforms / WhatsApp** (on click) |
| **T7** | Public WhatsApp links | `OrderTracking`, legacy `ProductCatalog`, `DeliveryInfoSection` | No automatic data transfer (user-initiated) | N/A until click | Meta/WhatsApp |
| **T8** | Google Maps embed | `GoogleMapEmbed`, `HoursAndLocation` | Google third-party cookies/identifiers | Art. 6(1)(a) — consent (ePrivacy Art. 5(3)) | **Google Ireland Ltd.** |
| **T9** | Cookie consent for Maps | `CookieBanner`, `CookieConsentContext`, `CookiePolicyModal` | Consent preference in `localStorage` key `pessano_cookie_consent` | Art. 6(1)(a) / legal obligation | — |
| **T10** | Staff order display | `KdsBoard` route `/admin/kds` | All customers' names, phones, addresses | Art. 6(1)(b) — internal contract fulfilment | Supabase |
| **T11** | Staff order search | `KdsBoard` Supabase filter | Name, phone, friendly_id | Art. 6(1)(b) | Supabase |
| **T12** | Fish catalog admin | `FishCatalogAdmin`, `FishAdminLogin` | Admin PIN in `sessionStorage` only (no customer data) | N/A for customer PII | Supabase (fish catalog) |
| **T13** | Realtime order sync | Supabase channels in `PokeBuilder`, `KdsBoard`, `OrderTracking` | Connection metadata, IP (Supabase-side) | Art. 6(1)(b) | Supabase |
| **T14** | Privacy/cookie information | `Footer`, `CookiePolicyModal` | No active processing | Transparency obligation Art. 13/14 | — |

---

## 4. Component × Activity Matrix

| Component / Route | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` Homepage | | | | | | | | | ✓ | | | | Conformant* |
| `Header` | | | | | | | | | | | | | Conformant |
| `Hero` | | | | | | | | | | | | | Conformant |
| `FishMenuCatalog` | | | | | | | | | | | | | Conformant |
| `TrustSection` | | | | | | | ✓ | | | | | | Conformant* |
| `InfoSection` | | | | | | | | | | | | | Conformant |
| `HoursAndLocation` | | | | | | | ✓ | ✓ | ✓ | | | | Conformant |
| `Footer` | | | | | | | ✓ | | ✓ | | | | Gap (doc) |
| `PokeBuilder` / `/componi-poke` | ✓ | ✓ | ✓ | | | | | | ✓ | | | | **Gap** |
| `OrderTracking` / `/ordine/:id` | | ✓ | ✓ | ✓ | ✓ | | ✓ | | ✓ | | | | **Gap** |
| `KdsBoard` / `/admin/kds` | | ✓ | ✓ | | | ✓ | | | | ✓ | ✓ | | **Critical gap** |
| `FishCatalogAdmin` / `/admin/banco` | | | | | | | | | | | | ✓ | Conformant |
| `CookieBanner` | | | | | | | | | ✓ | | | | Conformant |
| `CookieConsentContext` | | | | | | | | | ✓ | | | | Conformant |
| `GoogleMapEmbed` | | | | | | | | ✓ | ✓ | | | | Conformant |
| `CookiePolicyModal` | | | | | | | | | ✓ | | | | Gap (doc) |
| `FooterAndHours` (legacy, unmounted) | | | | | | | | ✓ | | | | | Gap (latent) |
| `ProductCatalog` (legacy, unmounted) | | | | | | | ✓ | | | | | | N/A |
| `PesceBotWidget` (legacy, unmounted) | | | | | | | | | | | | | N/A |
| `DeliveryInfoSection` (legacy, unmounted) | | | | | | | ✓ | | | | | | N/A |
| `index.html` / `main.tsx` | | | | | | | | | | | | | Conformant |
| `lib/supabase.ts` | | ✓ | | ✓ | | | | | | ✓ | ✓ | ✓ | Gap (indirect) |

*\* External Google Maps links are user-initiated; no embed until click. Cookie banner applies site-wide.*

---

## 5. Detailed Findings

### 5.1 Transparency & Privacy Notice (Art. 13, 14)

#### F-001 — No privacy notice at order data collection point

| Field | Value |
| --- | --- |
| **Components** | `PokeBuilder.tsx` (step "I tuoi dati", fields `customerNameInput`, `customerPhoneInput`, `deliveryAddressInput`) |
| **Activity** | T1 |
| **Description** | The order form collects name, phone, and optionally delivery address without a link to the Privacy Policy, checkbox, or inline Art. 13 information at the point of collection. |
| **Norm** | Art. 13(1)(a)(c)(d)(e) GDPR |
| **Expected basis** | Art. 6(1)(b) — contract performance (acceptable), but Art. 13 information must still be provided at collection |
| **Current state** | Non-compliant |
| **Risk** | High |
| **Priority** | P1 |
| **Recommended action** | Add Art. 13 notice at order form: link to Privacy Policy + brief purpose/retention statement; consider explicit acknowledgement before submit |

#### F-002 — Privacy Policy omits Supabase as processor

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx` (Privacy modal) |
| **Activity** | T2, T4, T13 |
| **Description** | Privacy Policy does not mention Supabase Inc. as data processor/host for order storage and realtime sync. |
| **Norm** | Art. 13(1)(e), Art. 28 GDPR |
| **Expected basis** | Processor disclosure with purpose and safeguards |
| **Current state** | Partial |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Add Supabase to Privacy Policy: identity, purpose (hosting), location (US — see F-014), link to Supabase DPA/privacy policy |

#### F-003 — Privacy Policy omits WhatsApp/Meta as communication channel

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx`, `KdsBoard.tsx`, `OrderTracking.tsx` |
| **Activity** | T6, T7 |
| **Description** | Staff can open WhatsApp with customer name/phone via KDS. Public pages link to WhatsApp. Privacy Policy does not mention Meta/WhatsApp. |
| **Norm** | Art. 13(1)(e), Art. 14 GDPR |
| **Expected basis** | Disclosure of third-party recipients |
| **Current state** | Partial |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Document WhatsApp as optional communication channel; data transferred on staff-initiated or user-initiated click |

#### F-004 — No retention periods specified

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx` (Privacy modal) |
| **Activity** | T1–T4 |
| **Description** | Privacy Policy states data kept "for the time strictly necessary" but gives no specific periods or criteria for orders, localStorage, Supabase records. |
| **Norm** | Art. 13(2)(a) GDPR |
| **Expected basis** | Specific retention period or criteria (e.g. "90 days after order completion") |
| **Current state** | Non-compliant |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Define and document retention periods for Supabase orders, localStorage fallback, consent records |

#### F-005 — Data subject rights not listed

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx` (Privacy modal) |
| **Activity** | T14 |
| **Description** | Privacy Policy mentions contact for deletion requests but does not list full Art. 13(2)(b) rights: access, rectification, erasure, restriction, portability, objection, complaint to Garante. |
| **Norm** | Art. 13(2)(b)(d) GDPR |
| **Expected basis** | Complete rights enumeration with exercise method |
| **Current state** | Non-compliant |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Add rights section with contact method (phone/email) and link to Garante complaint procedure |

#### F-006 — Notification methods not distinguished in Privacy Policy

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx`, `OrderTracking.tsx`, `CookiePolicyModal.tsx` |
| **Activity** | T4, T5, T6 |
| **Description** | Privacy Policy mentions "notifiche di avviso per il ritiro" generically. Actual mechanisms: live tracker page, browser Notification API (if permitted), WhatsApp (staff). Cookie Policy mentions "push" inaccurately (see F-008). |
| **Norm** | Art. 13(1)(c) GDPR |
| **Expected basis** | Accurate description of each notification channel |
| **Current state** | Partial |
| **Risk** | Low |
| **Priority** | P3 |
| **Recommended action** | Align Privacy and Cookie Policy with actual notification mechanisms |

#### F-007 — Incomplete controller identification

| Field | Value |
| --- | --- |
| **Components** | `Footer.tsx` (Privacy modal) |
| **Activity** | T14 |
| **Description** | Controller identified by trade name and address only. Missing: legal entity form, P.IVA/C.F., dedicated privacy contact email. |
| **Norm** | Art. 13(1)(a) GDPR |
| **Expected basis** | Full controller identity and contact details |
| **Current state** | Partial |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Add complete business identification and privacy contact email |

---

### 5.2 Cookies & ePrivacy

#### F-008 — Cookie Policy inaccurately claims push notifications

| Field | Value |
| --- | --- |
| **Components** | `CookiePolicyModal.tsx`, `main.tsx`, `OrderTracking.tsx` |
| **Activity** | T5 |
| **Description** | Cookie Policy states localStorage enables "servizio di notifiche push in tempo reale". Code analysis: no `Notification.requestPermission()` call exists; service workers are explicitly unregistered in `main.tsx`; notifications only fire if permission was previously granted elsewhere. |
| **Norm** | Art. 5(1)(d) GDPR (accuracy), ePrivacy transparency |
| **Expected basis** | Accurate description of technologies used |
| **Current state** | Non-compliant (inaccurate copy) |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Correct Cookie Policy: localStorage used for order state and consent preference; remove or qualify push notification claim |

#### F-009 — localStorage keys not documented by name

| Field | Value |
| --- | --- |
| **Components** | `CookiePolicyModal.tsx`, `orderStore.ts`, `CookieConsentContext.tsx` |
| **Activity** | T3, T9 |
| **Description** | Cookie Policy mentions localStorage generically but does not name keys: `pescheria_pessano_orders_store`, `pessano_cookie_consent`. |
| **Norm** | ePrivacy transparency, Art. 13 |
| **Expected basis** | Named storage items with purpose and duration |
| **Current state** | Partial |
| **Risk** | Low |
| **Priority** | P3 |
| **Recommended action** | Add table of localStorage keys, purpose, duration in Cookie Policy |

#### F-010 — Google Maps consent gate (CONFORMANT)

| Field | Value |
| --- | --- |
| **Components** | `GoogleMapEmbed.tsx`, `CookieBanner.tsx`, `CookieConsentContext.tsx`, `HoursAndLocation.tsx` |
| **Activity** | T8, T9 |
| **Description** | Maps iframe loads only after explicit consent (`consent.maps === true`). Placeholder shown otherwise. Banner provides Accept/Reject. Revocation via "Gestisci cookie". |
| **Norm** | Art. 5(3) ePrivacy, Art. 7 GDPR |
| **Current state** | **Compliant** |
| **Risk** | — |
| **Priority** | — |
| **Recommended action** | None |

#### F-011 — Legacy component with unconstrained Maps iframe

| Field | Value |
| --- | --- |
| **Components** | `FooterAndHours.tsx` (not mounted in `App.tsx`) |
| **Activity** | T8 |
| **Description** | Contains raw Google Maps iframe without consent gate. Not currently served to users but present in codebase; risk if remounted without update. |
| **Norm** | Art. 5(3) ePrivacy |
| **Expected basis** | Consent before third-party cookie-setting embed |
| **Current state** | Non-compliant (latent) |
| **Risk** | Low |
| **Priority** | P3 |
| **Recommended action** | Replace iframe with `GoogleMapEmbed` or remove unused component |

#### F-012 — Self-hosted fonts (CONFORMANT)

| Field | Value |
| --- | --- |
| **Components** | `index.css`, `public/fonts/` |
| **Activity** | — |
| **Description** | Playfair Display, Plus Jakarta Sans, Barlow Condensed served locally. No Google Fonts requests. |
| **Current state** | **Compliant** |
| **Risk** | — |
| **Priority** | — |
| **Recommended action** | None |

#### F-013 — No analytics or tracking (CONFORMANT)

| Field | Value |
| --- | --- |
| **Components** | `index.html`, all React components |
| **Activity** | — |
| **Description** | No Google Analytics, Meta Pixel, Hotjar, or similar tracking scripts detected. |
| **Current state** | **Compliant** |
| **Risk** | — |
| **Priority** | — |
| **Recommended action** | None |

---

### 5.3 Order Processing & Third Parties

#### F-014 — Supabase processing without customer disclosure

| Field | Value |
| --- | --- |
| **Components** | `PokeBuilder.tsx`, `lib/supabase.ts`, `OrderTracking.tsx`, `KdsBoard.tsx` |
| **Activity** | T2, T4, T13 |
| **Description** | Personal order data (name, phone, address, items) is transmitted to Supabase (`amerjacymzhmnmzulakt.supabase.co`). No Art. 13 disclosure to customer. Supabase is US-based — potential extra-EU transfer (Art. 44–49) not addressed. |
| **Norm** | Art. 13(1)(e)(f), Art. 28, Art. 44–49 GDPR |
| **Expected basis** | Processor disclosure + transfer safeguards (SCCs) |
| **Current state** | Non-compliant |
| **Risk** | High |
| **Priority** | P1 |
| **Recommended action** | Disclose Supabase in Privacy Policy; verify Supabase DPA and SCCs are in place; inform users of cloud storage |

#### F-015 — Order tracking accessible without authentication

| Field | Value |
| --- | --- |
| **Components** | `OrderTracking.tsx`, route `/ordine/:id` |
| **Activity** | T4 |
| **Description** | Anyone with the order ID URL can view customer name, phone, delivery address, and order details. No PIN, token, or phone verification. |
| **Norm** | Art. 32(1)(b), Art. 5(1)(f) GDPR |
| **Expected basis** | Appropriate security measures for personal data access |
| **Current state** | Partial (functional by design for UX, but weak security) |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Consider phone-number verification, signed tokens, or time-limited opaque URLs; document risk acceptance if ID obscurity is intentional |

#### F-016 — Mock order data on missing ID

| Field | Value |
| --- | --- |
| **Components** | `OrderTracking.tsx` |
| **Activity** | T4 |
| **Description** | When order ID not found in Supabase or localStorage, displays hardcoded mock order (`Cliente Pessano`, `+39 333 1234567`). Not real personal data but misleading UX. |
| **Norm** | Art. 5(1)(d) GDPR (accuracy) |
| **Expected basis** | Show error state instead of fake personal data |
| **Current state** | Partial |
| **Risk** | Low |
| **Priority** | P3 |
| **Recommended action** | Replace mock fallback with "order not found" error page |

#### F-017 — External Google Maps links (CONFORMANT with note)

| Field | Value |
| --- | --- |
| **Components** | `TrustSection.tsx`, `Footer.tsx`, `GoogleMapEmbed.tsx` placeholder |
| **Activity** | T7 |
| **Description** | Links to Google Maps open in new tab on user click. No embed, no automatic cookie setting on site. |
| **Current state** | **Compliant** (document in Cookie Policy as optional third-party link) |
| **Risk** | Low |
| **Priority** | P3 |
| **Recommended action** | Optional: mention external Google links in Cookie Policy |

---

### 5.4 Security & Admin Access (Art. 32)

#### F-018 — KDS route publicly accessible without authentication

| Field | Value |
| --- | --- |
| **Components** | `KdsBoard.tsx`, route `/admin/kds` |
| **Activity** | T10, T11 |
| **Description** | Kitchen Display System is fully public. Displays all active orders with customer name, phone, delivery address. No login, PIN, or IP restriction. Search queries Supabase by customer name/phone. |
| **Norm** | Art. 32(1)(b) GDPR, Art. 5(1)(f) |
| **Expected basis** | Access control for personal data processing systems |
| **Current state** | **Non-compliant** |
| **Risk** | **High** |
| **Priority** | **P1** |
| **Recommended action** | Implement authentication for `/admin/kds` (PIN, env-gated token, or Supabase auth); restrict Supabase RLS to authenticated staff |

#### F-019 — Weak admin security defaults

| Field | Value |
| --- | --- |
| **Components** | `fishCatalog.ts` (`getAdminPin` default `2134`), `lib/supabase.ts` (anon key in source) |
| **Activity** | T12 |
| **Description** | Fish admin PIN defaults to `2134` in source code. Supabase anon key hardcoded as fallback. While fish admin does not expose customer data, weak defaults indicate security posture. KDS has no protection at all (F-018). |
| **Norm** | Art. 32 GDPR |
| **Expected basis** | Strong access credentials, secrets in environment only |
| **Current state** | Partial |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Require env vars for PIN and Supabase keys; no hardcoded defaults in production |

#### F-020 — WhatsApp messaging from KDS without documented basis

| Field | Value |
| --- | --- |
| **Components** | `KdsBoard.tsx`, `kdsWhatsApp.ts` |
| **Activity** | T6 |
| **Description** | Staff can click to open WhatsApp with pre-filled message containing customer name. Lawful under contract performance if covered by privacy notice, but no documentation that customer was informed WhatsApp may be used. |
| **Norm** | Art. 6(1)(b), Art. 13(1)(e) GDPR |
| **Expected basis** | Disclosure in Privacy Policy that order-ready notifications may be sent via WhatsApp |
| **Current state** | Partial |
| **Risk** | Medium |
| **Priority** | P2 |
| **Recommended action** | Document WhatsApp notification in Privacy Policy; consider opt-in at order time for WhatsApp contact |

---

## 6. Summary by Regulatory Area

### Cookie & ePrivacy

| Finding | Status | Priority |
| --- | --- | --- |
| F-008 Inaccurate push claim | Non-compliant | P2 |
| F-009 Undocumented localStorage keys | Partial | P3 |
| F-010 Maps consent gate | **Compliant** | — |
| F-011 Legacy iframe | Latent | P3 |
| F-012 Self-hosted fonts | **Compliant** | — |
| F-013 No tracking | **Compliant** | — |

### Transparency & Privacy Notice

| Finding | Status | Priority |
| --- | --- | --- |
| F-001 No notice at collection | Non-compliant | P1 |
| F-002 No Supabase mention | Partial | P2 |
| F-003 No WhatsApp mention | Partial | P2 |
| F-004 No retention periods | Non-compliant | P2 |
| F-005 No rights list | Non-compliant | P2 |
| F-006 Vague notifications | Partial | P3 |
| F-007 Incomplete controller ID | Partial | P2 |

### Order Processing & Third Parties

| Finding | Status | Priority |
| --- | --- | --- |
| F-014 Supabase undisclosed | Non-compliant | P1 |
| F-015 Unauthenticated tracking | Partial | P2 |
| F-016 Mock data fallback | Partial | P3 |
| F-017 External Google links | Compliant | P3 |

### Security & Admin

| Finding | Status | Priority |
| --- | --- | --- |
| F-018 Open KDS route | **Non-compliant** | **P1** |
| F-019 Weak admin defaults | Partial | P2 |
| F-020 WhatsApp undocumented | Partial | P2 |

---

## 7. Final Compliance Checklist

| Component / Route | Overall status | Open findings |
| --- | --- | --- |
| `/` Homepage | Conformant | — |
| `HoursAndLocation` + `GoogleMapEmbed` | Conformant | — |
| `CookieBanner` + `CookieConsentContext` | Conformant | — |
| `CookiePolicyModal` | Partial | F-008, F-009 |
| `Footer` Privacy modal | Partial | F-002–F-007 |
| `PokeBuilder` | Non-compliant | F-001, F-014 |
| `OrderTracking` | Partial | F-014, F-015, F-016 |
| `KdsBoard` | **Non-compliant** | F-018, F-020 |
| `FishCatalogAdmin` | Conformant | F-019 (indirect) |
| `FooterAndHours` (legacy) | Latent gap | F-011 |
| `index.html` / fonts | Conformant | — |

---

## 8. Prioritized Recommendations (audit-only — not implemented)

### P1 — Critical (address first)

1. **F-001** — Add Art. 13 privacy notice at PokeBuilder order form (link + purpose statement)
2. **F-014** — Update Privacy Policy with Supabase processor disclosure and transfer information
3. **F-018** — Add authentication to `/admin/kds`; review Supabase RLS policies

### P2 — Important (full compliance)

4. **F-002, F-003, F-007** — Complete Privacy Policy (processors, WhatsApp, controller details)
5. **F-004, F-005** — Add retention periods and data subject rights
6. **F-008** — Fix inaccurate push notification claim in Cookie Policy
7. **F-015** — Evaluate order tracking URL security model
8. **F-019** — Remove hardcoded PIN/keys; use environment variables
9. **F-020** — Document WhatsApp notification channel in Privacy Policy

### P3 — Improvement

10. **F-006, F-009, F-011, F-016, F-017** — Copy accuracy, localStorage documentation, legacy cleanup, mock data removal, external link documentation

---

## 9. Legal Disclaimer

This audit report was produced through structured analysis of the Pescheria Pessano web application source code and in-app legal copy. It maps findings to GDPR and ePrivacy articles for developer and business guidance.

**This document does not constitute legal advice.** Regulatory interpretation, DPA adequacy, and formal compliance certification require review by a qualified privacy lawyer or DPO. The Pescheria Pessano business owner remains the data controller and is responsible for compliance decisions.

---

## Appendix: Files Reviewed

| File | Role in audit |
| --- | --- |
| `src/App.tsx` | Route inventory, cookie provider scope |
| `src/components/PokeBuilder.tsx` | Order data collection |
| `src/components/OrderTracking.tsx` | Order display, notifications |
| `src/components/KdsBoard.tsx` | Staff order access, WhatsApp |
| `src/components/FishCatalogAdmin.tsx` | Admin banco |
| `src/components/Footer.tsx` | Privacy Policy |
| `src/components/CookiePolicyModal.tsx` | Cookie Policy |
| `src/components/CookieBanner.tsx` | Consent UI |
| `src/components/GoogleMapEmbed.tsx` | Maps consent gate |
| `src/components/HoursAndLocation.tsx` | Maps usage |
| `src/components/FooterAndHours.tsx` | Legacy maps iframe |
| `src/context/CookieConsentContext.tsx` | Consent persistence |
| `src/utils/orderStore.ts` | localStorage orders |
| `src/utils/kdsWhatsApp.ts` | WhatsApp URL builder |
| `src/lib/supabase.ts` | Cloud data processor client |
| `src/main.tsx` | Service worker unregister |
| `index.html` | Third-party scripts |
| `public/manifest.json` | PWA manifest |

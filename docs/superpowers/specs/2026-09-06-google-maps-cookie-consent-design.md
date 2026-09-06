# Google Maps cookie consent (banner globale + click-to-load)

**Date:** 2026-09-06  
**Status:** Approved for implementation

## Problem

The site embeds Google Maps via iframe in `HoursAndLocation.tsx`. The iframe loads immediately on page visit, causing Google to set third-party cookies before any user consent. The current Cookie Policy in `Footer.tsx` incorrectly states that no third-party cookies are used and that no consent banner is required.

## Goals

1. **GDPR/ePrivacy compliance** — load Google Maps only after explicit user consent.
2. **Global cookie banner** — fixed bottom bar on first visit, visible on all public pages.
3. **Auto-load map on accept** — when the user accepts from the banner, the map iframe loads immediately (no second click on the map placeholder).
4. **Modern, on-brand UI** — match existing ocean/coral/cream design system; work well on mobile.
5. **Updated legal copy** — Cookie Policy, footer pill, and "Gestisci cookie" link to revoke/reopen preferences.

## Non-goals

- Third-party CMP integration (Iubenda, Cookiebot, etc.).
- Granular multi-category cookie manager (Analytics, Marketing, etc.) — only `maps` consent for now.
- Updating `FooterAndHours.tsx` (unused component; can align later).
- Static map fallback image generation.
- Cookie consent on admin routes (`/admin/kds`, `/admin/banco`) — banner shown on public pages only.

## Decisions (from brainstorming)

| Question | Choice |
|----------|--------|
| Consent scope | Global banner + map consent |
| On accept | Map auto-loads immediately |
| Banner style | Fixed bottom bar (discreet, non-blocking) |
| Architecture | React Context + dedicated components |

## UX — Cookie Banner

### When shown

- First visit when no consent record exists in `localStorage`.
- When user clicks "Gestisci cookie" in the footer (reopens banner with current preference pre-selected visually).

### When hidden

- After user clicks "Accetta" or "Rifiuta".
- On subsequent visits when `localStorage` has a stored consent record.

### Layout

| Element | Desktop | Mobile |
|---------|---------|--------|
| Position | `fixed; bottom: 0; left: 0; right: 0` | Same |
| Background | `--color-ocean-dark` with subtle top border (`rgba(255,255,255,0.1)`) | Same |
| Content | Text left, buttons right (horizontal) | Text top, buttons stacked full-width |
| Padding | `1rem 1.5rem` + `env(safe-area-inset-bottom)` | Same |
| z-index | `2000` (above PesceBot ~1500, below modals ~2500) | Same |
| Animation | Slide-up 300ms on enter | Same; disabled with `prefers-reduced-motion` |

### Copy

**Body:**
> Utilizziamo cookie tecnici e, solo con il tuo consenso, Google Maps per mostrarti la nostra posizione.

**Link:** "Cookie Policy" — opens existing footer cookie modal (via callback/context).

**Buttons:**
- "Rifiuta" — ghost/outline style, white border
- "Accetta" — `btn-coral`, primary action

### Actions

| Button | Effect |
|--------|--------|
| Accetta | Save `{ maps: true, timestamp }` → hide banner → all `GoogleMapEmbed` instances load iframe |
| Rifiuta | Save `{ maps: false, timestamp }` → hide banner → placeholders remain |

## UX — Map Placeholder (`GoogleMapEmbed`)

Replaces the raw iframe in `HoursAndLocation.tsx`. Keeps existing `.map-embed` dimensions (240px mobile, 320px desktop).

### Without consent (`maps: false` or no record yet)

- Gradient background (ocean-dark → sand tones)
- Subtle grid/map pattern overlay (CSS, no image asset)
- `MapPin` icon in coral circle
- Address: "Via Avvocato Emanuele Rossi, 17 — 17024 Finale Ligure (SV)"
- Hint text: "Accetta i cookie per visualizzare la mappa interattiva"
- Secondary link: "Apri in Google Maps" (external, always available)

### With consent (`maps: true`)

- Render Google Maps iframe (same embed URL as today)
- Fade-in transition on mount (respect `prefers-reduced-motion`)
- Same iframe attributes: `title`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`, `allowFullScreen={false}`

### Pending state (banner visible, no choice yet)

- Show placeholder (same as without consent)
- Do NOT load iframe until user accepts

## Architecture

```
App.tsx
  └─ CookieConsentProvider
       ├─ CookieBanner (mounted on public layout routes)
       ├─ HoursAndLocation
       │    └─ GoogleMapEmbed
       └─ Footer (policy copy + "Gestisci cookie")
```

### `CookieConsentContext`

```typescript
type CookieConsent = {
  maps: boolean;
  timestamp: string; // ISO 8601
};

type CookieConsentContextValue = {
  consent: CookieConsent | null;        // null = not yet chosen
  hasChosen: boolean;
  acceptMaps: () => void;
  rejectMaps: () => void;
  reopenBanner: () => void;             // sets showBannerOverride = true
  openCookiePolicy: () => void;         // callback registered by Footer
  showBanner: boolean;                  // true when !hasChosen OR showBannerOverride
};
```

**Storage key:** `pessano_cookie_consent`  
**Format:** JSON string of `CookieConsent`

On mount: read from `localStorage`. If parse fails or missing, `consent = null`, `hasChosen = false`.

**Provider scope:** wraps the entire `<Routes>` tree in `App.tsx` so the banner appears on `/`, `/componi-poke`, and `/ordine/:id`. Admin routes (`/admin/*`) also receive the provider but the banner is acceptable there too (minimal extra surface).

**Reopen flow:** "Gestisci cookie" sets `showBannerOverride = true`. Banner reappears with current choice reflected in UI (no pre-checked toggle needed — user simply clicks Accetta or Rifiuta again). New choice overwrites `localStorage`. If user switches from accept → reject, `GoogleMapEmbed` unmounts the iframe and returns to placeholder immediately.

### `CookieBanner`

- Consumes context
- Renders only when `!hasChosen || bannerReopened`
- `bannerReopened` is a local state flag set by `reopenBanner()` from footer

### `GoogleMapEmbed`

Props:
```typescript
type GoogleMapEmbedProps = {
  embedUrl: string;
  externalMapsUrl: string;
  title?: string;
};
```

Renders iframe when `consent?.maps === true`.

## Footer Updates

### Cookie Policy modal — replace/add sections

1. **Cookie tecnici (sempre attivi):** `localStorage` for order state and push notifications. No consent required.
2. **Font (sempre attivi, nessuna terza parte):** Playfair Display, Plus Jakarta Sans e Barlow Condensed sono self-hosted. Nessuna richiesta a Google Fonts.
3. **Google Maps (consenso richiesto):** Google Ireland Limited provides interactive map. May set third-party cookies. Purpose: show store location. Legal basis: consent. Links to [Google Privacy Policy](https://policies.google.com/privacy) and [Google Cookie Info](https://policies.google.com/technologies/cookies).
4. **Revoca consenso:** use "Gestisci cookie" link in footer.
5. Remove claim that no consent banner is needed.

### Footer pill text

From:
> Non utilizza cookie di profilazione o tracciamento utenti.

To:
> Utilizza solo cookie tecnici. Google Maps viene caricato solo previo consenso.

### New footer link

"Gestisci cookie" — calls `reopenBanner()` from context.

## Files

| File | Action |
|------|--------|
| `src/context/CookieConsentContext.tsx` | **Create** — provider, hook, localStorage persistence |
| `src/components/CookieBanner.tsx` | **Create** — bottom bar UI |
| `src/components/GoogleMapEmbed.tsx` | **Create** — placeholder + conditional iframe |
| `src/components/HoursAndLocation.tsx` | **Modify** — replace iframe with `<GoogleMapEmbed />` |
| `src/components/Footer.tsx` | **Modify** — policy text, pill, "Gestisci cookie", wire `openCookiePolicy` |
| `src/App.tsx` | **Modify** — wrap public routes with provider, mount banner |
| `src/index.css` | **Modify** — `.cookie-banner`, `.map-placeholder` styles |

## Constants

```typescript
export const MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2864.578684074211!2d8.3414!3d44.1685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12d31705e608034d%3A0xb35a0cfb2e652d5!2sVia%20Avvocato%20Emanuele%20Rossi%2C%2017%2C%2017024%20Finale%20Ligure%20SV!5e0!3m2!1sit!2sit!4v1700000000000!5m2!1sit!2sit';

export const MAPS_EXTERNAL_URL =
  'https://www.google.com/maps/search/?api=1&query=Pescheria+Pessano+Via+Avvocato+Emanuele+Rossi+17+Finale+Ligure';

export const COOKIE_CONSENT_KEY = 'pessano_cookie_consent';
```

## Accessibility

- Banner: `role="dialog"`, `aria-label="Preferenze cookie"`, `aria-live="polite"`
- Focus trap not required (non-blocking bar; user can still navigate)
- Buttons: min height 44px on mobile
- Placeholder: semantic address in `<address>` element
- External link: `target="_blank"` + `rel="noopener noreferrer"`

## Testing Checklist

- [ ] First visit: banner visible, map shows placeholder
- [ ] Accept: banner hides, map iframe loads with fade-in
- [ ] Reject: banner hides, placeholder remains with external link
- [ ] Reload after accept: no banner, map loads immediately
- [ ] Reload after reject: no banner, placeholder shown
- [ ] "Gestisci cookie" reopens banner; new choice updates state
- [ ] "Cookie Policy" link from banner opens footer modal
- [ ] Mobile: buttons stack, safe-area respected
- [ ] `prefers-reduced-motion`: no slide/fade animations
- [ ] `/componi-poke` page also shows banner on first visit

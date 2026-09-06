import React from 'react';
import { useCookieConsent } from '../context/CookieConsentContext';

export const CookieBanner: React.FC = () => {
  const { showBanner, acceptMaps, rejectMaps, openCookiePolicy } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-label="Preferenze cookie"
      aria-live="polite"
    >
      <div className="cookie-banner__inner container">
        <p className="cookie-banner__text">
          Utilizziamo cookie tecnici e, solo con il tuo consenso, Google Maps per mostrarti la nostra posizione.{' '}
          <button type="button" className="cookie-banner__policy-link" onClick={openCookiePolicy}>
            Cookie Policy
          </button>
        </p>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-banner__btn cookie-banner__btn--ghost" onClick={rejectMaps}>
            Rifiuta
          </button>
          <button type="button" className="cookie-banner__btn btn btn-coral" onClick={acceptMaps}>
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
};

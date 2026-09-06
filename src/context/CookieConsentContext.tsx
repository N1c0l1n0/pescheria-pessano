import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { COOKIE_CONSENT_KEY } from '../constants/cookieConsent';

export type CookieConsent = {
  maps: boolean;
  timestamp: string;
};

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  hasChosen: boolean;
  showBanner: boolean;
  cookiePolicyOpen: boolean;
  privacyPolicyOpen: boolean;
  acceptMaps: () => void;
  rejectMaps: () => void;
  reopenBanner: () => void;
  openCookiePolicy: () => void;
  closeCookiePolicy: () => void;
  openPrivacyPolicy: () => void;
  closePrivacyPolicy: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (typeof parsed.maps !== 'boolean' || typeof parsed.timestamp !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasChosen, setHasChosen] = useState(false);
  const [showBannerOverride, setShowBannerOverride] = useState(false);
  const [cookiePolicyOpen, setCookiePolicyOpen] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasChosen(true);
    }
    setHydrated(true);
  }, []);

  const saveChoice = useCallback((maps: boolean) => {
    const next: CookieConsent = {
      maps,
      timestamp: new Date().toISOString(),
    };
    persistConsent(next);
    setConsent(next);
    setHasChosen(true);
    setShowBannerOverride(false);
  }, []);

  const acceptMaps = useCallback(() => saveChoice(true), [saveChoice]);
  const rejectMaps = useCallback(() => saveChoice(false), [saveChoice]);

  const reopenBanner = useCallback(() => {
    setShowBannerOverride(true);
  }, []);

  const openCookiePolicy = useCallback(() => {
    setCookiePolicyOpen(true);
  }, []);

  const closeCookiePolicy = useCallback(() => {
    setCookiePolicyOpen(false);
  }, []);

  const openPrivacyPolicy = useCallback(() => setPrivacyPolicyOpen(true), []);
  const closePrivacyPolicy = useCallback(() => setPrivacyPolicyOpen(false), []);

  const showBanner = hydrated && (!hasChosen || showBannerOverride);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasChosen,
      showBanner,
      cookiePolicyOpen,
      privacyPolicyOpen,
      acceptMaps,
      rejectMaps,
      reopenBanner,
      openCookiePolicy,
      closeCookiePolicy,
      openPrivacyPolicy,
      closePrivacyPolicy,
    }),
    [
      consent,
      hasChosen,
      showBanner,
      cookiePolicyOpen,
      privacyPolicyOpen,
      acceptMaps,
      rejectMaps,
      reopenBanner,
      openCookiePolicy,
      closeCookiePolicy,
      openPrivacyPolicy,
      closePrivacyPolicy,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

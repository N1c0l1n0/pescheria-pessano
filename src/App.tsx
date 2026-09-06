import { useEffect, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FishMenuCatalog } from './components/FishMenuCatalog';
import { TrustSection } from './components/TrustSection';
import { InfoSection } from './components/InfoSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';
import { OrderTracking } from './components/OrderTracking';
import { PokeBuilderPage } from './pages/PokeBuilderPage';
import { KdsBoard } from './components/KdsBoard';
import { FishCatalogAdmin } from './components/FishCatalogAdmin';
import { CookieConsentProvider, useCookieConsent } from './context/CookieConsentContext';
import { CookieBanner } from './components/CookieBanner';
import { CookiePolicyModal } from './components/CookiePolicyModal';
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

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [pathname, hash]);

  return null;
}

export function App() {
  return (
    <CookieConsentProvider>
      <CookieConsentShell>
        <ScrollToHash />
        <Routes>
        <Route
          path="/"
          element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Header />
              
              <main style={{ flex: 1 }}>
                <Hero />
                <FishMenuCatalog />
                <TrustSection />
                <InfoSection />
                <HoursAndLocation />
              </main>

              <Footer />
            </div>
          }
        />
        <Route path="/componi-poke" element={<PokeBuilderPage />} />
        <Route path="/ordine/:id" element={<OrderTracking />} />
        <Route path="/admin/kds" element={<KdsBoard />} />
        <Route path="/admin/banco" element={<FishCatalogAdmin />} />
      </Routes>
      </CookieConsentShell>
    </CookieConsentProvider>
  );
}

export default App;


import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FishMenuCatalog } from './components/FishMenuCatalog';
import { InfoSection } from './components/InfoSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';
import { OrderTracking } from './components/OrderTracking';
import { PokeBuilderPage } from './pages/PokeBuilderPage';
import { KdsBoard } from './components/KdsBoard';
import { initOneSignal } from './lib/onesignal';
import { OneSignalVerificationModal } from './components/OneSignalVerificationModal';

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
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);

  useEffect(() => {
    initOneSignal((shouldShow) => {
      setShowVerificationModal(shouldShow);
    });
  }, []);

  return (
    <>
      <ScrollToHash />
      <OneSignalVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Header />
              
              <main style={{ flex: 1 }}>
                <Hero />
                <FishMenuCatalog />
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
      </Routes>
    </>
  );
}

export default App;


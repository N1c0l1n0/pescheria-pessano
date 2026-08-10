import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { InfoSection } from './components/InfoSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';
import { OrderTracking } from './components/OrderTracking';
import { PokeBuilderPage } from './pages/PokeBuilderPage';
import { KdsBoard } from './components/KdsBoard';

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            
            <main style={{ flex: 1 }}>
              <Hero />
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
  );
}

export default App;

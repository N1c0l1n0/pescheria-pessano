import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PokeBuilder } from './components/PokeBuilder';
import { InfoSection } from './components/InfoSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main style={{ flex: 1 }}>
        <Hero />
        <PokeBuilder />
        <InfoSection />
        <HoursAndLocation />
      </main>

      <Footer />
    </div>
  );
}

export default App;

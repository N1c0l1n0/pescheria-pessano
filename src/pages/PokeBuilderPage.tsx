import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Header } from '../components/Header';
import { PokeBuilder } from '../components/PokeBuilder';
import { Footer } from '../components/Footer';

export const PokeBuilderPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F1F5F9', width: '100%', overflowX: 'hidden' }}>
      <Header />

      <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
        {/* Top Banner / Breadcrumb */}
        <div
          style={{
            backgroundColor: '#0B2545',
            color: 'white',
            padding: '6.5rem 0 2.25rem 0',
            borderBottom: '1px solid rgba(141, 169, 196, 0.2)',
          }}
        >
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#8DA9C4',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '1rem',
                transition: 'color 0.2s',
              }}
            >
              <ArrowLeft size={16} /> Torna alla Homepage
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(255, 107, 107, 0.2)',
                  color: '#FF6B6B',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 107, 107, 0.4)',
                }}
              >
                <Sparkles size={14} /> Pesce Fresco del Giorno
              </span>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  lineHeight: 1.2,
                }}
              >
                Ordina d'Asporto Online
              </h1>
            </div>
            <p style={{ color: '#CBD5E1', margin: '0.5rem 0 0 0', fontSize: '0.95rem', maxWidth: '700px' }}>
              Ordina online per l'asporto: componi la tua Poke su misura, ordina i coni di fritto espresso caldi e croccanti, oppure prenota il pesce fresco del giorno con pulizia e sfilettatura dedicata. Segui la preparazione in tempo reale!
            </p>
          </div>
        </div>

        {/* Dedicated Poke Builder Section */}
        <PokeBuilder />
      </main>

      <Footer />
    </div>
  );
};

export default PokeBuilderPage;

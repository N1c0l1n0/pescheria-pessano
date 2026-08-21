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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-sand)', width: '100%', overflowX: 'hidden' }}>
      <Header />

      <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
        {/* Top Banner / Breadcrumb */}
        <div className="page-banner">
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--color-gold-soft)',
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
                  backgroundColor: 'rgba(232, 93, 82, 0.16)',
                  color: '#F8A9A3',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(232, 93, 82, 0.35)',
                }}
              >
                <Sparkles size={14} /> Pesce Fresco del Giorno
              </span>
              <h1
                className="font-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                }}
              >
                Ordina d'Asporto Online
              </h1>
            </div>
            <p style={{ color: 'rgba(203, 213, 225, 0.92)', margin: '0.7rem 0 0 0', fontSize: '1rem', maxWidth: '700px', lineHeight: 1.65 }}>
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

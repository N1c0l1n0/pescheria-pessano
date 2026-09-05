import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Star, Clock, Anchor, Sparkles } from 'lucide-react';
import { getStoreStatus } from '../utils/openingHours';

export const Hero: React.FC = () => {
  const status = getStoreStatus();

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #041221 0%, #0A2342 48%, #123A66 100%)',
        color: 'white',
        paddingTop: '8.75rem',
        paddingBottom: '6.5rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(141, 169, 196, 0.14) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(232, 93, 82, 0.06) 0%, transparent 45%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '3.25rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.38rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(232, 212, 154, 0.28)',
                backdropFilter: 'blur(10px)',
                marginBottom: '1.6rem',
                fontSize: 'clamp(0.725rem, 3vw, 0.84rem)',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-gold-soft)', fontWeight: 700 }}>
                <Star size={14} fill="currentColor" />
                <span>4.4 / 5</span>
              </div>
              <span style={{ opacity: 0.35 }}>|</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.88)', fontWeight: 500 }}>
                197 Recensioni
              </span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span style={{ color: 'var(--color-sea-blue)', fontWeight: 600 }}>
                Finale Ligure
              </span>
            </div>

            <p
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-gold-soft)',
                marginBottom: '0.85rem',
              }}
            >
              Pescheria storica · Mar Ligure
            </p>

            <h1
              className="font-serif heading-gradient"
              style={{
                fontSize: 'clamp(2.35rem, 5.2vw, 4.15rem)',
                fontWeight: 700,
                lineHeight: 1.18,
                marginBottom: '1.15rem',
                letterSpacing: '-0.035em',
              }}
            >
              Il sapore autentico del mare, ogni giorno.
            </h1>

            <div className="hairline-gold" style={{ marginBottom: '1.35rem' }} />

            <p
              style={{
                fontSize: '1.12rem',
                color: 'rgba(255, 255, 255, 0.82)',
                marginBottom: '2.15rem',
                lineHeight: 1.7,
                fontWeight: 400,
                maxWidth: '34rem',
              }}
            >
              Pesce fresco selezionato del Mar Ligure e gastronomia pronta della tradizione, nel cuore di Finale Ligure.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '2.4rem',
              }}
            >
              <Link
                to="/componi-poke"
                className="btn btn-coral"
                style={{ fontSize: '1rem', padding: '0.95rem 1.75rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                <Sparkles size={18} />
                <span>Componi la tua Poke</span>
              </Link>

              <Link
                to="/componi-poke?tab=fritti"
                className="btn btn-outline-light"
                style={{ fontSize: '0.95rem', padding: '0.9rem 1.45rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                <span>Ordina Fritti d'Asporto</span>
              </Link>

              <a
                href="tel:019692623"
                className="btn btn-ghost-light"
                style={{ fontSize: '0.925rem', whiteSpace: 'nowrap' }}
              >
                <Phone size={16} color="var(--color-sea-blue)" />
                <span>019 692623</span>
              </a>

              <a
                href="#orari"
                className="btn btn-ghost-light"
                style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
              >
                <Clock size={16} color="var(--color-sea-blue)" />
                <span>Orari & Mappa</span>
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                paddingTop: '1.4rem',
                borderTop: '1px solid rgba(232, 212, 154, 0.16)',
                flexWrap: 'wrap',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.9)', whiteSpace: 'nowrap' }}>
                <MapPin size={16} color="var(--color-gold-soft)" />
                <span>Via Avvocato Emanuele Rossi, 17</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: status.isOpen ? '#22C55E' : '#EF4444',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 700, color: status.isOpen ? '#4ADE80' : '#F87171' }}>
                  {status.message}
                </span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({status.nextEventText})
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <img
                src="/hero_pescheria.jpg"
                alt="Pescheria Pessano Finale Ligure Banco Pesce Fresco"
                style={{
                  width: '100%',
                  height: '420px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  right: '1rem',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(11, 37, 69, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <Anchor size={22} color="var(--color-coral)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                    Banco del Pesce Fresco
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-sea-blue)' }}>
                    Acciughe del Mar Ligure & pescato del giorno
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-wave" />

      <style>{`
        @media (min-width: 992px) {
          .hero-grid {
            grid-template-columns: 1.12fr 0.88fr !important;
          }
        }
      `}</style>
    </section>
  );
};

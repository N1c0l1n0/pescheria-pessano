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
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0B2545 0%, #134074 65%, #081B33 100%)',
        color: 'white',
        paddingTop: '8.5rem',
        paddingBottom: '4rem',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(141, 169, 196, 0.15) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(255, 107, 107, 0.08) 0%, transparent 45%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '3rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Main Info Text */}
          <div style={{ maxWidth: '640px' }}>
            

            {/* Rating Badge - Guaranteed Single Line */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                marginBottom: '1.75rem',
                fontSize: 'clamp(0.725rem, 3vw, 0.85rem)',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#FBBF24', fontWeight: 700 }}>
                <Star size={15} fill="#FBBF24" />
                <span>4.4 / 5</span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                197 Recensioni
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ color: 'var(--color-sea-blue)', fontWeight: 600 }}>
                Finale Ligure
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-serif heading-gradient"
              style={{
                fontSize: 'clamp(2.2rem, 4.8vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              Il sapore autentico del mare di Finale Ligure, ogni giorno.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '1.125rem',
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '2.25rem',
                lineHeight: 1.65,
                fontWeight: 400,
              }}
            >
              Pescheria storica con pesce fresco selezionato del Mar Ligure e prelibati piatti di gastronomia pronta.
            </p>

            {/* Contact & Status CTA Buttons - Front Page Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '2.5rem',
              }}
            >
              <Link
                to="/componi-poke"
                className="btn btn-coral"
                style={{ fontSize: '1rem', padding: '0.9rem 1.8rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                <Sparkles size={18} />
                <span>Componi la tua Poke</span>
              </Link>

              <Link
                to="/componi-poke?tab=fritti"
                className="btn btn-outline-light"
                style={{ fontSize: '0.95rem', padding: '0.85rem 1.5rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
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

            {/* Address & Today Status Quick Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                flexWrap: 'wrap',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.9)', whiteSpace: 'nowrap' }}>
                <MapPin size={17} color="var(--color-sea-blue)" />
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
                <span style={{ fontWeight: 700, color: status.isOpen ? '#22C55E' : '#EF4444' }}>
                  {status.message}
                </span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({status.nextEventText})
                </span>
              </div>
            </div>

          </div>

          {/* Hero Visual Card */}
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
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(11, 37, 69, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <Anchor size={24} color="var(--color-coral)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                    Banco del Pesce Fresco Pessano
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)' }}>
                    Acciughe del Mar Ligure & Pescato del Giorno
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .hero-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </section>
  );
};

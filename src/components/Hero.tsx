import React from 'react';
import { MapPin, Star, Clock, Anchor, Sparkles, MessageCircle } from 'lucide-react';
import { FEATURES } from '../constants/features';
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
            maxWidth: '820px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
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

          <div className="hairline-gold" style={{ marginBottom: '1.35rem', marginLeft: 'auto', marginRight: 'auto' }} />

          <p
            style={{
              fontSize: '1.12rem',
              color: 'rgba(255, 255, 255, 0.82)',
              marginBottom: '2.15rem',
              lineHeight: 1.7,
              fontWeight: 400,
              maxWidth: '36rem',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Pesce fresco selezionato del Mar Ligure e gastronomia pronta della tradizione, nel cuore di Finale Ligure.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              marginBottom: '2.4rem',
            }}
          >
            <a
              href="#poke-fritti"
              className="btn btn-coral"
              style={{ fontSize: '1rem', padding: '0.95rem 1.75rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              <Sparkles size={18} />
              <span>Poke Bowl & Coni Fritti</span>
            </a>

            <a
              href="#pesce-fresco"
              className="btn btn-outline-light"
              style={{ fontSize: '0.95rem', padding: '0.9rem 1.45rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              <Anchor size={16} />
              <span>Banco Pesce Fresco</span>
            </a>

            <a
              href={FEATURES.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-hero"
              title="Prenota su WhatsApp (+39 345 948 5857)"
              aria-label="Invia messaggio WhatsApp per prenotare al +39 345 948 5857"
            >
              <MessageCircle size={17} color="#25D366" strokeWidth={2.2} />
              <span>Prenota su WhatsApp</span>
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
              justifyContent: 'center',
              gap: '1.25rem',
              paddingTop: '1.4rem',
              borderTop: '1px solid rgba(232, 212, 154, 0.16)',
              flexWrap: 'wrap',
              fontSize: '0.875rem',
              width: '100%',
              maxWidth: '560px',
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
      </div>

      <div className="hero-wave" />
    </section>
  );
};

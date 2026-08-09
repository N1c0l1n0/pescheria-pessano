import React from 'react';
import { ShieldCheck, Utensils, ShoppingBag, Anchor } from 'lucide-react';

export const InfoSection: React.FC = () => {
  return (
    <section
      id="servizi"
      style={{
        padding: '5rem 0',
        backgroundColor: 'var(--color-ice-blue)',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-ocean-medium)',
              marginBottom: '0.5rem',
            }}
          >
            Pescheria & Gastronomia Storica
          </div>

          <h2
            className="font-serif heading-dark-gradient"
            style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            I Nostri Servizi Principali
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Selezioniamo ogni mattina il miglior pesce del nostro mare con la passione e l'esperienza che da sempre contraddistinguono la Pescheria Pessano.
          </p>
        </div>

        {/* 3 Minimalist Service Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* Card 1: Pesce Fresco */}
          <div
            className="glass-panel"
            style={{
              padding: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white',
              border: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(11, 37, 69, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Anchor size={28} color="var(--color-ocean-dark)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.85rem',
              }}
            >
              Pesce Fresco del Giorno
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Pescato locale selezionato ogni mattina: Orate, Spigole selvagge, Gamberi Rossi di Sanremo, Calamari nostrani ed acciughe del Golfo.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Svisceratura e pulizia gratuita
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Sfilettatura su richiesta
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Filiera corta e pescato locale
              </li>
            </ul>
          </div>

          {/* Card 2: Gastronomia Pronta */}
          <div
            className="glass-panel"
            style={{
              padding: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white',
              border: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 107, 107, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Utensils size={28} color="var(--color-coral)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.85rem',
              }}
            >
              Gastronomia Pronta
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Piatti pronti della tradizione marinara ligure preparati quotidianamente nel nostro laboratorio artigianale con ingredienti freschissimi.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Cappon Magro Tradizionale Ligure
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Fritto Misto croccante di Mare
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Insalata di mare e primi piatti
              </li>
            </ul>
          </div>

          {/* Card 3: Prenotazione & Asporto */}
          <div
            className="glass-panel"
            style={{
              padding: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white',
              border: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(141, 169, 196, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <ShoppingBag size={28} color="var(--color-sea-blue)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.85rem',
              }}
            >
              Prenotazione & Asporto
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Prenota il tuo pesce fresco, le tue poke o i tuoi piatti di gastronomia per un ritiro rapido e comodo in pescheria senza attese.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Ritiro rapido zero attese
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Ordinazione diretta WhatsApp
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Pesce già pulito e confezionato
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};

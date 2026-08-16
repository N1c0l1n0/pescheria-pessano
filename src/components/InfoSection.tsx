import React from 'react';
import { ShieldCheck, Utensils, ShoppingBag, Anchor, Sparkles } from 'lucide-react';

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
            Dal pesce fresco del nostro mare alla preparazione di Poke personalizzate e piatti pronti della tradizione: scopri tutti i servizi della Pescheria Pessano.
          </p>
        </div>

        {/* 4 Minimalist Service Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1: Pesce Fresco */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
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
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(11, 37, 69, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Anchor size={26} color="var(--color-ocean-dark)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
              }}
            >
              Pesce Fresco del Giorno
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.925rem', marginBottom: '1.25rem' }}>
              Pescato locale selezionato ogni mattina: Acciughe del Golfo, Orate, Branzini selvaggi, Gamberi Rossi e Calamari nostrani.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
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

          {/* Card 2: Poke Bowl Artigianali */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
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
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 107, 107, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={26} color="var(--color-coral)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
              }}
            >
              Poke Bowl Artigianali
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.925rem', marginBottom: '1.25rem' }}>
              Componi online la tua Poke Bowl personalizzata con pesce fresco a cubetti, riso, topping selezionati e salse artigianali.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Composizione online su misura
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Pesce fresco tagliato al momento
              </li>

            </ul>
          </div>

          {/* Card 3: Gastronomia Pronta */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
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
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(19, 64, 116, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Utensils size={26} color="var(--color-ocean-medium)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
              }}
            >
              Gastronomia Pronta
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.925rem', marginBottom: '1.25rem' }}>
              Piatti pronti della tradizione marinara ligure preparati quotidianamente nel nostro laboratorio artigianale con ingredienti freschissimi.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
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

          {/* Card 4: Ordini Online & Tracciamento */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
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
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(141, 169, 196, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <ShoppingBag size={26} color="var(--color-sea-blue)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
              }}
            >
              Ordini Online & Asporto
            </h3>

            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.925rem', marginBottom: '1.25rem' }}>
              Ordina facilmente dal sito per un ritiro rapido senza attese. Segui lo stato di preparazione in tempo reale con notifiche dedicate.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Ritiro rapido zero attese
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Tracciamento ordine live sul sito
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" /> Confezionamento salvafreschezza
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};
